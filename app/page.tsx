'use client';

import Link from 'next/link';
import './page.css';

export default function Home() {
  const menuItems = [
    {
      href: '/pos',
      icon: '💳',
      title: 'POS 시스템',
      description: '바코드 판매, 고객 적립, 다양한 결제',
      color: 'primary',
    },
    {
      href: '/dashboard',
      icon: '📊',
      title: '관리자 대시보드',
      description: '통합 매출 현황, 매장별 분석',
      color: 'secondary',
    },
    {
      href: '/admin',
      icon: '⚙️',
      title: '관리자',
      description: '상품, 고객, 매장, 재고 관리',
      color: 'success',
    },
    {
      href: '/mypage',
      icon: '👤',
      title: '마이페이지',
      description: '멤버십 카드, 구매이력, 포인트',
      color: 'warning',
    },
  ];

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">경옥채</h1>
          <p className="hero-subtitle">건강기능식품 전문점 통합 관리 시스템</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">4</span>
              <span className="hero-stat-label">매장</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">156</span>
              <span className="hero-stat-label">상품</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">2,847</span>
              <span className="hero-stat-label">고객</span>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
        </div>
      </div>

      <div className="menu-grid">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className={`menu-card card-${item.color}`}>
            <div className="menu-icon-wrapper">
              <span className="menu-icon">{item.icon}</span>
            </div>
            <h3 className="menu-title">{item.title}</h3>
            <p className="menu-description">{item.description}</p>
            <span className="menu-arrow">→</span>
          </Link>
        ))}
      </div>

      <div className="quick-actions">
        <h2 className="section-title">빠른 실행</h2>
        <div className="quick-grid">
          <Link href="/pos/manual" className="quick-card">
            <span className="quick-icon">📝</span>
            <span className="quick-label">수기 주문 등록</span>
          </Link>
          <Link href="/login" className="quick-card">
            <span className="quick-icon">🎈</span>
            <span className="quick-label">카카오 로그인</span>
          </Link>
          <Link href="/admin/products" className="quick-card">
            <span className="quick-icon">📦</span>
            <span className="quick-label">상품 추가</span>
          </Link>
          <Link href="/admin/inventory" className="quick-card">
            <span className="quick-icon">📋</span>
            <span className="quick-label">재고 확인</span>
          </Link>
        </div>
      </div>

      <footer className="home-footer">
        <p>© 2024 경옥채 통합 관리 시스템 v2.0</p>
      </footer>
    </div>
  );
}