-- =====================================================
-- Migration 006: 제품 과세/면세 구분 + 결제수단 확장
-- =====================================================

-- 1. products 테이블에 과세 여부 컬럼 추가
--    DEFAULT true: 기존 제품 모두 과세로 처리 (면세 제품은 수동 변경 필요)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN products.is_taxable IS '부가세 과세 여부 (true=과세 10%, false=면세). 한약류 등 면세 품목은 false로 설정';

-- 2. sales_orders 결제수단 제약 확장 (point 추가)
--    기존: cash, card, kakao
--    변경: cash, card, kakao, point, mixed (포인트 결제, 복합 결제 추가)
ALTER TABLE sales_orders
  DROP CONSTRAINT IF EXISTS sales_orders_payment_method_check;

ALTER TABLE sales_orders
  ADD CONSTRAINT sales_orders_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'kakao', 'point', 'mixed'));

COMMENT ON COLUMN sales_orders.payment_method IS '결제수단: cash=현금, card=카드, kakao=카카오페이, point=포인트, mixed=복합결제';
