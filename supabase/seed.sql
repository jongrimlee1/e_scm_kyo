-- =====================================================
-- 초기 데이터 (Seed Data)
-- =====================================================

-- 지점 데이터는 schema.sql에서 이미_insert됨

-- 관리자 계정 (비밀번호: admin123)
-- Note: 실제 배포 시 비밀번호 해시 사용 필요
INSERT INTO users (email, password_hash, name, phone, role, branch_id) VALUES
('admin@kyungokchae.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', '시스템관리자', '010-0000-0000', 'SUPER_ADMIN', NULL),
('manager@kyungokchae.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', '운영매니저', '010-1111-1111', 'HQ_OPERATOR', NULL),
('staff1@kyungokchae.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', '한약국员工', '010-2222-2222', 'PHARMACY_STAFF', (SELECT id FROM branches WHERE code = 'PHA')),
('staff2@kyungokchae.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', '백화점 강남점 담당', '010-3333-3333', 'BRANCH_STAFF', (SELECT id FROM branches WHERE code = 'DS-GN'));
