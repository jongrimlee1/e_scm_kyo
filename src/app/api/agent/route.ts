import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { miniMaxClient, MiniMaxMessage } from '@/lib/ai/client';
import { SYSTEM_PROMPT, DB_SCHEMA, BUSINESS_RULES } from '@/lib/ai/schema';

interface AgentRequest {
  message: string;
  context?: {
    userId?: string;
    userRole?: string;
    branchId?: string;
  };
}

function log(msg: string, data?: any) {
  console.log(`[Agent] ${msg}`, data || '');
}

function parseNaturalLanguageIntent(userMessage: string, aiResponse: string): any {
  const msg = userMessage.toLowerCase();
  const combined = (userMessage + ' ' + aiResponse).toLowerCase();
  
  if (msg.includes('뭐') || msg.includes('무엇') || msg.includes('어떤') || 
      (msg.includes('할') && msg.includes('수')) || msg.includes('도움') ||
      msg.includes('기능') || msg.includes('능력')) {
    return { 
      operation: 'info', 
      data: { 
        message: 'AI 어시스턴트가 도와드릴 수 있습니다:\n• 고객 조회/검색/등록\n• 재고 이동/조정/입출고\n• 포인트 적립/사용/조회\n• 제품 검색\n• 지점 조회\n• 판매 주문 조회'
      } 
    };
  }
  
  if (combined.includes('고객') || msg.includes('고객')) {
    if (msg.includes('없') || msg.includes('찾') || msg.includes('검색')) {
      return { operation: 'customer_query', data: { search: '' } };
    }
    const nameMatch = userMessage.match(/(?:([가-힣]{2,4})동|([가-힣]{2,4})님)/);
    const searchName = nameMatch ? (nameMatch[1] || nameMatch[2]) : null;
    return { operation: 'customer_query', data: { search: searchName } };
  }
  
  if (combined.includes('재고') && combined.includes('이동')) {
    return { operation: 'inventory_transfer', data: {} };
  }
  
  if (combined.includes('재고') && (combined.includes('조회') || combined.includes('확인'))) {
    return { operation: 'product_query', data: {} };
  }
  
  if (combined.includes('포인트') && combined.includes('조회')) {
    return { operation: 'point_query', data: {} };
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    log('Request received');

    const body: AgentRequest = await req.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: '메시지가 필요합니다.' }, { status: 400 });
    }

    log('Message received', message);

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${DB_SCHEMA}\n\n${BUSINESS_RULES}\n\n== 현재 사용자 context ==\n${context?.userId ? `사용자 ID: ${context.userId}` : ''}\n${context?.userRole ? `역할: ${context.userRole}` : ''}\n${context?.branchId ? `지점 ID: ${context.branchId}` : ''}\n\n== 사용자 명령 ==\n${message}\n\n## 중요: 반드시 JSON으로만 응답하세요\n아래 예시처럼 JSON 객체 하나만 출력하세요. 다른 텍스트를 절대 추가하지 마세요.\n\n예시:\n{"operation":"customer_query","data":{"search":"홍길동"}}\n{"operation":"info","message":"현재 재고는 100개입니다"}\n\noperation 가능한 값:\n- inventory_transfer (재고 이동)\n- inventory_adjust (재고 조정)\n- inventory_in (재고 입고)\n- inventory_out (재고 출고)\n- point_earn (포인트 적립)\n- point_use (포인트 사용)\n- point_query (포인트 조회)\n- customer_query (고객 조회)\n- customer_create (고객 등록)\n- order_query (주문 조회)\n- product_query (제품 조회)\n- branch_query (지점 조회)\n- info (일반 정보 조회)\n\n**JSON만 응답하세요. 설명이나 다른 텍스트 없이.**`;

    const messages: MiniMaxMessage[] = [
      { role: 'system', content: fullPrompt },
      { role: 'user', content: message },
    ];

    log('Calling MiniMax API...');
    const response = await miniMaxClient.chat(messages);
    log('MiniMax response received', response.substring(0, 300));

    const cleaned = response.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
    log('Cleaned response', cleaned.substring(0, 200));

    let intent;
    try {
      intent = JSON.parse(cleaned);
    } catch (e: any) {
      log('JSON parse error, trying fallback parser', e.message);
      intent = parseNaturalLanguageIntent(message, cleaned);
      if (!intent) {
        return NextResponse.json({
          type: 'error',
          message: '명령을 이해하지 못했습니다.',
          raw: response,
        });
      }
    }

    log('Parsed intent', intent);

    const { operation, data, requiresConfirmation, confirmationMessage } = intent;

    if (requiresConfirmation) {
      return NextResponse.json({
        type: 'confirm',
        message: confirmationMessage || '이 작업을 실행할까요?',
        operation,
        data,
      });
    }

    const supabase = await createClient();
    const result = await executeOperation(supabase, operation, data);

    return NextResponse.json({
      type: 'success',
      message: result.message,
    });
  } catch (error: any) {
    log('Error caught', error.message);
    log('Error stack', error.stack);
    return NextResponse.json({
      type: 'error',
      message: error.message || '에러가 발생했습니다.',
    }, { status: 500 });
  }
}

async function executeOperation(supabase: any, operation: string, data: Record<string, any>) {
  log('Executing operation', operation);

  switch (operation) {
    case 'inventory_transfer': {
      const { fromBranchId, toBranchId, productId, quantity, memo } = data;

      const fromInventory = await supabase
        .from('inventories')
        .select('id, quantity')
        .eq('branch_id', fromBranchId)
        .eq('product_id', productId)
        .single();

      if (!fromInventory.data || fromInventory.data.quantity < quantity) {
        throw new Error(`원래 지점 재고가 부족합니다. (현재: ${fromInventory.data?.quantity || 0})`);
      }

      await supabase.from('inventory_movements').insert({
        branch_id: fromBranchId,
        product_id: productId,
        movement_type: 'OUT',
        quantity: -quantity,
        memo: memo || `재고 이동: ${quantity}개`,
      });

      await supabase.from('inventories').update({
        quantity: fromInventory.data.quantity - quantity,
      }).eq('id', fromInventory.data.id);

      let toInventory = await supabase
        .from('inventories')
        .select('id, quantity')
        .eq('branch_id', toBranchId)
        .eq('product_id', productId)
        .single();

      if (toInventory.data) {
        await supabase.from('inventories').update({
          quantity: toInventory.data.quantity + quantity,
        }).eq('id', toInventory.data.id);
      } else {
        await supabase.from('inventories').insert({
          branch_id: toBranchId,
          product_id: productId,
          quantity: quantity,
        });
      }

      await supabase.from('inventory_movements').insert({
        branch_id: toBranchId,
        product_id: productId,
        movement_type: 'IN',
        quantity: quantity,
        memo: memo || `재고 이동: ${quantity}개`,
      });

      return {
        message: `재고 이동 완료: ${quantity}개 이동`,
        data: { fromBranchId, toBranchId, productId, quantity },
      };
    }

    case 'inventory_adjust': {
      const { branchId, productId, newQuantity, memo, reason } = data;

      let inventory = await supabase
        .from('inventories')
        .select('id, quantity')
        .eq('branch_id', branchId)
        .eq('product_id', productId)
        .single();

      if (!inventory.data) {
        await supabase.from('inventories').insert({
          branch_id: branchId,
          product_id: productId,
          quantity: newQuantity,
        });
        inventory = await supabase
          .from('inventories')
          .select('id, quantity')
          .eq('branch_id', branchId)
          .eq('product_id', productId)
          .single();
      } else {
        await supabase.from('inventories').update({
          quantity: newQuantity,
        }).eq('id', inventory.data.id);
      }

      await supabase.from('inventory_movements').insert({
        branch_id: branchId,
        product_id: productId,
        movement_type: 'ADJUST',
        quantity: newQuantity - (inventory.data?.quantity || 0),
        memo: memo || `재고 조정: ${reason || '직접 조정'}`,
      });

      return {
        message: `재고 조정 완료: ${inventory.data?.quantity || 0} -> ${newQuantity}`,
        data: { branchId, productId, oldQuantity: inventory.data?.quantity, newQuantity },
      };
    }

    case 'point_earn': {
      const { customerId, points, salesOrderId, description } = data;

      const lastHistory = await supabase
        .from('point_history')
        .select('balance')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentBalance = lastHistory?.balance || 0;
      const newBalance = currentBalance + points;

      await supabase.from('point_history').insert({
        customer_id: customerId,
        sales_order_id: salesOrderId || null,
        type: 'earn',
        points: points,
        balance: newBalance,
        description: description || `포인트 적립: ${points}P`,
      });

      return {
        message: `포인트 적립 완료: ${points}P (현재 잔액: ${newBalance}P)`,
        data: { customerId, points, newBalance },
      };
    }

    case 'point_use': {
      const { customerId, points, salesOrderId, description } = data;

      const lastHistory = await supabase
        .from('point_history')
        .select('balance')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentBalance = lastHistory?.balance || 0;

      if (currentBalance < points) {
        throw new Error(`포인트가 부족합니다. (보유: ${currentBalance}P, 사용 요청: ${points}P)`);
      }

      const newBalance = currentBalance - points;

      await supabase.from('point_history').insert({
        customer_id: customerId,
        sales_order_id: salesOrderId || null,
        type: 'use',
        points: -points,
        balance: newBalance,
        description: description || `포인트 사용: ${points}P`,
      });

      return {
        message: `포인트 사용 완료: ${points}P 차감 (현재 잔액: ${newBalance}P)`,
        data: { customerId, points, newBalance },
      };
    }

    case 'customer_create': {
      const { name, phone, email, grade, primaryBranchId, source } = data;

      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          name,
          phone,
          email: email || null,
          grade: grade || 'NORMAL',
          primary_branch_id: primaryBranchId || null,
          source: source || 'DIRECT',
        })
        .select()
        .single();

      if (error) throw new Error(`고객 등록 실패: ${error.message}`);

      return {
        message: `고객 등록 완료: ${name} (${phone})`,
        data: customer,
      };
    }

    case 'product_query': {
      const { search, limit } = data;
      let query = supabase.from('products').select('*').eq('is_active', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,barcode.ilike.%${search}%`);
      }

      const { data: products, error } = await query.limit(limit || 20).order('name');

      if (error) throw new Error(`제품 조회 실패: ${error.message}`);

      if (!products || products.length === 0) {
        return {
          message: search ? `"${search}" 제품를 찾을 수 없습니다` : '등록된 제품이 없습니다',
        };
      }

      if (products.length === 1) {
        const p = products[0];
        return {
          message: `${p.name} (코드: ${p.code})을 찾았습니다. 가격은 ${p.price?.toLocaleString()}원입니다.${p.barcode ? ` 바코드: ${p.barcode}` : ''}`,
        };
      }

      const list = products.slice(0, 5).map((p: any, i: number) => `${i + 1}. ${p.name} - ${p.price?.toLocaleString()}원`).join('\n');
      return {
        message: `${products.length}개의 제품이 조회되었습니다:\n${list}${products.length > 5 ? '\n...이 외 ' + (products.length - 5) + '개' : ''}`,
      };
    }

    case 'customer_query': {
      const { search } = data;
      let query = supabase.from('customers').select('*, primary_branch:branches(name)').eq('is_active', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: customers, error } = await query.limit(20).order('created_at', { ascending: false });

      if (error) throw new Error(`고객 조회 실패: ${error.message}`);

      if (!customers || customers.length === 0) {
        return {
          message: search ? `"${search}" 고객을 찾을 수 없습니다` : '등록된 고객이 없습니다',
        };
      }

      if (customers.length === 1) {
        const c = customers[0];
        return {
          message: `${c.name} 고객을 찾았습니다. 전화번호는 ${c.phone}, 등급은 ${c.grade}입니다.${c.primary_branch ? ` 주요 지점은 ${c.primary_branch.name}입니다.` : ''}`,
        };
      }

      const list = customers.map((c: any, i: number) => `${i + 1}. ${c.name} (${c.phone}) - ${c.grade}`).join('\n');
      return {
        message: `${customers.length}명의 고객이 조회되었습니다:\n${list}`,
      };
    }

    case 'branch_query': {
      const { search } = data;
      let query = supabase.from('branches').select('*').eq('is_active', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }

      const { data: branches, error } = await query.order('name');

      if (error) throw new Error(`지점 조회 실패: ${error.message}`);

      if (!branches || branches.length === 0) {
        return {
          message: '등록된 지점이 없습니다',
        };
      }

      const list = branches.map((b: any, i: number) => `${i + 1}. ${b.name} (${b.code}) - ${b.channel}`).join('\n');
      return {
        message: `${branches.length}개의 지점이 있습니다:\n${list}`,
      };
    }

    case 'info': {
      return {
        message: 'AI 어시스턴트가 도와드릴 수 있습니다:\n• 고객 조회/검색/등록\n• 재고 이동/조정/입출고\n• 포인트 적립/사용/조회\n• 제품 검색\n• 지점 조회\n• 판매 주문 조회\n\n무엇을 도와드릴까요?',
      };
    }

    case 'point_query': {
      const { customerId, search } = data;
      if (customerId) {
        const { data: history } = await supabase
          .from('point_history')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!history || history.length === 0) {
          return { message: '적립된 포인트 내역이 없습니다.' };
        }
        const latest = history[0];
        return { message: `현재 ${latest.balance?.toLocaleString()}P가 적립되어 있습니다.` };
      }
      return {
        message: `포인트 조회할 고객 이름을 알려주세요`,
      };
    }

    default:
      return {
        message: `알 수 없는 작업입니다: ${operation}`,
        data: {},
      };
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Agent API is running',
    available_operations: [
      'inventory_transfer',
      'inventory_adjust',
      'inventory_in',
      'inventory_out',
      'point_earn',
      'point_use',
      'point_query',
      'customer_query',
      'customer_create',
      'order_query',
      'product_query',
      'branch_query',
    ],
  });
}
