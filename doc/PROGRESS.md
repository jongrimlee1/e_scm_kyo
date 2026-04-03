# 경옥채 사내 통합시스템 개발 진행 상황

**최종 업데이트**: 2026-04-03

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 경옥채 사내 통합시스템 (ERP + CRM + 대시보드) |
| 기술 스택 | Next.js 16 (App Router), TypeScript, Supabase (PostgreSQL), Tailwind CSS v4 |
| 배포 | Vercel |
| 저장소 | github.com/codeis8520-ctrl/e_scm_kyo |

---

## ⚠️ 외부 API / 환경변수 설정 필요 항목

> 아래 항목들은 코드는 완성되어 있으나, **실제 운영을 위해 반드시 키 발급 및 설정이 필요**합니다.
> `.env.local` 파일 및 Vercel 환경변수에 추가해야 합니다.

### 1. Solapi SMS / 알림톡 — ⚠️ 미설정 시 발송되지 않고 DB에만 기록됨

```bash
SOLAPI_API_KEY=          # Solapi 콘솔 > API 키 관리에서 발급
SOLAPI_API_SECRET=       # Solapi 콘솔 > API 키 관리에서 발급
SOLAPI_SENDER_PHONE=     # 발신번호 (01012345678 형식, 사전 등록 필수)
SOLAPI_KAKAO_PFID=       # 알림톡 사용 시 카카오 플러스친구 채널 ID (선택)
```

**설정 절차:**
1. https://console.solapi.com 접속 후 API 키 발급
2. 발신번호 메뉴에서 실제 사용할 번호 인증 등록
3. 알림톡 사용 시: 카카오 비즈니스 채널 개설 → Solapi에서 채널 연동 → `PFID` 확인
4. 알림톡 템플릿은 카카오 검수 후 Solapi 콘솔에서 `template_code` 확인

**구현 위치:** `src/lib/solapi/client.ts`, `src/lib/notification-actions.ts`

---

### 2. Supabase — 필수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

### 3. Cafe24 연동 — 자사몰 주문 자동 수집

```bash
CAFE24_MALL_ID=          # 자사몰 몰 ID
CAFE24_CLIENT_ID=        # Cafe24 개발자센터 > 앱 > Client ID
CAFE24_CLIENT_SECRET=    # Cafe24 개발자센터 > 앱 > Client Secret
CAFE24_SHOP_NO=1         # 멀티쇼핑몰 번호 (기본 1)
```

**설정 절차:** `doc/CAFE24_SETUP.md` 참고

**구현 위치:** `src/lib/cafe24/`, `src/app/api/webhooks/cafe24/route.ts`

---

### 4. AI 에이전트 (MiniMax)

```bash
MINIMAX_API_KEY=
MINIMAX_BASE_URL=https://api.minimax.chat
MINIMAX_MODEL=MiniMax-Text-01
```

---

### 5. 토스페이먼트 PG — ⚠️ 미구현 (발주사 결제 정책 확정 후 개발 예정)

```bash
NEXT_PUBLIC_TOSS_CLIENT_KEY=ck_test_xxx
TOSS_SECRET_KEY=sk_test_xxx
```

**발급:** https://developers.tosspayments.com > 내 상점 > API 키

---

## 데이터베이스 마이그레이션 현황

> Supabase SQL Editor에서 순서대로 실행해야 합니다.

| 파일 | 내용 | 실행 상태 |
|------|------|----------|
| `supabase/schema.sql` | 전체 기본 스키마 | ✅ 완료 |
| `supabase/migrations/001_purchase_returns.sql` | 매입(공급업체/발주/입고) + 환불 테이블 | ✅ 완료 |
| `supabase/migrations/002_accounting.sql` | 회계 테이블 (gl_accounts, journal_entries) + 계정과목 15개 시드 | ✅ 완료 |
| `supabase/migrations/003_production.sql` | production_orders에 branch_id, started_at 컬럼 추가 | ✅ 완료 |
| `supabase/migrations/004_security.sql` | session_tokens, audit_logs 테이블 | ✅ 완료 |
| `supabase/migrations/005_notifications.sql` | notifications에 external_message_id, error_message, sent_by 추가 | ✅ 완료 |

---

## 구현 완료 모듈

### 운영 ERP

#### 대시보드 `/`
- 오늘 매출 / 이번달 매출 / 자사몰 매출 / 재고 부족 / 이번달 매입 / 이번달 환불 카드
- 채널별 매출, 지점별 재고 상태, 최근 주문 위젯
- 역할별 뷰 전환 (본사/지점), BRANCH_STAFF는 자기 지점만 고정 표시

#### POS `/pos`
- 바코드 스캔, 고객 검색(이름/전화번호 뒷자리), 포인트 사용/적립
- 재고 자동 차감, 영수증 출력(프린트 팝업)
- 환불 처리 (품목별 수량 선택, 이유/방법 선택, 역재고 복원, 포인트 조정)

#### 매입 관리 `/purchases`
- 공급업체 CRUD `/purchases/suppliers`
- 발주서 생성/확정/취소, 발주서 상세 `/purchases/[id]`
- 입고 처리 (부분 입고 지원, 재고 자동 증가, 자동 분개 생성)
- 상태 워크플로우: DRAFT → CONFIRMED → PARTIALLY_RECEIVED → RECEIVED → CANCELLED

#### 생산 관리 `/production`
- BOM 등록/삭제 (완제품 + 원재료 + 소요량)
- 생산 지시 워크플로우: PENDING → IN_PROGRESS → COMPLETED
- 완료 시 원재료 재고 차감 + 완제품 재고 증가 + inventory_movements 기록
- 재료 소요량 미리보기 (부족 원재료 빨간색 표시, 예상 원가 계산)

#### 재고 관리 `/inventory`
- 지점별 재고 현황, 수동 조정
- 재고 실사 `/inventory/count` (ADJUST 이동 기록)

#### 제품 관리 `/products`
- CRUD, 바코드, 코드 자동생성
- 제품 생성 시 전 활성 지점에 재고 레코드 자동 생성

### CRM / 고객

#### 고객 목록 `/customers`
- 이름/전화번호 검색, 등급 필터
- 자동 등급 업그레이드 (누적 구매 100만→VIP, 300만→VVIP)

#### 고객 상세 `/customers/[id]`
- 기본 정보, 태그 관리, 포인트 이력
- 구매 이력 (주문별 accordion, 취소/환불 구분 표시)
- 상담 기록 5종 (상담/클레임/건강/견적/기타)

#### 고객 분석 `/customers/analytics`
- **RFM 세그멘테이션** 7단계 (최우수/충성/잠재충성/신규/이탈위험/유지필수/이탈)
  - R(최신성) · F(빈도) · M(금액) 5점 척도 점수 + 도트 시각화
  - 세그먼트 카드 클릭으로 고객 필터링
- **재구매 주기** 분포 바 차트 + 평균 주기 + 짧은 주기 Top 10
- **이탈 위험 고객** (60일+ 미방문, 2회↑ 구매) LTV 순 정렬, SMS 바로 발송 링크

### 보고서 / 회계

#### 보고서 `/reports`
- **매출 탭** — 기간/채널/지점 필터, 채널별/지점별 매출 바, 인기 제품, PDF 다운로드
- **매입 탭** — 발주 내역, 환불 내역
- **손익 요약 탭** — 간이 손익계산서 (총매출 → 환불 → 순매출)
- **월별 트렌드 탭** — SVG 이중 바 차트(매출/이익), 12개월 상세 테이블 + 마진율
- **제품별 마진 탭** — 매출/이익/마진율 정렬, 마진율 필터, 원가 미등록 시 경고

#### 회계 `/accounting`
- 계정과목 목록, 분개 목록 (자동/수동)
- 총계정원장 (계정별 잔액 추이)
- P&L 계산 (운영 테이블 직접 집계: 매출 - 할인 - 환불 - COGS)
- 수동 분개 입력 (대차 일치 실시간 검증)
- 자동 분개: 판매 시 (매출인식), 입고 시 (재고자산/미지급금)

### 알림 `/notifications`

- SMS / 알림톡 탭 분리
- 단체 발송 (고객 검색 + 체크박스) / 단일 발송
- **Solapi API 연동 완료** (실제 발송은 환경변수 설정 필요 — 위 참조)
- 발송 이력 (성공/실패 모두 기록, error_message 저장)
- 알림톡 템플릿 관리 `/notifications/templates`

### 보안

- **세션 토큰 DB 저장** — 로그인 시 `session_tokens` 테이블에 저장, 로그아웃 시 삭제 (서버 측 무효화 가능)
- **감사 로그** — `audit_logs` 테이블 (로그인/로그아웃/환불/생산/입고 이력)
- **서버 액션 인증 게이트** — `requireSession()` 적용 (환불, 생산 지시, 입고 처리)
- `src/lib/session.ts` — `getSession()`, `requireSession()`, `requireRole()`, `writeAuditLog()` 헬퍼

### 연동

- **Cafe24 웹훅** — 주문 자동 수집, 상태 업데이트, `cafe24_sync_logs` 기록
- **AI 에이전트** `/api/agent` — Function Calling 12종 도구, 다턴 히스토리

### 권한 관리

- 5개 역할: `SUPER_ADMIN`, `HQ_OPERATOR`, `PHARMACY_STAFF`, `BRANCH_STAFF`, `EXECUTIVE`
- `screen_permissions` 테이블 기반 메뉴 접근 제어
- BRANCH_STAFF / PHARMACY_STAFF: 지점 선택 고정, 타 지점 데이터 차단

---

## 미결 / 향후 작업

### 발주사와 회의 후 방향 결정 필요

#### 고객용 앱 `src/app/(customer)/`
- **목적 미확정** — 발주사와 협의 필요
- 후보 기능:
  - 포인트 잔액 + 이력 조회 (오프라인 채널 포함, Cafe24에는 없음)
  - 등급 현황 + 다음 등급까지 잔여 금액
  - 전 채널 구매 이력 통합
  - 건강 기록 / 상담 이력 열람 (노출 범위는 운영 정책 결정 필요)
- 인증 방식도 결정 필요 (SMS 본인인증 vs 로그인 없이 전화번호 조회 등)

#### 토스페이먼트 PG 연동
- POS 카드 결제 → `POST /v1/payments/key-in`
- 결제 취소 → `POST /v1/payments/{paymentKey}/cancel`
- 필요 DB 필드: `sales_orders`에 `pg_provider`, `pg_transaction_id`, `pg_accept_no`, `pg_card_company`, `pg_status`
- **선행 조건**: 토스페이먼트 API 키 발급 필요

### 기술 부채

- POS 결제 로직이 client-side Supabase 직접 호출 → 서버 액션으로 이전 권장
- `src/lib/actions.ts` 단일 파일 비대 → 도메인별 분리 검토

---

## 파일 구조 (주요)

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                         # 대시보드
│   │   ├── DashboardClient.tsx
│   │   ├── pos/
│   │   │   ├── page.tsx                     # POS
│   │   │   ├── ReceiptModal.tsx             # 영수증 출력
│   │   │   └── RefundModal.tsx              # 환불 처리
│   │   ├── purchases/
│   │   │   ├── page.tsx                     # 발주 목록
│   │   │   ├── [id]/page.tsx                # 발주 상세
│   │   │   └── suppliers/page.tsx           # 공급업체
│   │   ├── production/page.tsx              # 생산 관리
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   └── count/page.tsx              # 재고 실사
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx               # 고객 상세
│   │   │   └── analytics/page.tsx          # 고객 분석 (RFM 등)
│   │   ├── reports/page.tsx                 # 보고서 (5탭)
│   │   ├── accounting/page.tsx              # 회계
│   │   └── notifications/
│   │       ├── page.tsx                     # SMS/알림톡 발송
│   │       └── templates/page.tsx          # 템플릿 관리
│   ├── api/
│   │   ├── dashboard/route.ts
│   │   └── webhooks/cafe24/route.ts
│   └── login/
├── lib/
│   ├── actions.ts                           # 공통 서버 액션 (제품/고객/시스템코드)
│   ├── purchase-actions.ts                  # 매입 서버 액션
│   ├── return-actions.ts                    # 환불 서버 액션
│   ├── production-actions.ts               # 생산 서버 액션
│   ├── accounting-actions.ts               # 회계 서버 액션
│   ├── notification-actions.ts             # 알림 서버 액션
│   ├── customer-analytics-actions.ts       # 고객 분석 서버 액션
│   ├── session.ts                          # 세션 검증 / 감사 로그 헬퍼
│   ├── solapi/client.ts                    # Solapi SMS/알림톡 API 클라이언트
│   ├── cafe24/                             # Cafe24 연동
│   └── supabase/                           # Supabase 클라이언트

supabase/
├── schema.sql                              # 전체 기본 스키마
└── migrations/
    ├── 001_purchase_returns.sql
    ├── 002_accounting.sql
    ├── 003_production.sql
    ├── 004_security.sql
    └── 005_notifications.sql

doc/
├── PROGRESS.md                             # 이 파일
├── CAFE24_SETUP.md                         # Cafe24 설정 가이드
├── 작업계획_2026-04-03.md
└── (PRD/TDD 문서들)
```

---

## Git 커밋 이력 (주요)

| 커밋 | 내용 |
|------|------|
| `8cadf2e` | 고객 분석 — RFM 세그멘테이션, 재구매 주기, 이탈 위험 |
| `e8d4c28` | 손익 고도화 — 월별 트렌드 SVG 차트, 제품별 마진 분석 |
| `b9b0028` | Solapi SMS/알림톡 API 실제 연동 |
| `2a274e0` | 보안 강화 — session_tokens DB 저장, audit_logs, requireSession() |
| `494846c` | 003_production 마이그레이션 컬럼명 오류 수정 |
| `373c858` | 생산 관리 전면 개편 — branch_id 버그 수정, 3단계 워크플로우 |
| `afa157e` | 매입/환불/회계/재고실사/고객분석/보고서 등 대규모 기능 추가 |
