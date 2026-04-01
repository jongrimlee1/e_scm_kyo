'use client';

import './page.css';
import Link from 'next/link';
import { useState, useRef } from 'react';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Store {
  id: number;
  name: string;
  type: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const mockStores: Store[] = [
  { id: 1, name: '직영점 강남', type: '직영' },
  { id: 2, name: '백화점 서울', type: '백화점' },
  { id: 3, name: '온라인', type: '온라인' },
];

const mockProducts: Product[] = [
  { id: 1, name: '경옥고 본초', price: 45000, category: '한약재' },
  { id: 2, name: '홍삼정 건강', price: 89000, category: '홍삼' },
  { id: 3, name: '녹차 건강다져', price: 25000, category: '녹차' },
  { id: 4, name: '한방 건강차', price: 18000, category: '건강차' },
  { id: 5, name: '전복 건강정', price: 120000, category: '건강정' },
  { id: 6, name: '인삼정 콤플렉스', price: 75000, category: '인삼' },
  { id: 7, name: '석류 건강화', price: 35000, category: '건강화' },
  { id: 8, name: '매실 건강원', price: 28000, category: '건강원' },
];

export default function POSPage() {
  const [stores] = useState<Store[]>(mockStores);
  const [selectedStore, setSelectedStore] = useState<number>(1);
  const [products] = useState<Product[]>(mockProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    
    const product = mockProducts.find(p => p.name.includes(barcode) || barcode === '');
    if (product) {
      addToCart(product);
      showToastMessage('상품이 추가되었습니다');
    } else {
      showToastMessage('상품을 찾을 수 없습니다');
    }
    setBarcode('');
    barcodeInputRef.current?.focus();
  }

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function updateQuantity(index: number, delta: number) {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  }

  function removeItem(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index));
  }

  function handlePhoneSearch() {
    if (!phone.trim()) return;
    const foundCustomer = { id: 1, name: '김경옥', phone, points: 2450, user_levels: { name: '골드' } };
    setCustomer(foundCustomer);
    showToastMessage(`${foundCustomer.name}님 환영합니다`);
  }

  function handlePayment() {
    if (cart.length === 0) {
      showToastMessage('장바구니가 비어있습니다');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      showToastMessage('결제가 완료되었습니다!');
      setCart([]);
      setCustomer(null);
      setPhone('');
      setIsLoading(false);
    }, 1500);
  }

  function showToastMessage(message: string) {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pointsEarned = Math.floor(totalAmount * 0.01);

  return (
    <div className="pos-container">
      <header className="pos-header">
        <div className="pos-header-left">
          <h1 className="pos-logo">경옥채 POS</h1>
        </div>
        <div className="pos-header-right">
          <Link href="/pos/manual" className="btn btn-secondary btn-sm">
            📝 수기 주문
          </Link>
          <select 
            className="store-select"
            value={selectedStore}
            onChange={e => setSelectedStore(Number(e.target.value))}
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="pos-main">
        <section className="product-section">
          <form onSubmit={handleBarcodeSubmit} className="barcode-form">
            <input
              ref={barcodeInputRef}
              type="text"
              className="barcode-input"
              placeholder="바코드 스캔"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">추가</button>
          </form>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="상품 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="product-grid">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => addToCart(product)}
              >
                <div className="product-emoji">🌿</div>
                <div className="product-name">{product.name}</div>
                <div className="product-price">{product.price.toLocaleString()}원</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cart-section">
          <div className="cart-header">
            <h2 className="cart-title">주문 목록</h2>
            {cart.length > 0 && (
              <span className="cart-count">{cart.length}건</span>
            )}
          </div>
          
          <div className="customer-section">
            <div className="customer-label">고객 정보</div>
            <div className="phone-input-wrapper">
              <input
                type="tel"
                className="phone-input"
                placeholder="전화번호"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <button className="btn btn-secondary btn-sm" onClick={handlePhoneSearch}>
                조회
              </button>
            </div>
            {customer && (
              <div className="customer-info">
                <div className="customer-name">
                  {customer.name}
                  <span className="badge badge-primary">{customer.user_levels?.name || '일반'}</span>
                </div>
                <div className="customer-points">보유 포인트: {customer.points?.toLocaleString() || 0}P</div>
              </div>
            )}
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">🛒</span>
                <p>장바구니가 비어있습니다</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{item.price.toLocaleString()}원</div>
                  </div>
                  <div className="cart-item-qty">
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity(index, -1)}
                    >
                      -
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity(index, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    {(item.price * item.quantity).toLocaleString()}원
                  </div>
                  <button 
                    className="cart-item-remove"
                    onClick={() => removeItem(index)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>주문 금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
            <div className="summary-row highlight">
              <span>결제 금액</span>
              <span className="summary-total">{totalAmount.toLocaleString()}원</span>
            </div>
            {customer && (
              <div className="summary-row points">
                <span>적립 포인트</span>
                <span>+{pointsEarned}P</span>
              </div>
            )}
            
            <div className="payment-methods">
              {[
                { value: 'card', label: '카드', icon: '💳' },
                { value: 'cash', label: '현금', icon: '💵' },
                { value: 'kakao', label: '카카오', icon: '🎈' },
              ].map(method => (
                <button
                  key={method.value}
                  className={`payment-btn ${paymentMethod === method.value ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <span>{method.icon}</span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            <button 
              className="btn btn-success btn-lg w-full"
              onClick={handlePayment}
              disabled={isLoading || cart.length === 0}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  처리중...
                </>
              ) : (
                <>결제하기 ({totalAmount.toLocaleString()}원)</>
              )}
            </button>
          </div>
        </section>
      </div>

      {showToast && (
        <div className="toast">
          <span className="toast-icon">✓</span>
          <span className="toast-message">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}