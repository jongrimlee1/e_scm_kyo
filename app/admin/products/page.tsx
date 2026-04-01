'use client';

import './page.css';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  isActive: boolean;
}

const mockProducts: Product[] = [
  { id: 1, name: '경옥고 본초', code: 'KY001', category: '한약재', price: 45000, isActive: true },
  { id: 2, name: '홍삼정 건강', code: 'KY002', category: '홍삼', price: 89000, isActive: true },
  { id: 3, name: '녹차 건강다져', code: 'KY003', category: '녹차', price: 25000, isActive: true },
  { id: 4, name: '한방 건강차', code: 'KY004', category: '건강차', price: 18000, isActive: false },
  { id: 5, name: '전복 건강정', code: 'KY005', category: '건강정', price: 120000, isActive: true },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    isActive: true,
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', code: '', category: '', price: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      category: product.category,
      price: product.price.toString(),
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.price) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...formData, price: parseInt(formData.price) }
          : p
      ));
    } else {
      const newProduct: Product = {
        id: Date.now(),
        ...formData,
        price: parseInt(formData.price),
      } as Product;
      setProducts([...products, newProduct]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id: number) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const deleteProduct = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">상품 관리</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">총 상품수</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">판매중</div>
          <div className="stat-value">{products.filter(p => p.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">품절</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">카테고리</div>
          <div className="stat-value">{categories.length}</div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="상품명 또는 상품코드 검색"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">전체 카테고리</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button className="add-btn" onClick={openAddModal}>
          + 상품 추가
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>상품정보</th>
              <th>카테고리</th>
              <th>가격</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>등록된 상품이 없습니다</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      <div className="product-image">🌿</div>
                      <div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-code">{product.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td className="price">{product.price.toLocaleString()}원</td>
                  <td>
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? '판매중' : '미판매'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" onClick={() => openEditModal(product)}>수정</button>
                      <button className="action-btn" onClick={() => toggleStatus(product.id)}>
                        {product.isActive ? '비활성화' : '활성화'}
                      </button>
                      <button className="action-btn" onClick={() => deleteProduct(product.id)} style={{ color: '#ef4444' }}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="page-btn">←</button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">→</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? '상품 수정' : '새 상품 추가'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">상품명 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="상품명을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">상품코드 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="예: KY001"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">카테고리</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="예: 한약재"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">가격 *</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span className="form-label" style={{ marginBottom: 0 }}>판매 활성화</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingProduct ? '수정 완료' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}