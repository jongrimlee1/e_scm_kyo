'use client';

import './page.css';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OCRResult {
  date: string;
  storeName: string;
  items: OrderItem[];
  totalAmount: number;
}

export default function ManualOrderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>('manual');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ name: '', quantity: 1, price: 0 }]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // OCR states
  const [dragOver, setDragOver] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsOcrProcessing(true);
    
    // Simulate OCR processing (in production, use Google Vision API or similar)
    setTimeout(() => {
      // Mock OCR result
      const mockResult: OCRResult = {
        date: new Date().toISOString().split('T')[0],
        storeName: '백화점 본점',
        items: [
          { name: '경옥고 본초', quantity: 2, price: 45000 },
          { name: '홍삼정 건강', quantity: 1, price: 89000 },
        ],
        totalAmount: 179000,
      };
      
      setOcrResult(mockResult);
      setIsOcrProcessing(false);
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const applyOCRResult = () => {
    if (ocrResult) {
      setOrderDate(ocrResult.date);
      setStoreName(ocrResult.storeName);
      setItems(ocrResult.items.map(item => ({ ...item, price: item.price })));
      setActiveTab('manual');
    }
  };

  const handleSubmit = async () => {
    if (!storeName || items.length === 0) {
      alert('매장명과 최소 1개 이상의 상품을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      router.push('/pos');
    }, 1500);
  };

  return (
    <div className="container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/pos" className="back-btn">← 돌아가기</Link>
          <span className="header-title">수기 주문 등록</span>
        </div>
      </header>

      <div className="main-card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            직접 입력
          </button>
          <button 
            className={`tab ${activeTab === 'ocr' ? 'active' : ''}`}
            onClick={() => setActiveTab('ocr')}
          >
            영수증 OCR
          </button>
        </div>

        <div className="content">
          {activeTab === 'manual' ? (
            <>
              <div className="form-section">
                <div className="section-title">기본 정보</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">주문일자</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={orderDate}
                      onChange={e => setOrderDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">매장명</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="백화점 서울, 직영점..."
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="items-section">
                  <div className="items-header">
                    <span className="section-title" style={{ marginBottom: 0 }}>주문 상품</span>
                    <button className="add-item-btn" onClick={addItem}>+ 상품 추가</button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 40px', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666', padding: '0 0.5rem' }}>
                    <span>상품명</span>
                    <span>수량</span>
                    <span>단가</span>
                    <span></span>
                  </div>
                  
                  {items.map((item, index) => (
                    <div key={index} className="item-row">
                      <input 
                        type="text" 
                        className="item-input"
                        placeholder="상품명"
                        value={item.name}
                        onChange={e => updateItem(index, 'name', e.target.value)}
                      />
                      <input 
                        type="number" 
                        className="item-input"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                      <input 
                        type="number" 
                        className="item-input"
                        min="0"
                        placeholder="0"
                        value={item.price || ''}
                        onChange={e => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                      />
                      <button className="remove-btn" onClick={() => removeItem(index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-box">
                <div className="summary-row">
                  <span>주문 상품 수</span>
                  <span>{items.reduce((sum, item) => sum + item.quantity, 0)}개</span>
                </div>
                <div className="summary-row total">
                  <span>총 금액</span>
                  <span>{calculateTotal().toLocaleString()}원</span>
                </div>
              </div>

              <div className="actions">
                <Link href="/pos" className="btn btn-secondary">취소</Link>
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '처리중...' : '주문 등록'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div 
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <div className="upload-icon">📷</div>
                <p className="upload-text">
                  <strong>클릭 또는 드래그</strong>하여 이미지 업로드<br/>
                  영수증 이미지를 올려주세요
                </p>
              </div>

              {isOcrProcessing && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p>영수증 텍스트 인식 중...</p>
                </div>
              )}

              {ocrResult && !isOcrProcessing && (
                <div className="ocr-preview">
                  <div className="ocr-title">
                    <span>인식 결과</span>
                    <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ 인식 완료</span>
                  </div>
                  
                  <div className="ocr-field">
                    <span className="ocr-label">주문일자</span>
                    <span className="ocr-value">{ocrResult.date}</span>
                  </div>
                  <div className="ocr-field">
                    <span className="ocr-label">매장</span>
                    <span className="ocr-value">{ocrResult.storeName}</span>
                  </div>
                  <div className="ocr-field">
                    <span className="ocr-label">상품</span>
                    <div className="ocr-value">
                      {ocrResult.items.map((item, i) => (
                        <div key={i} style={{ padding: '0.25rem 0' }}>
                          {item.name} x{item.quantity} = {item.price.toLocaleString()}원
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ocr-field">
                    <span className="ocr-label">총액</span>
                    <span className="ocr-value" style={{ color: '#2d5a27', fontWeight: 700 }}>
                      {ocrResult.totalAmount.toLocaleString()}원
                    </span>
                  </div>

                  <div className="ocr-actions">
                    <button className="ocr-retry" onClick={() => setOcrResult(null)}>다시撮影</button>
                    <button className="ocr-apply" onClick={applyOCRResult}>데이터 적용</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="success-toast">
          ✓ 주문이 등록되었습니다
        </div>
      )}
    </div>
  );
}