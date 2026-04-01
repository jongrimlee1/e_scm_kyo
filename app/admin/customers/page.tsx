'use client';

import './page.css';
import { useState } from 'react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  level: string;
  totalPurchase: number;
  points: number;
  joinDate: string;
}

const mockCustomers: Customer[] = [
  { id: 1, name: '김경옥', phone: '01012345678', email: 'kim@email.com', level: '플래티넘', totalPurchase: 3500000, points: 45000, joinDate: '2024-01-15' },
  { id: 2, name: '이건강', phone: '01023456789', email: 'lee@email.com', level: '골드', totalPurchase: 1200000, points: 15000, joinDate: '2024-02-20' },
  { id: 3, name: '박한약', phone: '01034567890', email: 'park@email.com', level: '실버', totalPurchase: 450000, points: 5000, joinDate: '2024-03-10' },
  { id: 4, name: '최홍삼', phone: '01045678901', email: 'choi@email.com', level: '일반', totalPurchase: 150000, points: 1200, joinDate: '2024-04-05' },
  { id: 5, name: '정녹차', phone: '01056789012', email: 'jung@email.com', level: '일반', totalPurchase: 80000, points: 800, joinDate: '2024-05-01' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.includes(searchTerm) || c.phone.includes(searchTerm);
    const matchesLevel = levelFilter === 'all' || c.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '플래티넘': '#7c3aed',
      '골드': '#d4a84b',
      '실버': '#9ca3af',
      '일반': '#6b7280',
    };
    return colors[level] || '#6b7280';
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">고객 관리</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">총 고객수</div>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">플래티넘</div>
          <div className="stat-value">{customers.filter(c => c.level === '플래티넘').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">골드</div>
          <div className="stat-value">{customers.filter(c => c.level === '골드').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 매출</div>
          <div className="stat-value">{customers.reduce((sum, c) => sum + c.totalPurchase, 0).toLocaleString()}원</div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="이름 또는 전화번호 검색"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="filter-select"
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
        >
          <option value="all">전체 등급</option>
          <option value="플래티넘">플래티넘</option>
          <option value="골드">골드</option>
          <option value="실버">실버</option>
          <option value="일반">일반</option>
        </select>
        <button className="add-btn">+ 고객 추가</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>고객정보</th>
              <th>연락처</th>
              <th>등급</th>
              <th>누적구매</th>
              <th>포인트</th>
              <th>가입일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div className="product-info">
                    <div className="product-image">👤</div>
                    <div>
                      <div className="product-name">{customer.name}</div>
                      <div className="product-code">{customer.email}</div>
                    </div>
                  </div>
                </td>
                <td>{customer.phone}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ 
                      background: `${getLevelColor(customer.level)}20`,
                      color: getLevelColor(customer.level)
                    }}
                  >
                    {customer.level}
                  </span>
                </td>
                <td className="price">{customer.totalPurchase.toLocaleString()}원</td>
                <td>{customer.points.toLocaleString()}P</td>
                <td>{customer.joinDate}</td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn">상세</button>
                    <button className="action-btn">수정</button>
                    <button className="action-btn" style={{ color: '#ef4444' }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}