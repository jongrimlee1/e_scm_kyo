SET search_path TO public;

-- production_orders에 branch_id, started_at 추가
ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- screen_permissions: 생산 관리 경로 등록
INSERT INTO public.screen_permissions (role, screen_path, can_view, can_edit)
VALUES
  ('SUPER_ADMIN',    '/production', true, true),
  ('HQ_OPERATOR',    '/production', true, true),
  ('PHARMACY_STAFF', '/production', true, true),
  ('BRANCH_STAFF',   '/production', true, true)
ON CONFLICT DO NOTHING;
