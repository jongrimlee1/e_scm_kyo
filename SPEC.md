# 경옥채 통합 관리 시스템 (ERP/CRM/POS) 초기 설계

## 프로젝트 개요
- **브랜드**: 경옥채 (한약 기반 건강기능식품)
- **모델**: 정관장 (온/오프라인 통합 멤버십)
- **현재 상태**:cafe24(온라인), 이카운트(ERP) 분리 + 수기 입력
- **목표**: 자체 DB로 매출 자동 집계, 카카오 가입, 재구매 알림 자동화

## MVP 핵심 기능
1. 통합 DB (상품/재고/매장/고객/주문/포인트)
2. POS 웹 (바코드 판매, 전화번호 적립, 백화점 OCR/수기)
3. PWA 마이페이지 (카카오 3초 가입, 등급조회, 구매이력, 멤버십바코드)
4. CRM 마케팅 (카카오 알림톡, 재구매 알림 25~30일)
5. 본사 관리자 (통합 매출대시보드, 재고관리)

## 기술 스택
- Framework: Next.js 14 (App Router)
- UI: Tailwind CSS + Shadcn UI
- Database/Auth: Supabase (PostgreSQL)
- Communication: Aligo API (카카오 알림톡)

---

## 1. 데이터베이스 스키마

### 1.1 ERD 개요
```
users (고객) ──── orders (주문) ──── order_items
    │                 │
    └── points ───────┘
    │
    └── user_levels (등급변경이력)

stores (매장) ── inventory (재고)
    │
    └── products (상품)
```

### 1.2 테이블 상세

#### users (고객)
- id, email, phone, name, kakao_id, birth_date, gender
- level_id (등급), total_purchase_amount (누적구매액)
- points (보유포인트), created_at, updated_at

#### stores (매장)
- id, name, type (直營/백화점/온라인), code, address, phone
- is_active, created_at

#### products (상품)
- id, name, code (바코드), category, price, cost
- is_active, image_url, description

#### inventory (재고)
- id, store_id, product_id, quantity, updated_at

#### orders (주문)
- id, store_id, user_id, order_number, order_type (판매유형)
- total_amount, discount_amount, final_amount, payment_method
- status, order_date, created_at

#### order_items (주문상세)
- id, order_id, product_id, quantity, unit_price, subtotal

#### points (포인트내역)
- id, user_id, amount, type (적립/사용), description, order_id, created_at

#### user_levels (등급)
- id, name (일반/실버/골드/플래티넘), min_amount, discount_rate, points_rate

#### notifications (알림톡발송이력)
- id, user_id, type, message, sent_at, status