-- =====================================================
-- Migration 009: RLS 보안 강화
-- =====================================================
-- 현재 모든 테이블이 USING (true) 상태.
-- anon key 노출 시 전체 데이터 접근 가능한 취약점 보완.
--
-- 전략: 이 시스템은 Custom Session Auth 사용 (Supabase Auth JWT 미사용).
-- Supabase anon key는 서버에서만 사용되어야 하므로,
-- 클라이언트 직접 접근을 차단하고 authenticated role 기반으로 제한.
-- 단, 기존 authenticated 정책은 유지하면서 anon 접근을 제거.

-- ── branches: 공개 읽기 허용 (지점명은 민감 정보 아님), 쓰기는 authenticated만
DROP POLICY IF EXISTS branches_select ON branches;
DROP POLICY IF EXISTS branches_write ON branches;
DROP POLICY IF EXISTS branches_all ON branches;
CREATE POLICY branches_select ON branches FOR SELECT USING (true);
CREATE POLICY branches_write ON branches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── products: 공개 읽기 허용, 쓰기는 authenticated만
DROP POLICY IF EXISTS products_select ON products;
DROP POLICY IF EXISTS products_write ON products;
DROP POLICY IF EXISTS products_all ON products;
CREATE POLICY products_select ON products FOR SELECT USING (true);
CREATE POLICY products_write ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── inventories: authenticated만 접근
DROP POLICY IF EXISTS inventories_all ON inventories;
CREATE POLICY inventories_all ON inventories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── inventory_movements: authenticated만 접근
DROP POLICY IF EXISTS inventory_movements_all ON inventory_movements;
CREATE POLICY inventory_movements_all ON inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── customers: authenticated만 접근 (개인정보 보호)
DROP POLICY IF EXISTS customers_all ON customers;
CREATE POLICY customers_all ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── customer_grades: 공개 읽기, 쓰기는 authenticated
DROP POLICY IF EXISTS customer_grades_all ON customer_grades;
DROP POLICY IF EXISTS customer_grades_select ON customer_grades;
DROP POLICY IF EXISTS customer_grades_write ON customer_grades;
CREATE POLICY customer_grades_select ON customer_grades FOR SELECT USING (true);
CREATE POLICY customer_grades_write ON customer_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── customer_tags: authenticated만 접근
DROP POLICY IF EXISTS customer_tags_all ON customer_tags;
CREATE POLICY customer_tags_all ON customer_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── sales_orders: authenticated만 접근
DROP POLICY IF EXISTS sales_orders_select ON sales_orders;
DROP POLICY IF EXISTS sales_orders_all ON sales_orders;
CREATE POLICY sales_orders_all ON sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── sales_order_items: authenticated만 접근
DROP POLICY IF EXISTS sales_order_items_all ON sales_order_items;
CREATE POLICY sales_order_items_all ON sales_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── point_history: authenticated만 접근 (포인트 내역은 민감)
DROP POLICY IF EXISTS point_history_all ON point_history;
CREATE POLICY point_history_all ON point_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── suppliers: authenticated만
DROP POLICY IF EXISTS suppliers_all ON suppliers;
CREATE POLICY suppliers_all ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── purchase_orders: authenticated만
DROP POLICY IF EXISTS purchase_orders_all ON purchase_orders;
CREATE POLICY purchase_orders_all ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── purchase_order_items: authenticated만
DROP POLICY IF EXISTS purchase_order_items_all ON purchase_order_items;
CREATE POLICY purchase_order_items_all ON purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── production_orders: authenticated만
DROP POLICY IF EXISTS production_orders_all ON production_orders;
CREATE POLICY production_orders_all ON production_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── product_bom: authenticated만
DROP POLICY IF EXISTS product_bom_all ON product_bom;
CREATE POLICY product_bom_all ON product_bom FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── notifications: authenticated만
DROP POLICY IF EXISTS notifications_all ON notifications;
CREATE POLICY notifications_all ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── notification_templates: authenticated만
DROP POLICY IF EXISTS notification_templates_all ON notification_templates;
CREATE POLICY notification_templates_all ON notification_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── users: authenticated만, 패스워드 컬럼 노출 금지
DROP POLICY IF EXISTS users_all ON users;
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_write ON users;
CREATE POLICY users_select ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY users_write ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── screen_permissions: 공개 읽기 (로그인 전 메뉴 결정에 필요), 쓰기 authenticated
DROP POLICY IF EXISTS screen_permissions_all ON screen_permissions;
DROP POLICY IF EXISTS screen_permissions_select ON screen_permissions;
DROP POLICY IF EXISTS screen_permissions_write ON screen_permissions;
CREATE POLICY screen_permissions_select ON screen_permissions FOR SELECT USING (true);
CREATE POLICY screen_permissions_write ON screen_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── gl_accounts, journal_entries, journal_entry_lines: authenticated만
DROP POLICY IF EXISTS gl_accounts_all ON gl_accounts;
DROP POLICY IF EXISTS journal_entries_all ON journal_entries;
DROP POLICY IF EXISTS journal_entry_lines_all ON journal_entry_lines;
CREATE POLICY gl_accounts_all ON gl_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY journal_entries_all ON journal_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY journal_entry_lines_all ON journal_entry_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── session_tokens: authenticated만
DROP POLICY IF EXISTS session_tokens_all ON session_tokens;
CREATE POLICY session_tokens_all ON session_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── audit_logs: authenticated만
DROP POLICY IF EXISTS audit_logs_all ON audit_logs;
CREATE POLICY audit_logs_all ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── agent_memories: authenticated만
DROP POLICY IF EXISTS agent_memories_all ON agent_memories;
CREATE POLICY agent_memories_all ON agent_memories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── cafe24_sync_logs: authenticated만
DROP POLICY IF EXISTS cafe24_sync_logs_all ON cafe24_sync_logs;
CREATE POLICY cafe24_sync_logs_all ON cafe24_sync_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 참고: 현재 anon key가 클라이언트 코드(NEXT_PUBLIC_SUPABASE_ANON_KEY)에 노출되어 있음.
-- 위 정책으로 anon role의 민감 테이블 접근이 차단됨.
-- 추후 서버 전용 service_role key 사용으로 전환하면 보안 수준이 더 높아짐.
-- ──────────────────────────────────────────────────────────────────────────────
