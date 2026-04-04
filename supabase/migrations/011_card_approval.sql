-- =====================================================
-- Migration 011: 카드 승인정보 컬럼 추가
-- =====================================================
-- 카드 단말기(VAN) 연동 시 승인번호, 카드정보 저장

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS approval_no  VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS card_info    VARCHAR(100) DEFAULT NULL;
-- card_info 예시: "신한카드 *1234" 또는 "BC카드 *5678 3개월"

COMMENT ON COLUMN sales_orders.approval_no IS '카드 VAN 승인번호';
COMMENT ON COLUMN sales_orders.card_info   IS '카드사명 + 끝4자리 + 할부정보';
