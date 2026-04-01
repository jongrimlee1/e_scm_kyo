'use client';

import './page.css';
import { useState } from 'react';

interface Inventory {
  id: number;
  storeName: string;
  storeType: string;
  productName: string;
  productCode: string;
  quantity: number;
  lastUpdated: string;
}

const mockInventory: Inventory[] = [
  { id: 1, storeName: '직영점 강남', storeType: '직영', productName: '경옥고 본초', productCode: 'KY001', quantity: 45, lastUpdated: '2024-06-01' },
  { id: 2, storeName: '직영점 강남', storeType: '직영', productName: '홍삼정 건강', productCode: 'KY002', quantity: 28, lastUpdated: '2024-06-01' },
  { id: 3, storeName: '백화점 서울', storeType: '백화점', productName: '경옥고 본초', productCode: 'KY001', quantity: 12, lastUpdated: '2024-06-02' },
  { id: 4, storeName: '백화점 서울', storeType: '백화점', productName: '녹차 건강다져', productCode: 'KY003', quantity: 8, lastUpdated: '2024-06-02' },
  { id: 5, storeName: '직영점 부산', storeType: '직영', productName: '한방 건강차', productCode: 'KY004', quantity: 33, lastUpdated: '2024-06-01' },
  { id: 6, storeName: '온라인', storeType: '온라인', productName: '전복 건강정', productCode: 'KY005', quantity: 150, lastUpdated: '2024-06-03' },
];

export default function InventoryPage() {
  const [inventory] = useState<Inventory[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || item.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = storeFilter === 'all' || item.storeType === storeFilter;
    return matchesSearch && matchesStore;
  });

  const getQuantityStatus = (qty: number) => {
    if (qty === 0) return { label: '품절', color: '#ef4444' };
    if (qty < 10) return { label: '재고 부족', color: '#f59e0b' };
    return { label: '정상', color: '#10b981' };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">재고 관리</h1>
        <button className="add-btn">+ 재고 입고</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">총 재고 수량</div>
          <div className="stat-value">{inventory.reduce((sum, i) => sum + i.quantity, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">매장 수</div>
          <div className="stat-value">{new Set(inventory.map(i => i.storeName)).size}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">재고 부족</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {inventory.filter(i => i.quantity < 10).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">품절</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {inventory.filter(i => i.quantity === 0).length}
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="상품명 또는 코드 검색"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="filter-select"
          value={storeFilter}
          onChange={e => setStoreFilter(e.target.value)}
        >
          <option value="all">전체 매장</option>
          <option value="직영">직영점</option>
          <option value="백화점">백화점</option>
          <option value="온라인">온라인</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>매장</th>
              <th>상품정보</th>
              <th>수량</th>
              <th>상태</th>
              <th>최종 업데이트</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => {
              const status = getQuantityStatus(item.quantity);
              return (
                <tr key={item.id}>
                  <td>
                    <div>
                      <div className="product-name">{item.storeName}</div>
                      <div className="product-code">{item.storeType}</div>
                    </div>
                  </td>
                  <td>
                    <div className="product-info">
                      <div className="product-image">📦</div>
                      <div>
                        <div className="product-name">{item.productName}</div>
                        <div className="product-code">{item.productCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="price">{item.quantity}개</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        background: `${status.color}20`,
                        color: status.color
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td>{item.lastUpdated}</td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn">입고</button>
                      <button className="action-btn">이동</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}