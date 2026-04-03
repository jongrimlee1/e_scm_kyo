SET search_path TO public;

-- ─── 세션 토큰 테이블 ──────────────────────────────────────────────────────────
-- 세션을 DB에 저장해 서버 측에서 무효화 가능하게 함
CREATE TABLE IF NOT EXISTS public.session_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 hex
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_tokens_token_hash ON public.session_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id    ON public.session_tokens(user_id);

-- ─── 감사 로그 테이블 ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action       VARCHAR(50) NOT NULL,   -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  table_name   VARCHAR(100),
  record_id    UUID,
  description  TEXT,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- RLS
ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_tokens_all ON public.session_tokens FOR ALL TO authenticated USING (true);
CREATE POLICY audit_logs_all     ON public.audit_logs     FOR ALL TO authenticated USING (true);

-- screen_permissions: 감사로그 관리자 전용 화면
INSERT INTO public.screen_permissions (role, screen_path, can_view, can_edit)
VALUES
  ('SUPER_ADMIN', '/audit-logs', true, false)
ON CONFLICT DO NOTHING;
