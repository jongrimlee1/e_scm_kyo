'use client';

import './page.css';
import { useState, useEffect } from 'react';
import { getSalesDashboard, getStores } from '@/lib/actions';

interface DashboardData {
  sale_date: string;
  store_id: number;
  store_name: string;
  store_type: string;
  order_count: number;
  total_sales: number;
  total_points_earned: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedStore, dateRange]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getSalesDashboard(dateRange.start || undefined, dateRange.end || undefined);
      setData(result);
      
      const storeData = await getStores();
      setStores(storeData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const filteredData = selectedStore === 'all' 
    ? data 
    : data.filter(d => d.store_id === selectedStore);

  const totalSales = filteredData.reduce((sum, d) => sum + d.total_sales, 0);
  const totalOrders = filteredData.reduce((sum, d) => sum + d.order_count, 0);
  const totalPoints = filteredData.reduce((sum, d) => sum + d.total_points_earned, 0);
  const avgOrderAmount = totalOrders > 0 ? Math.floor(totalSales / totalOrders) : 0;

  const storeSales = stores.map(store => {
    const storeData = filteredData.filter(d => d.store_id === store.id);
    const sales = storeData.reduce((sum, d) => sum + d.total_sales, 0);
    return { name: store.name, sales, type: store.type };
  }).sort((a, b) => b.sales - a.sales);

  const today = new Date().toISOString().split('T')[0];
  const todayData = filteredData.filter(d => d.sale_date === today);
  const todaySales = todayData.reduce((sum, d) => sum + d.total_sales, 0);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <div className="logo">경옥채 관리자</div>
          <div className="header-right">
            <span className="user-info">본사 관리자</span>
            <button className="logout-btn">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">오늘 매출</div>
            <div className="stat-value">{todaySales.toLocaleString()}원</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">기간 매출</div>
            <div className="stat-value">{totalSales.toLocaleString()}원</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">총 주문수</div>
            <div className="stat-value">{totalOrders.toLocaleString()}건</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">평균 주문금액</div>
            <div className="stat-value">{avgOrderAmount.toLocaleString()}원</div>
          </div>
        </div>

        <div className="filter-bar">
          <select 
            className="filter-select"
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">전체 매장</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input 
            type="date" 
            className="date-input"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <span style={{ alignSelf: 'center' }}>~</span>
          <input 
            type="date" 
            className="date-input"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>

        <div className="content-grid">
          <div className="chart-section">
            <div className="section-title">
              <span>매출 추이</span>
              <div className="category-grid" style={{ marginTop: 0 }}>
                <button className="category-btn active">일별</button>
                <button className="category-btn">월별</button>
              </div>
            </div>
            <div className="chart-placeholder">
              {loading ? '데이터 로딩중...' : '매출 차트 영역'}
            </div>
          </div>

          <div className="store-rankings">
            <div className="section-title">매장별 매출</div>
            {storeSales.slice(0, 5).map((store, index) => (
              <div key={index} className="store-item">
                <span className="store-rank">{index + 1}</span>
                <span className="store-name">{store.name}</span>
                <span className="store-sales">{store.sales.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-orders" style={{ marginTop: '1.5rem' }}>
          <div className="section-title">최근 주문</div>
          {filteredData.slice(0, 10).map((item, index) => (
            <div key={index} className="order-item">
              <div className="order-info">
                <div className="order-number">{item.sale_date}</div>
                <div className="order-store">{item.store_name}</div>
              </div>
              <span className="order-amount">{item.total_sales.toLocaleString()}원</span>
              <span className="order-status completed">완료</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}