import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface AligoRequest {
  key: string;
  user_id: string;
  sender: string;
  receiver: string;
  msg: string;
  title?: string;
  template_code?: string;
}

interface AligoResponse {
  result_code: string;
  message: string;
  msg_id?: string;
}

const ALIGO_API_URL = 'https://kakaoapi.aligo.in/akv10/aligo/send/40';

async function sendKakaoAligo(phone: string, message: string, templateCode?: string): Promise<AligoResponse> {
  const apiKey = process.env.ALIGO_API_KEY || '';
  const userId = process.env.ALIGO_USER_ID || '';
  const sender = process.env.ALIGO_SENDER || '';
  
  if (!apiKey || !userId || !sender) {
    throw new Error('Aligo API 설정이 누락되었습니다.');
  }

  const cleanPhone = phone.replace(/-/g, '');
  
  const payload: AligoRequest = {
    key: apiKey,
    user_id: userId,
    sender,
    receiver: cleanPhone,
    msg: message,
    template_code: templateCode,
  };

  const response = await fetch(ALIGO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payload as any).toString(),
  });

  if (!response.ok) {
    throw new Error(`Aligo API 오류: ${response.status}`);
  }

  return response.json();
}

async function logNotification(
  userId: number,
  type: string,
  message: string,
  templateCode: string,
  externalId?: string,
  status: 'sent' | 'failed' = 'sent'
) {
  const supabase = createClient();
  
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    message,
    template_code: templateCode,
    external_id: externalId,
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, template, customMessage } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId와 type은 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone, name, user_levels(name)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!user.phone) {
      return NextResponse.json(
        { error: '사용자의 전화번호가 없습니다.' },
        { status: 400 }
      );
    }

    const templates: Record<string, { message: string; code: string }> = {
      welcome: {
        message: `[경옥채] ${user.name}님, 가입을 환영합니다! 🎉\n\n경옥채의 다양한 혜택을 경험해보세요.\n\n오늘도 건강하세요.`,
        code: 'welcome',
      },
      purchase: {
        message: `[경옥채] ${user.name}님, 주문이 완료되었습니다! 🛒\n\n주문번호: ${customMessage?.orderNumber || 'N/A'}\n결제금액: ${customMessage?.amount?.toLocaleString() || 0}원\n\n감사합니다.`,
        code: 'purchase',
      },
      repurchase: {
        message: `[경옥채] ${user.name}님, آخر 구매로부터 ${customMessage?.days || 25}일이 지났습니다! 🌿\n\n지난번에 구매하신 商品은 어떠셨나요?\n다시 한번 경옥채의 건강한 선택은 어떠세요?`,
        code: 'repurchase_alert',
      },
      points: {
        message: `[경옥채] ${user.name}님, 포인트가 적립되었습니다! 💰\n\n적립 포인트: ${customMessage?.points?.toLocaleString() || 0}P\n보유 포인트: ${customMessage?.totalPoints?.toLocaleString() || 0}P\n\n다음 구매 시Points를 활용해 보세요!`,
        code: 'points_earned',
      },
      level_up: {
        message: `[경옥채] ${user.name}님, 축하합니다! 🎊\n\n${customMessage?.newLevel || '골드'} 등급으로 승급되었습니다!\n\n다양한exclusive 혜택을 누려보세요.`,
        code: 'level_up',
      },
    };

    const templateData = templates[template] || templates.welcome;
    const message = customMessage?.custom || templateData.message;

    const result = await sendKakaoAligo(user.phone, message, templateData.code);

    if (result.result_code === '1') {
      await logNotification(user.id, type, message, templateData.code, result.msg_id, 'sent');
      
      return NextResponse.json({
        success: true,
        message: '알림톡이 전송되었습니다.',
        msgId: result.msg_id,
      });
    } else {
      await logNotification(user.id, type, message, templateData.code, undefined, 'failed');
      
      return NextResponse.json(
        { error: `전송 실패: ${result.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('카카오 알림톡 전송 오류:', error);
    
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '카카오 알림톡 Webhook 엔드포인트',
  });
}