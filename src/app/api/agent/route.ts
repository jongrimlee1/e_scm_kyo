import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { miniMaxClient, MiniMaxMessage } from '@/lib/ai/client';
import { AGENT_TOOLS, WRITE_TOOLS, executeTool } from '@/lib/ai/tools';
import { DB_SCHEMA, BUSINESS_RULES } from '@/lib/ai/schema';

const SYSTEM_PROMPT = `당신은 경옥채 사내 ERP 시스템의 AI 직원입니다.
사람 직원처럼 시스템의 모든 업무를 자연어로 처리할 수 있습니다.

== 처리 가능한 업무 ==
[조회] 재고현황·부족품목, 제품·지점 정보, 고객 검색·포인트이력, 판매주문·매출요약, 발주서·공급업체, 생산지시서
[재고] 입고/출고/실사 조정, 지점 간 이동
[고객] 신규 등록, 정보 수정, 등급 변경, 포인트 조정, 전체 자동 등급 업그레이드
[발주/매입] 발주서 작성 → 확정 → 입고 처리 (재고 자동 반영)
[생산] 지시서 생성 → 착수 → 완료 처리 (BOM 기준 재고 자동 반영)
[지점/제품] 지점 추가/수정, 제품 등록
[알림] 고객 SMS 발송

== 원칙 ==
1. 조회는 즉시 도구를 사용해 실제 데이터로 답변한다.
2. 데이터 변경(재고, 고객, 발주, 생산 등)은 사용자 확인 후 실행된다.
3. 모호한 필수 정보가 있으면 먼저 물어본다. (지점명, 수량, 단가 등)
4. 지점명/제품명/고객명은 정확히 몰라도 키워드로 먼저 조회해서 확인한 뒤 작업한다.
5. 업무 흐름: 발주 → 확정 → 입고, 생산지시 → 착수 → 완료 순서를 지킨다.
6. 역할이 BRANCH_STAFF/PHARMACY_STAFF이면 담당 지점 업무만 처리한다.
7. 숫자는 천 단위 쉼표로 표시하고, 금액은 "원"을 붙인다.
8. 결과는 핵심만 간결하게 정리해서 전달한다.
9. "DB에 직접 접근", "관리자 도구 사용" 같은 말은 절대 하지 않는다.

${DB_SCHEMA}
${BUSINESS_RULES}`;

interface AgentRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  context?: { userId?: string; userRole?: string; branchId?: string };
  confirm?: boolean;
  pending_action?: { tool: string; args: Record<string, any>; description: string };
}

export async function POST(req: NextRequest) {
  try {
    const body: AgentRequest = await req.json();
    const { message, history, context, confirm, pending_action } = body;

    if (!message && !confirm) {
      return NextResponse.json({ error: '메시지가 필요합니다.' }, { status: 400 });
    }

    const supabase = await createClient();

    // ── 확정된 쓰기 작업: LLM 없이 바로 실행 ────────────────────────────────
    if (confirm && pending_action) {
      const result = await executeTool(pending_action.tool, pending_action.args, supabase);
      const parsed = JSON.parse(result);
      if (parsed.error) {
        return NextResponse.json({ type: 'error', message: `❌ ${parsed.error}` });
      }
      const msg = parsed.메시지 || parsed.결과 || '작업이 완료되었습니다.';
      const detail = buildSuccessDetail(pending_action.tool, parsed);
      return NextResponse.json({ type: 'success', message: detail ? `✅ ${msg}\n\n${detail}` : `✅ ${msg}` });
    }

    // ── 사용자 컨텍스트 주입 ─────────────────────────────────────────────────
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: '시스템관리자', HQ_OPERATOR: '본사운영자',
      PHARMACY_STAFF: '약국직원', BRANCH_STAFF: '지점직원', EXECUTIVE: '임원',
    };
    const contextLines = [
      context?.userRole ? `역할: ${roleLabels[context.userRole] || context.userRole}` : '',
      context?.branchId ? `담당지점ID: ${context.branchId}` : '',
    ].filter(Boolean).join(' | ');

    const systemContent = contextLines
      ? `${SYSTEM_PROMPT}\n\n== 현재 사용자 == ${contextLines}`
      : SYSTEM_PROMPT;

    const messages: MiniMaxMessage[] = [
      { role: 'system', content: systemContent },
      ...(history || []).slice(-12).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // ── Agentic loop (최대 6회) ───────────────────────────────────────────────
    for (let i = 0; i < 6; i++) {
      const { message: responseMsg, finish_reason } = await miniMaxClient.chatWithTools(messages, AGENT_TOOLS);
      messages.push(responseMsg);

      if (finish_reason !== 'tool_calls' || !responseMsg.tool_calls?.length) {
        return NextResponse.json({
          type: 'success',
          message: stripThinkTags(responseMsg.content) || '처리 완료',
        });
      }

      for (const toolCall of responseMsg.tool_calls) {
        const toolName = toolCall.function.name;
        let args: Record<string, any> = {};
        try { args = JSON.parse(toolCall.function.arguments); } catch { args = {}; }

        // 쓰기 도구 → 확인 요청 반환
        if (WRITE_TOOLS.has(toolName)) {
          const description = buildConfirmDescription(toolName, args);
          return NextResponse.json({
            type: 'confirm',
            message: description,
            pending_action: { tool: toolName, args, description },
          });
        }

        // 읽기 도구 → 즉시 실행
        const result = await executeTool(toolName, args, supabase);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: result,
        });
      }
    }

    return NextResponse.json({ type: 'error', message: '응답 처리 중 문제가 발생했습니다. 다시 시도해주세요.' });

  } catch (error: any) {
    console.error('[Agent] Error:', error.message);
    return NextResponse.json({ type: 'error', message: error.message || '서버 오류' }, { status: 500 });
  }
}

function stripThinkTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function buildSuccessDetail(tool: string, parsed: any): string {
  switch (tool) {
    case 'upgrade_customer_grades':
      return parsed.상세?.length ? parsed.상세.slice(0, 5).join('\n') + (parsed.상세.length > 5 ? `\n외 ${parsed.상세.length - 5}명` : '') : '';
    case 'complete_production_order':
      return `완제품: ${parsed.완제품} ${parsed.생산량}개\n지점: ${parsed.지점}`;
    case 'receive_purchase_order':
      return `입고전표: ${parsed.입고전표}\n${(parsed.입고항목 || []).join(', ')}`;
    case 'create_purchase_order':
      return `발주번호: ${parsed.발주번호}\n${parsed.제품} ${parsed.수량}개 × ${parsed.단가} = ${parsed.합계}`;
    case 'create_production_order':
      return `지시번호: ${parsed.지시번호}\n소요재료: ${parsed.소요재료}`;
    case 'adjust_inventory':
      return `이전: ${parsed.이전재고}개 → 변경후: ${parsed.변경후재고}개`;
    case 'adjust_points':
      return `${parsed.이전잔액} → ${parsed.변경후잔액}`;
    default:
      return '';
  }
}

const CHANNEL_NAMES: Record<string, string> = { STORE: '한약국', DEPT_STORE: '백화점', ONLINE: '자사몰', EVENT: '이벤트' };
const GRADE_NAMES: Record<string, string> = { NORMAL: '일반', VIP: 'VIP', VVIP: 'VVIP' };

function buildConfirmDescription(toolName: string, args: Record<string, any>): string {
  const lines: string[] = [];
  const add = (label: string, value: any) => { if (value !== undefined && value !== null) lines.push(`• ${label}: ${value}`); };

  switch (toolName) {
    case 'adjust_inventory':
      const typeLabel: Record<string, string> = { IN: '입고(+)', OUT: '출고(-)', ADJUST: '실사(=)' };
      lines.push('📦 재고 조정 확인');
      add('지점', args.branch_name); add('제품', args.product_name);
      add('유형', typeLabel[args.movement_type] || args.movement_type);
      add('수량', `${args.quantity}개`); add('메모', args.memo);
      break;
    case 'transfer_inventory':
      lines.push('🔄 재고 이동 확인');
      add('출발 지점', args.from_branch_name); add('도착 지점', args.to_branch_name);
      add('제품', args.product_name); add('수량', `${args.quantity}개`);
      break;
    case 'create_customer':
      lines.push('👤 고객 등록 확인');
      add('이름', args.name); add('전화번호', args.phone);
      add('등급', GRADE_NAMES[args.grade] || args.grade || '일반');
      add('이메일', args.email); add('주소', args.address);
      break;
    case 'update_customer':
      lines.push('✏️ 고객 정보 수정 확인');
      add('대상 고객', args.customer_name || args.phone);
      add('새 전화번호', args.new_phone); add('이메일', args.email);
      add('주소', args.address); add('등급', args.grade ? GRADE_NAMES[args.grade] || args.grade : undefined);
      break;
    case 'update_customer_grade':
      lines.push('🏷️ 고객 등급 변경 확인');
      add('고객', args.customer_name || args.phone);
      add('변경 등급', GRADE_NAMES[args.new_grade] || args.new_grade);
      break;
    case 'upgrade_customer_grades':
      lines.push('🔼 전체 등급 자동 업그레이드 확인');
      lines.push('• 기준: 누적 구매 100만원↑ → VIP, 300만원↑ → VVIP');
      lines.push('• 다운그레이드는 적용되지 않습니다.');
      break;
    case 'adjust_points':
      lines.push(`${args.points > 0 ? '➕' : '➖'} 포인트 조정 확인`);
      add('고객', args.customer_name || args.phone);
      add('조정', `${args.points > 0 ? '+' : ''}${args.points}P`);
      add('사유', args.reason);
      break;
    case 'create_branch':
      lines.push('🏪 지점 추가 확인');
      add('지점명', args.name); add('채널', CHANNEL_NAMES[args.channel] || args.channel);
      add('주소', args.address); add('전화', args.phone);
      break;
    case 'update_branch':
      lines.push('🏪 지점 수정 확인');
      add('대상', args.branch_name); add('새 이름', args.new_name);
      add('주소', args.address); add('전화', args.phone);
      if (args.is_active !== undefined) add('상태', args.is_active ? '활성화' : '비활성화');
      break;
    case 'create_product':
      lines.push('📦 제품 등록 확인');
      add('제품명', args.name); add('판매가', args.price ? `${Number(args.price).toLocaleString()}원` : undefined);
      add('원가', args.cost ? `${Number(args.cost).toLocaleString()}원` : undefined);
      add('단위', args.unit || '개');
      break;
    case 'create_purchase_order':
      lines.push('📋 발주서 작성 확인');
      add('공급업체', args.supplier_name); add('입고 지점', args.branch_name);
      add('제품', args.product_name); add('수량', `${args.quantity}개`);
      add('단가', `${Number(args.unit_price).toLocaleString()}원`);
      add('합계', `${(args.quantity * args.unit_price).toLocaleString()}원`);
      add('메모', args.memo);
      break;
    case 'confirm_purchase_order':
      lines.push('✅ 발주서 확정 확인');
      add('발주번호', args.order_number);
      lines.push('• 확정 후에는 수정이 불가합니다.');
      break;
    case 'receive_purchase_order':
      lines.push('📥 입고 처리 확인');
      add('발주번호', args.order_number);
      add('메모', args.memo);
      lines.push('• 재고가 자동으로 증가합니다.');
      break;
    case 'create_production_order':
      lines.push('🏭 생산 지시서 생성 확인');
      add('제품', args.product_name); add('지점', args.branch_name);
      add('수량', `${args.quantity}개`); add('메모', args.memo);
      break;
    case 'start_production_order':
      lines.push('▶️ 생산 착수 확인');
      add('지시번호', args.order_number);
      break;
    case 'complete_production_order':
      lines.push('🎯 생산 완료 확인');
      add('지시번호', args.order_number);
      lines.push('• BOM 원재료가 재고에서 차감됩니다.');
      lines.push('• 완제품 재고가 증가합니다.');
      break;
    case 'send_sms':
      lines.push('📱 SMS 발송 확인');
      add('수신자', args.customer_name || args.phone);
      lines.push(`• 내용: "${args.message.slice(0, 50)}${args.message.length > 50 ? '...' : ''}"`);
      break;
    default:
      return `⚠️ 작업 확인\n\n${JSON.stringify(args, null, 2)}`;
  }

  lines.push('', '실행하시겠습니까?');
  return lines.join('\n');
}

export async function GET() {
  return NextResponse.json({ status: 'ok', tools: AGENT_TOOLS.length });
}
