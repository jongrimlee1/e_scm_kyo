'use client';

import './page.css';
import { useState, useEffect } from 'react';
import { getUserPurchaseHistory } from '@/lib/actions';

interface Order {
  id: number;
  order_number: string;
  order_date: string;
  final_amount: number;
  stores: { name: string };
}

interface User {
  id: number;
  name: string;
  phone: string;
  customer_number: string;
  points: number;
  total_purchase_amount: number;
  user_levels: { name: string; discount_rate: number; points_rate: number };
}

export default function MypagePage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const mockUser: User = {
        id: 1,
        name: '김경옥',
        phone: '01012345678',
        customer_number: 'KY20240331001',
        points: 2450,
        total_purchase_amount: 850000,
        user_levels: { name: '골드', discount_rate: 5, points_rate: 2.0 },
      };
      setUser(mockUser);
      
      const history = await getUserPurchaseHistory(1);
      setOrders(history.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const getNextLevel = () => {
    const levels = [
      { name: '일반', minAmount: 0 },
      { name: '실버', minAmount: 300000 },
      { name: '골드', minAmount: 1000000 },
      { name: '플래티넘', minAmount: 3000000 },
    ];
    const currentIdx = levels.findIndex(l => l.name === user?.user_levels?.name);
    if (currentIdx < levels.length - 1) {
      return levels[currentIdx + 1];
    }
    return null;
  };

  const nextLevel = getNextLevel();
  const progressToNext = nextLevel 
    ? Math.min(100, Math.floor(((user?.total_purchase_amount || 0) - (currentLevelMin())) / (nextLevel.minAmount - (currentLevelMin())) * 100))
    : 100;
  
  function currentLevelMin() {
    const map: Record<string, number> = { '일반': 0, '실버': 300000, '골드': 1000000, '플래티넘': 3000000 };
    return map[user?.user_levels?.name || '일반'] || 0;
  }

  if (loading) {
    return <div className="mypage" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>로딩중...</div>;
  }

  return (
    <div className="mypage">
      <header className="header">
        <span className="logo">경옥채</span>
        <button className="logout-btn">로그아웃</button>
      </header>

      <div className="member-card">
        <div className="card-brand">경옥채 멤버십</div>
        <div className="card-name">{user?.name || '손님'}</div>
        <span className="card-level">{user?.user_levels?.name || '일반'}会员</span>
        <div className="card-number">{user?.customer_number}</div>
      </div>

      <div className="barcode-section">
        <div className="barcode-title">멤버십 바코드</div>
        <div className="barcode-placeholder"></div>
        <div className="barcode-number">{user?.phone}</div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-label">보유 포인트</div>
          <div className="stat-value">{user?.points?.toLocaleString()}<span className="stat-unit">P</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">누적 구매금액</div>
          <div className="stat-value">{user?.total_purchase_amount?.toLocaleString()}<span className="stat-unit">원</span></div>
        </div>
      </div>

      {nextLevel && (
        <div className="grade-info">
          <div className="grade-title">다음 등급까지 {(nextLevel.minAmount - (user?.total_purchase_amount || 0)).toLocaleString()}원</div>
          <div className="grade-steps">
            {['일반', '실버', '골드', '플래티넘'].map((level, idx) => (
              <div key={level} className="grade-step">
                <div className={`grade-dot ${['일반', '실버', '골드', '플래티넘'].indexOf(user?.user_levels?.name || '') >= idx ? 'active' : ''}`}></div>
                <span className={`grade-step-name ${user?.user_levels?.name === level ? 'active' : ''}`}>{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="history-section">
        <div className="history-header">
          <span className="history-title">최근 구매 이력</span>
          <span className="history-more">더보기 &gt;</span>
        </div>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>구매 이력이 없습니다</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="history-item">
              <div className="history-info">
                <div className="history-date">{formatDate(order.order_date)}</div>
                <div className="history-store">{order.stores?.name || '매장'}</div>
              </div>
              <span className="history-amount">{order.final_amount.toLocaleString()}원</span>
            </div>
          ))
        )}
      </div>

      <div className="menu-section">
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-icon">📋</span>
            <span className="menu-text">주문 상세 보기</span>
          </div>
          <span className="menu-arrow">&gt;</span>
        </div>
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-icon">🎁</span>
            <span className="menu-text">포인트 내역</span>
          </div>
          <span className="menu-arrow">&gt;</span>
        </div>
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-icon">🎫</span>
            <span className="menu-text">쿠폰함</span>
          </div>
          <span className="menu-arrow">&gt;</span>
        </div>
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-icon">⚙️</span>
            <span className="menu-text">설정</span>
          </div>
          <span className="menu-arrow">&gt;</span>
        </div>
      </div>

      <div style={{ height: '80px' }}></div>

      <nav className="bottom-nav">
        <div className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span>홈</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">📊</span>
          <span>주문</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">🎁</span>
          <span>포인트</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">👤</span>
          <span>MY</span>
        </div>
      </nav>
    </div>
  );
}