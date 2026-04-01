import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';

  const [{ data: todaySales }, { data: monthSales }, { data: recentOrders }, { data: lowInventory }] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('total_amount')
      .gte('ordered_at', `${today}T00:00:00`)
      .lt('ordered_at', `${today}T23:59:59`),
    supabase
      .from('sales_orders')
      .select('total_amount')
      .gte('ordered_at', `${monthStart}T00:00:00`),
    supabase
      .from('sales_orders')
      .select('*, branch:branches(*)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('inventories')
      .select('*, product:products(*), branch:branches(*)')
      .lt('quantity', 10)
      .limit(5),
  ]);

  const todaySalesData = (todaySales || []) as { total_amount: number }[];
  const monthSalesData = (monthSales || []) as { total_amount: number }[];
  const recentOrdersData = (recentOrders || []) as any[];
  const lowInventoryData = (lowInventory || []) as any[];

  const todayTotal = todaySalesData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const todayCount = todaySalesData.length;
  const monthTotal = monthSalesData.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-slate-500">오늘 매출</p>
          <p className="text-2xl font-bold text-slate-800">
            {todayTotal.toLocaleString()}원
          </p>
          <p className="text-xs text-slate-400">{todayCount}건</p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-slate-500">재고 부족 품목</p>
          <p className="text-2xl font-bold text-orange-600">
            {lowInventoryData.length}
          </p>
          <p className="text-xs text-slate-400">건</p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-slate-500">이번 달 매출</p>
          <p className="text-2xl font-bold text-slate-800">
            {monthTotal.toLocaleString()}원
          </p>
          <p className="text-xs text-slate-400">누적</p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-slate-500">오늘 신규 고객</p>
          <p className="text-2xl font-bold text-green-600">0</p>
          <p className="text-xs text-slate-400">명</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">최근 거래</h3>
            <Link href="/pos" className="text-sm text-blue-600 hover:underline">
              더보기
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>전표번호</th>
                <th>지점</th>
                <th>금액</th>
                <th>시간</th>
              </tr>
            </thead>
            <tbody>
              {recentOrdersData.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-sm">{order.order_number}</td>
                  <td>{order.branch?.name}</td>
                  <td className="font-semibold">
                    {order.total_amount.toLocaleString()}원
                  </td>
                  <td className="text-slate-500 text-sm">
                    {new Date(order.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {recentOrdersData.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-slate-400 py-8">
                    오늘 거래가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">재고 부족 알림</h3>
            <Link href="/inventory" className="text-sm text-blue-600 hover:underline">
              더보기
            </Link>
          </div>
          <div className="space-y-3">
            {lowInventoryData.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 bg-orange-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {item.product?.name}
                  </p>
                  <p className="text-xs text-slate-500">{item.branch?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">
                    {item.quantity}개
                  </p>
                  <p className="text-xs text-slate-400">
                    기준: {item.safety_stock}개
                  </p>
                </div>
              </div>
            ))}
            {lowInventoryData.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                재고 부족 품목이 없습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
