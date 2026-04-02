'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPhone } from '@/lib/validators';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = decodeURIComponent(value || '');
    return acc;
  }, {} as Record<string, string>);
  return cookies[name] || null;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  channel: string;
}

interface SalesData {
  totalAmount: number;
  totalOrders: number;
  totalDiscount: number;
  totalPointsEarned: number;
  totalPointsUsed: number;
  avgOrderValue: number;
}

interface ChannelSales {
  channel: string;
  channelName: string;
  amount: number;
  count: number;
  percentage: number;
}

interface BranchSales {
  branchId: string;
  branchName: string;
  amount: number;
  count: number;
  percentage: number;
}

interface ProductSales {
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [salesData, setSalesData] = useState<SalesData>({
    totalAmount: 0,
    totalOrders: 0,
    totalDiscount: 0,
    totalPointsEarned: 0,
    totalPointsUsed: 0,
    avgOrderValue: 0,
  });
  const [channelSales, setChannelSales] = useState<ChannelSales[]>([]);
  const [branchSales, setBranchSales] = useState<BranchSales[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);

  const userRole = getCookie('user_role');
  const userBranchId = getCookie('user_branch_id');
  const isBranchUser = userRole === 'BRANCH_STAFF' || userRole === 'PHARMACY_STAFF';

  useEffect(() => {
    const fetchBranches = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('created_at');
      setBranches(data || []);
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, userBranchId]);

  const fetchReportData = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: orders } = await supabase
      .from('sales_orders')
      .select(`
        id,
        total_amount,
        discount_amount,
        points_earned,
        points_used,
        channel,
        branch_id,
        created_at
      `)
      .eq('status', 'COMPLETED')
      .gte('ordered_at', `${startDate}T00:00:00`)
      .lte('ordered_at', `${endDate}T23:59:59`)
      .order('ordered_at', { ascending: false });

    const { data: orderItems } = await supabase
      .from('sales_order_items')
      .select(`
        product_id,
        product:products(name),
        quantity,
        total_price
      `)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (!orders) {
      setLoading(false);
      return;
    }

    const ordersData = orders as any[];
    const itemsData = (orderItems || []) as any[];

    const filteredOrders = isBranchUser && userBranchId
      ? ordersData.filter(o => o.branch_id === userBranchId)
      : ordersData;

    const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalDiscount = filteredOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
    const totalPointsEarned = filteredOrders.reduce((sum, o) => sum + (o.points_earned || 0), 0);
    const totalPointsUsed = filteredOrders.reduce((sum, o) => sum + (o.points_used || 0), 0);

    setSalesData({
      totalAmount,
      totalOrders: filteredOrders.length,
      totalDiscount,
      totalPointsEarned,
      totalPointsUsed,
      avgOrderValue: filteredOrders.length > 0 ? Math.round(totalAmount / filteredOrders.length) : 0,
    });

    const channelMap = new Map<string, { amount: number; count: number }>();
    const channelNames: Record<string, string> = {
      STORE: '한약국',
      DEPT_STORE: '백화점',
      ONLINE: '자사몰',
      EVENT: '이벤트',
    };

    filteredOrders.forEach(o => {
      const ch = o.channel || 'STORE';
      const existing = channelMap.get(ch) || { amount: 0, count: 0 };
      channelMap.set(ch, {
        amount: existing.amount + (o.total_amount || 0),
        count: existing.count + 1,
      });
    });

    const channelData: ChannelSales[] = [];
    channelMap.forEach((val, key) => {
      channelData.push({
        channel: key,
        channelName: channelNames[key] || key,
        amount: val.amount,
        count: val.count,
        percentage: totalAmount > 0 ? Math.round((val.amount / totalAmount) * 100) : 0,
      });
    });
    setChannelSales(channelData.sort((a, b) => b.amount - a.amount));

    const branchMap = new Map<string, { name: string; amount: number; count: number }>();
    filteredOrders.forEach(o => {
      const branch = branches.find(b => b.id === o.branch_id);
      const name = branch?.name || o.branch_id;
      const existing = branchMap.get(o.branch_id) || { name, amount: 0, count: 0 };
      branchMap.set(o.branch_id, {
        name,
        amount: existing.amount + (o.total_amount || 0),
        count: existing.count + 1,
      });
    });

    const branchData: BranchSales[] = [];
    branchMap.forEach((val, key) => {
      branchData.push({
        branchId: key,
        branchName: val.name,
        amount: val.amount,
        count: val.count,
        percentage: totalAmount > 0 ? Math.round((val.amount / totalAmount) * 100) : 0,
      });
    });
    setBranchSales(branchData.sort((a, b) => b.amount - a.amount));

    const productMap = new Map<string, { name: string; quantity: number; amount: number }>();
    itemsData.forEach((item: any) => {
      const pid = item.product_id;
      const name = item.product?.name || '알 수 없음';
      const existing = productMap.get(pid) || { name, quantity: 0, amount: 0 };
      productMap.set(pid, {
        name,
        quantity: existing.quantity + item.quantity,
        amount: existing.amount + item.total_price,
      });
    });

    const productData: ProductSales[] = [];
    productMap.forEach((val, key) => {
      productData.push({
        productId: key,
        productName: val.name,
        quantity: val.quantity,
        amount: val.amount,
      });
    });
    setProductSales(productData.sort((a, b) => b.amount - a.amount).slice(0, 20));

    setLoading(false);
  };

  const handlePeriodChange = (p: 'daily' | 'weekly' | 'monthly') => {
    setPeriod(p);
    const end = new Date();
    const start = new Date();
    if (p === 'daily') {
      start.setDate(end.getDate() - 30);
    } else if (p === 'weekly') {
      start.setDate(end.getDate() - 12 * 7);
    } else {
      start.setMonth(end.getMonth() - 12);
    }
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="font-semibold text-lg">매출 보고서</h3>
        <div className="flex gap-2 flex-wrap">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as any)}
            className="input"
          >
            <option value="daily">일별 (30일)</option>
            <option value="weekly">주별 (12주)</option>
            <option value="monthly">월별 (12개월)</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
          <span className="self-center text-slate-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
          <button onClick={fetchReportData} className="btn-secondary">
            조회
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">로딩 중...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="stat-card">
              <p className="text-sm text-slate-500">총 매출 (정상가)</p>
              <p className="text-xl font-bold text-slate-800">{salesData.totalAmount.toLocaleString()}원</p>
              <p className="text-xs text-slate-400">{salesData.totalOrders}건</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-500">포인트 할인</p>
              <p className="text-xl font-bold text-red-500">-{salesData.totalDiscount.toLocaleString()}원</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-500">순매출</p>
              <p className="text-xl font-bold text-green-600">
                {(salesData.totalAmount - salesData.totalDiscount).toLocaleString()}원
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-500">평균 객단가</p>
              <p className="text-xl font-bold text-slate-800">{salesData.avgOrderValue.toLocaleString()}원</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-500">적립 포인트</p>
              <p className="text-xl font-bold text-blue-600">+{salesData.totalPointsEarned.toLocaleString()}P</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-500">사용 포인트</p>
              <p className="text-xl font-bold text-amber-600">-{salesData.totalPointsUsed.toLocaleString()}P</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-4">채널별 매출</h3>
              {channelSales.length > 0 ? (
                <div className="space-y-3">
                  {channelSales.map((ch) => (
                    <div key={ch.channel}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600">{ch.channelName}</span>
                        <span className="font-semibold">{ch.amount.toLocaleString()}원 ({ch.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${ch.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">데이터가 없습니다</p>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">지점별 매출</h3>
              {branchSales.length > 0 ? (
                <div className="space-y-3">
                  {branchSales.map((br) => (
                    <div key={br.branchId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600">{br.branchName}</span>
                        <span className="font-semibold">{br.amount.toLocaleString()}원 ({br.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${br.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">데이터가 없습니다</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">인기 제품 (판매금액 기준)</h3>
            {productSales.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>제품명</th>
                    <th className="text-right">판매수량</th>
                    <th className="text-right">판매금액</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.map((p, i) => (
                    <tr key={p.productId}>
                      <td>{i + 1}</td>
                      <td className="font-medium">{p.productName}</td>
                      <td className="text-right">{p.quantity.toLocaleString()}</td>
                      <td className="text-right font-semibold">{p.amount.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-slate-400 py-8">데이터가 없습니다</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
