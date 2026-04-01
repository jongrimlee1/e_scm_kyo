import { createClient } from '@/lib/supabase/client';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw new Error(error.message);
  return data;
}

export async function searchProductByBarcode(barcode: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .single();
  
  if (error) return null;
  return data;
}

export async function searchUserByPhone(phone: string) {
  const supabase = createClient();
  const normalizedPhone = phone.replace(/-/g, '');
  
  const { data, error } = await supabase
    .from('users')
    .select('*, user_levels(*)')
    .eq('phone', normalizedPhone)
    .eq('is_active', true)
    .single();
  
  if (error) return null;
  return data;
}

export async function findOrCreateUser(phone: string, name?: string) {
  const supabase = createClient();
  const normalizedPhone = phone.replace(/-/g, '');
  
  let user = await searchUserByPhone(normalizedPhone);
  
  if (!user) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        phone: normalizedPhone,
        name: name || '손님',
        customer_number: `KY${Date.now()}`,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    user = data;
    
    await sendWelcomeNotification(user.id);
  }
  
  return user;
}

export async function createOrder(
  storeId: number,
  userId: number | null,
  items: Array<{ productId: number; quantity: number; price: number }>,
  paymentMethod: string,
  pointsUsed: number = 0
) {
  const supabase = createClient();
  
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pointsEarned = Math.floor(totalAmount * 0.01);
  const finalAmount = totalAmount - pointsUsed;
  
  const orderNumber = `KY${Date.now()}`;
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      user_id: userId,
      order_number: orderNumber,
      order_type: '판매',
      total_amount: totalAmount,
      discount_amount: 0,
      final_amount: finalAmount,
      payment_method: paymentMethod,
      points_used: pointsUsed,
      points_earned: pointsEarned,
      status: 'completed',
      order_date: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (orderError) throw new Error(orderError.message);
  
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity,
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  
  if (itemsError) throw new Error(itemsError.message);
  
  if (userId) {
    await updateUserPoints(userId, pointsEarned, pointsUsed, order.id);
    await updateUserPurchaseAmount(userId, finalAmount);
  }
  
  await updateInventory(storeId, items);
  
  revalidatePath('/dashboard');
  
  return { order, orderItems };
}

async function updateUserPoints(userId: number, earned: number, used: number, orderId: number) {
  const supabase = createClient();
  
  const netAmount = earned - used;
  
  const { error: userError } = await supabase
    .from('users')
    .update({ 
      points: require('@supabase/supabase-js').raw('points + ' + netAmount),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (earned > 0) {
    await supabase.from('points').insert({
      user_id: userId,
      amount: earned,
      type: '적립',
      description: '구매 적립',
      order_id: orderId,
    });
  }
  
  if (used > 0) {
    await supabase.from('points').insert({
      user_id: userId,
      amount: -used,
      type: '사용',
      description: '포인트 결제 사용',
      order_id: orderId,
    });
  }
}

async function updateUserPurchaseAmount(userId: number, amount: number) {
  const supabase = createClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('total_purchase_amount')
    .eq('id', userId)
    .single();
  
  const newTotal = (user?.total_purchase_amount || 0) + amount;
  
  const { data: newLevel } = await supabase
    .from('user_levels')
    .select('id')
    .lte('min_amount', newTotal)
    .order('min_amount', { ascending: false })
    .limit(1)
    .single();
  
  await supabase
    .from('users')
    .update({ 
      total_purchase_amount: newTotal,
      level_id: newLevel?.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

async function updateInventory(storeId: number, items: Array<{ productId: number; quantity: number }>) {
  const supabase = createClient();
  
  for (const item of items) {
    const { data: existing } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('store_id', storeId)
      .eq('product_id', item.productId)
      .single();
    
    if (existing) {
      await supabase
        .from('inventory')
        .update({ 
          quantity: existing.quantity - item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId)
        .eq('product_id', item.productId);
    }
  }
}

export async function getUserLevels() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_levels')
    .select('*')
    .order('min_amount');
  
  if (error) throw new Error(error.message);
  return data;
}

export async function getStores() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw new Error(error.message);
  return data;
}

export async function getSalesDashboard(startDate?: string, endDate?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from('sales_dashboard')
    .select('*');
  
  if (startDate) {
    query = query.gte('sale_date', startDate);
  }
  if (endDate) {
    query = query.lte('sale_date', endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data;
}

export async function getUserPurchaseHistory(userId: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores(name),
      order_items(
        *,
        products(name, image_url)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('order_date', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
}

async function sendWelcomeNotification(userId: number) {
  const supabase = createClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('*, user_levels(name)')
    .eq('id', userId)
    .single();
  
  if (user) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: '가입',
        message: `[경옥채] ${user.name}님, 가입을 환영합니다!`,
        template_code: 'welcome',
        status: 'pending',
      });
    
    if (!error) {
      await triggerKakaoNotification(userId, 'welcome');
    }
  }
}

async function triggerKakaoNotification(userId: number, template: string) {
  const supabase = createClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('phone, name')
    .eq('id', userId)
    .single();
  
  if (!user?.phone) return;
  
  const message = template === 'welcome'
    ? `${user.name}님, 경옥채에 오신 것을 환영합니다!`
    : `${user.name}님, 구매 후 ${template}일이 지났습니다. 재구매를 고려해보세요!`;
  
  const response = await fetch('/api/kakao/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: user.phone,
      message,
      template,
    }),
  });
  
  return response.json();
}

export async function createKakaoUser(kakaoId: string, kakaoEmail: string, kakaoName: string) {
  const supabase = createClient();
  
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('kakao_id', kakaoId)
    .single();
  
  if (existing) {
    return existing;
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      kakao_id: kakaoId,
      email: kakaoEmail,
      name: kakaoName,
      phone: '',
      customer_number: `KY${Date.now()}`,
      kakao_synced: true,
    })
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  
  await sendWelcomeNotification(data.id);
  
  return data;
}

export async function linkKakaoAccount(userId: number, kakaoId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('users')
    .update({
      kakao_id: kakaoId,
      kakao_synced: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (error) throw new Error(error.message);
  
  revalidatePath('/mypage');
}