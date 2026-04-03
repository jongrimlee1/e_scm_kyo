# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands
```bash
npm run dev    # dev server localhost:3000
npm run build  # production build
npm run lint   # ESLint
```

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL) · Cafe24

**경옥채 사내 통합시스템** — multi-branch pharmaceutical/wellness ERP/CRM

## Auth
Custom session auth (not Supabase Auth). Login → SHA256 password check against `users` table → httpOnly cookies:
- Server-only: `session_token`, `user_id`
- Client-readable: `user_name`, `user_role`, `user_branch_id`

Middleware: `src/lib/supabase/middleware.ts` · Auth logic: `src/app/login/actions.ts`

## Roles
```
SUPER_ADMIN | HQ_OPERATOR | PHARMACY_STAFF | BRANCH_STAFF | EXECUTIVE
```
- `BRANCH_STAFF` / `PHARMACY_STAFF`: locked to their branch — hide/disable branch selectors
- Nav filtered by `screen_permissions` table (`app/(dashboard)/layout.tsx`)

## Data Access
| Pattern | Where |
|---------|-------|
| Mutations | `src/lib/actions.ts` server actions → `revalidatePath()` |
| Server reads | `src/lib/supabase/server.ts` (SSR, cookie-aware) |
| Client reads | `src/lib/supabase/client.ts` → `useEffect` |
| API routes | Dashboard aggregation + Cafe24 webhooks only |

Domain-specific actions split into: `purchase-actions.ts`, `production-actions.ts`, `return-actions.ts`, `notification-actions.ts`, `accounting-actions.ts`, `customer-analytics-actions.ts`

## Key Tables
| Table | Purpose |
|-------|---------|
| `branches` | Locations · channel: STORE/DEPT_STORE/ONLINE/EVENT |
| `products` + `inventories` | Product master + per-branch stock |
| `inventory_movements` | Audit: IN/OUT/ADJUST/PRODUCTION |
| `sales_orders` + `sales_order_items` | POS + online transactions |
| `customers` + `customer_grades` | CRM · loyalty points via `point_history.balance` |
| `screen_permissions` | Role → route access |

Schema: `supabase/schema.sql` · Migrations: `supabase/migrations/`

## Business Rules
- Creating a product auto-inserts `inventories` rows for every active branch (qty=0)
- `customers` has no `total_points` column — read latest `point_history.balance` instead
- POS flow: `sales_order` → `sales_order_items` → deduct `inventories` → `inventory_movements(OUT)` → optional `point_history`
- Cafe24 webhook: verify HMAC-SHA256 → `Cafe24Client.getOrder()` → upsert `sales_order(ONLINE)` → `cafe24_sync_logs`
- VAT: prices are tax-inclusive · supply = price ÷ 1.1 · VAT = price × 10/110

## Env Vars
```
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY
CAFE24_MALL_ID  CAFE24_CLIENT_ID  CAFE24_CLIENT_SECRET  CAFE24_SHOP_NO
```

---

## Three Man Team — Multi-Agent Workflow

복잡한 작업을 3개 에이전트가 병렬로 처리하는 구성.

### 역할
| 역할 | 담당 |
|------|------|
| **Orchestrator** (메인) | 요청 분해 → 서브에이전트 위임 → 결과 통합 · 충돌 조정 |
| **Worker A** | 독립 worktree에서 기능 구현 (주로 UI/페이지) |
| **Worker B** | 독립 worktree에서 기능 구현 (주로 액션/DB) |

### 사용 기준
- 파일 겹침이 없는 독립 작업 2개 이상일 때만 병렬화
- 단일 파일 수정 작업은 병렬화 불필요

### Orchestrator 실행 예시
```
Agent(subagent_type="general-purpose", isolation="worktree",
  prompt="[Worker A] src/app/(dashboard)/X/page.tsx 에 ... 구현. 
          건드릴 파일: page.tsx, CustomerModal.tsx만")

Agent(subagent_type="general-purpose", isolation="worktree",
  prompt="[Worker B] src/lib/actions.ts 에 ... 액션 추가.
          건드릴 파일: actions.ts만")
```

### 규칙
1. 각 Worker에게 **건드릴 파일 목록을 명시** — 겹치면 병렬 불가
2. Worker는 commit하지 않음 — Orchestrator가 결과 검토 후 통합
3. DB 스키마 변경(migration)은 항상 Orchestrator가 직접 처리
4. 빌드 검증(`npm run build`)은 통합 후 Orchestrator가 실행
