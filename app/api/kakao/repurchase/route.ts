import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ALIGO_API_URL = 'https://kakaoapi.aligo.in/akv10/aligo/send/40';

interface AligoResponse {
  result_code: string;
  message: string;
  msg_id?: string;
}

async function sendKakaoAligo(phone: string, message: string, templateCode: string): Promise<AligoResponse> {
  const apiKey = process.env.ALIGO_API_KEY || '';
  const userId = process.env.ALIGO_USER_ID || '';
  const sender = process.env.ALIGO_SENDER || '';
  
  if (!apiKey || !userId || !sender) {
    throw new Error('Aligo API 설정이 없습니다.');
  }

  const cleanPhone = phone.replace(/-/g, '');
  
  const response = await fetch(ALIGO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      key: apiKey,
      user_id: userId,
      sender,
      receiver: cleanPhone,
      msg: message,
      template_code: templateCode,
    }).toString(),
  });

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daysAfter = 25 } = body;

    const supabase = createClient();

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAfter);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const { data: targetOrders, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_date,
        user_id,
        users!inner(id, phone, name, user_levels(name))
      `)
      .eq('status', 'completed')
      .gte('order_date', targetDateStr)
      .lt('order_date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .not('user_id', 'is', null);

    if (orderError) {
      throw orderError;
    }

    if (!targetOrders || targetOrders.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: '대상 주문이 없습니다.',
      });
    }

    const results = [];
    const settings = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['repurchase_alert_days', 'company_name'])
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach(s => { map[s.key] = s.value; });
        return map;
      });

    for (const order of targetOrders) {
      const users = order.users as any[];
      const user = users?.[0];
      
      if (!user?.phone) continue;

      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', '재구매')
        .gte('created_at', targetDateStr)
        .single();

      if (existingNotification) continue;

      const message = `[${settings.company_name || '경옥채'}] ${user.name}님, 마지막 구매로부터 ${daysAfter}일이 지났습니다! 🌿\n\n지난번에 구매하신 상품은 어떠셨나요?\n건강한 선택, 경옥채와 함께하세요!`;

      try {
        const result = await sendKakaoAligo(user.phone, message, 'repurchase_alert');

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: '재구매',
          message,
          template_code: 'repurchase_alert',
          external_id: result.msg_id,
          status: result.result_code === '1' ? 'sent' : 'failed',
          sent_at: result.result_code === '1' ? new Date().toISOString() : null,
        });

        results.push({ userId: user.id, status: result.result_code });
      } catch (sendError) {
        console.error(`사용자 ${user.id}에게 알림 전송 실패:`, sendError);
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('재구매 알림 크론 오류:', error);
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    description: '재구매 알림 트리거 API',
    usage: 'POST with { daysAfter: 25 }',
    note: '이 API는 크론 job이나 수동으로 호출하여 사용합니다.',
  });
}