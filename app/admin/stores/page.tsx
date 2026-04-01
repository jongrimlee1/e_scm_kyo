'use client';

import './page.css';
import { useState } from 'react';

interface Store {
  id: number;
  name: string;
  type: string;
  address: string;
  phone: string;
  isActive: boolean;
  orderCount: number;
  sales: number;
}

const mockStores: Store[] = [
  { id: 1, name: '직영점 강남', type: '직영', address: '서울시 강남구 역삼동', phone: '02-1234-5678', isActive: true, orderCount: 156, sales: 4500000 },
  { id: 2, name: '직영점 부산', type: '직영', address: '부산시 해운대구 해운대동', phone: '051-1234-5678', isActive: true, orderCount: 98, sales: 2800000 },
  { id: 3, name: '백화점 서울', type: '백화점', address: '서울시 중구 을지로', phone: '02-2345-6789', isActive: true, orderCount: 234, sales: 6700000 },
  { id: 4, name: '백화점 대구', type: '백화점', address: '대구시 중구 남대문로', phone: '053-2345-6789', isActive: true, orderCount: 187, sales: 5200000 },
  { id: 5, name: '온라인 쇼핑몰', type: '온라인', address: '온라인', phone: '1588-0000', isActive: true, orderCount: 456, sales: 12000000 },
];

export default function StoresPage() {
  const [stores] = useState<Store[]>(mockStores);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '직영': '#2d5a27',
      '백화점': '#8b6914',
      '온라인': '#7c3aed',
    };
    return colors[type] || '#6b7280';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">매장 관리</h1>
        <button className="add-btn">+ 매장 추가</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">총 매장수</div>
          <div className="stat-value">{stores.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">직영점</div>
          <div className="stat-value">{stores.filter(s => s.type === '직영').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">백화점</div>
          <div className="stat-value">{stores.filter(s => s.type === '백화점').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 매출</div>
          <div className="stat-value">{stores.reduce((sum, s) => sum + s.sales, 0).toLocaleString()}원</div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>매장명</th>
              <th>유형</th>
              <th>주소</th>
              <th>전화번호</th>
              <th>주문수</th>
              <th>매출</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              <tr key={store.id}>
                <td>
                  <div className="product-name">{store.name}</div>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ 
                      background: `${getTypeColor(store.type)}20`,
                      color: getTypeColor(store.type)
                    }}
                  >
                    {store.type}
                  </span>
                </td>
                <td>{store.address}</td>
                <td>{store.phone}</td>
                <td>{store.orderCount}건</td>
                <td className="price">{store.sales.toLocaleString()}원</td>
                <td>
                  <span className={`status-badge ${store.isActive ? 'active' : 'inactive'}`}>
                    {store.isActive ? '운영중' : '미운영'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn">수정</button>
                    <button className="action-btn">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}