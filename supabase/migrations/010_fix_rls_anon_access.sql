-- =====================================================
-- Migration 010: RLS anon 접근 복구
-- =====================================================
-- 이 시스템은 Custom Session Auth를 사용 (Supabase Auth JWT 미사용).
-- 서버 액션도 NEXT_PUBLIC_SUPABASE_ANON_KEY를 사용하여 anon role로 연결됨.
-- 009 마이그레이션에서 TO authenticated로 변경 시 서버 액션도 차단되는 문제 발생.
--
-- 대상: migration 001/002에서 생성된 테이블 (RLS가 실제 활성화된 테이블만)
-- schema.sql 테이블(inventories 등)은 RLS 미활성 상태이므로 해당 없음.

-- ── suppliers
DROP POLICY IF EXISTS suppliers_all ON suppliers;
CREATE POLICY suppliers_all ON suppliers FOR ALL USING (true) WITH CHECK (true);

-- ── purchase_orders
DROP POLICY IF EXISTS purchase_orders_all ON purchase_orders;
CREATE POLICY purchase_orders_all ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- ── purchase_order_items
DROP POLICY IF EXISTS purchase_order_items_all ON purchase_order_items;
CREATE POLICY purchase_order_items_all ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- ── gl_accounts (회계 계정과목)
DROP POLICY IF EXISTS gl_accounts_all ON gl_accounts;
CREATE POLICY gl_accounts_all ON gl_accounts FOR ALL USING (true) WITH CHECK (true);

-- ── journal_entries (분개)
DROP POLICY IF EXISTS journal_entries_all ON journal_entries;
CREATE POLICY journal_entries_all ON journal_entries FOR ALL USING (true) WITH CHECK (true);

-- ── journal_entry_lines (분개 라인)
DROP POLICY IF EXISTS journal_entry_lines_all ON journal_entry_lines;
CREATE POLICY journal_entry_lines_all ON journal_entry_lines FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 참고: 보안 수준을 높이려면 서버 액션에서 service_role 키를 사용해야 함.
-- 현재는 anon 키를 서버/클라이언트 모두 사용하므로 USING (true) 정책 유지.
-- ──────────────────────────────────────────────────────────────────────────────
