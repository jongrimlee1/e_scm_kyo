-- 경옥채 통합 관리 시스템 PostgreSQL Schema
-- ERP/CRM/POS 통합 데이터베이스

-- 1. 등급 테이블 (선생 - users보다 먼저 생성)
CREATE TABLE user_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_amount INTEGER DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    points_rate DECIMAL(5,2) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 등급 데이터 삽입
INSERT INTO user_levels (name, min_amount, discount_rate, points_rate) VALUES
('일반', 0, 0, 1.0),
('실버', 300000, 3, 1.5),
('골드', 1000000, 5, 2.0),
('플래티넘', 3000000, 10, 3.0);

-- 2. 매장 테이블
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('직영', '백화점', '온라인')),
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 상품 테이블
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    price INTEGER NOT NULL,
    cost INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    description TEXT,
    barcode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 재고 테이블
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

-- 5. 고객 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    kakao_id VARCHAR(100) UNIQUE,
    birth_date DATE,
    gender VARCHAR(10),
    level_id INTEGER REFERENCES user_levels(id) DEFAULT 1,
    total_purchase_amount INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    customer_number VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    kakao_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 전화번호 인덱스 (빠른 조회)
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_kakao_id ON users(kakao_id);

-- 6. 주문 테이블
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    user_id INTEGER REFERENCES users(id),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    order_type VARCHAR(20) CHECK (order_type IN ('판매', '교환', '반품', '증정')),
    total_amount INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    final_amount INTEGER NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('현금', '카드', '카카오페이', '포인트')),
    points_used INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);

-- 7. 주문 상세 테이블
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 포인트 내역 테이블
CREATE TABLE points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('적립', '사용', '소멸', '보정')),
    description TEXT,
    order_id INTEGER REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_points_created_at ON points(created_at);

-- 9. 알림톡 발송 이력 테이블
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('가입', '구매', '재구매', '포인트', '등급', '이벤트')),
    message TEXT NOT NULL,
    template_code VARCHAR(50),
    sender VARCHAR(50),
    external_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. 시스템 설정 테이블
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정 삽입
INSERT INTO settings (key, value, description) VALUES
('company_name', '경옥채', '회사명'),
('kakao_api_key', '', '카카오 API 키'),
('aligo_api_key', '', '알리고 API 키'),
('repurchase_alert_days', '25', '재구매 알림 발송 일수'),
('points_expiry_months', '12', '포인트 유효 기간(개월)');

-- 11. 관리자 테이블
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function: 주문 번호 생성
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month VARCHAR(6);
    seq_num INTEGER;
    new_order_number VARCHAR(30);
BEGIN
    year_month := TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMM');
    
    SELECT COALESCE(MAX(
        CASE 
            WHEN order_number ~ ('^' || year_month || '[0-9]{4}$') 
            THEN NULLIF(order_number, '')::INTEGER 
            ELSE NULL 
        END
    ), 0) + 1 INTO seq_num
    FROM orders
    WHERE order_number LIKE year_month || '%';
    
    new_order_number := year_month || LPAD(seq_num::TEXT, 4, '0');
    NEW.order_number := new_order_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: 주문 생성 시 주문 번호 자동 생성
-- (주문번호 생성 로직은 애플리케이션에서 처리하는 것이 권장됨)

-- Function: 구매 완료 시 등급 자동 계산
CREATE OR REPLACE FUNCTION update_user_level(user_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    total_amount INTEGER;
    new_level_id INTEGER;
BEGIN
    SELECT COALESCE(total_purchase_amount, 0) INTO total_amount
    FROM users WHERE id = user_id_param;
    
    SELECT id INTO new_level_id
    FROM user_levels
    WHERE min_amount <= total_amount
    ORDER BY min_amount DESC
    LIMIT 1;
    
    IF new_level_id IS NOT NULL THEN
        UPDATE users SET level_id = new_level_id, updated_at = CURRENT_TIMESTAMP
        WHERE id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- View: 통합 매출 대시보드용
CREATE OR REPLACE VIEW sales_dashboard AS
SELECT 
    DATE(o.order_date) as sale_date,
    s.id as store_id,
    s.name as store_name,
    s.type as store_type,
    COUNT(o.id) as order_count,
    SUM(o.final_amount) as total_sales,
    SUM(o.points_earned) as total_points_earned,
    SUM(o.points_used) as total_points_used
FROM orders o
JOIN stores s ON o.store_id = s.id
WHERE o.status = 'completed'
GROUP BY DATE(o.order_date), s.id, s.name, s.type
ORDER BY sale_date DESC, total_sales DESC;

-- View: 고객 등급별 통계
CREATE OR REPLACE VIEW user_level_stats AS
SELECT 
    ul.name as level_name,
    ul.discount_rate,
    ul.points_rate,
    COUNT(u.id) as user_count,
    SUM(u.total_purchase_amount) as total_purchase,
    AVG(u.total_purchase_amount) as avg_purchase
FROM users u
JOIN user_levels ul ON u.level_id = ul.id
WHERE u.is_active = true
GROUP BY ul.id, ul.name, ul.discount_rate, ul.points_rate
ORDER BY ul.min_amount;

-- View: 상품별 판매 통계
CREATE OR REPLACE VIEW product_sales_stats AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.price,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_sales
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY p.id, p.name, p.category, p.price
ORDER BY total_sales DESC;