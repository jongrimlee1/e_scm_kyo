-- =====================================================
-- Migration 007: 고객 등급 자동 업그레이드 기준 금액 설정
-- =====================================================

-- customer_grades에 업그레이드 기준 누적 구매액 컬럼 추가
-- NULL = 해당 등급으로 자동 업그레이드 없음 (NORMAL 등)
-- 값 설정 = 누적 구매액이 이 금액 이상이면 자동 업그레이드 대상
ALTER TABLE customer_grades
  ADD COLUMN IF NOT EXISTS upgrade_threshold DECIMAL(12,0) DEFAULT NULL;

COMMENT ON COLUMN customer_grades.upgrade_threshold IS
  '자동 등급 업그레이드 기준 누적 구매액. NULL이면 자동 업그레이드 없음.';

-- 기존 데이터에 기준 금액 설정 (VIP: 100만원, VVIP: 300만원)
UPDATE customer_grades SET upgrade_threshold = 1000000 WHERE code = 'VIP';
UPDATE customer_grades SET upgrade_threshold = 3000000 WHERE code = 'VVIP';
