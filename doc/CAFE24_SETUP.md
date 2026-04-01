# Cafe24 연동 설정 가이드

## 개요

경옥채 자사몬(Cafe24) 쇼핑몰과 통합시스템 간 주문/배송 연동을 위한 가이드입니다.

## 현재 상태

### 구현 완료
- [x] Cafe24 API Client (`src/lib/cafe24/client.ts`)
- [x] Cafe24 Webhook 핸들러 (`src/lib/cafe24/webhook.ts`)
- [x] Webhook API 엔드포인트 (`src/app/api/webhooks/cafe24/route.ts`)
- [x] DB 테이블准备好了 (`cafe24_sync_logs`, `sales_orders.cafe24_order_id`, `customers.cafe24_member_id`)

### 구현 기능
1. **FR-M01: Cafe24 주문 자동 수집**
   - Webhook으로 주문 생성 이벤트 수신
   - `sales_orders` 테이블에 자동 저장
   - 고객 `cafe24_member_id` 매핑

2. **FR-M02: 주문 상태 및 배송 현황 연동**
   - `order.shipped` → SHIPPED 상태
   - `order.delivered` → COMPLETED 상태
   - `order.cancelled` → CANCELLED 상태
   - 모든 동기화 로그 `cafe24_sync_logs`에 기록

---

## Vercel 환경변수 설정

Vercel Dashboard → 프로젝트 → Settings → Environment Variables에서 다음 추가:

| Name | Value | 비고 |
|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon key |
| `CAFE24_MALL_ID` | `yourmall` | 자사몬 몰 ID (예: `myshop`) |
| `CAFE24_CLIENT_ID` | `BrIfqEKoPxeE...` | Cafe24 개발자센터 앱 Client ID |
| `CAFE24_CLIENT_SECRET` | `xxx...` | Cafe24 개발자센터 앱 Client Secret |
| `CAFE24_SHOP_NO` | `1` | 멀티쇼핑몰 번호 (기본 1) |

---

## Cafe24 개발자센터 설정

### 1. 앱 생성
1. [Cafe24 개발자센터](https://developers.cafe24.com/) 접속
2. 앱 만들기 → "외부連携アプリ" 선택
3. 앱 이름: `경옥채 통합시스템`
4. Redirect URL: `https://your-domain.com/api/auth/cafe24/callback`

### 2. 필요 Scope
```
mall.read_order      # 주문 조회
mall.read_product    # 상품 조회
mall.read_customer   # 고객 조회 (FR-M03용)
```

### 3. Webhook 설정
Cafe24 개발자센터 → 앱 → 웹훅 설정:

| 이벤트 | 웹훅 URL |
|--------|----------|
| 주문 생성 | `https://your-domain.com/api/webhooks/cafe24` |
| 주문 결제완료 | `https://your-domain.com/api/webhooks/cafe24` |
| 주문 발송완료 | `https://your-domain.com/api/webhooks/cafe24` |
| 주문 배송완료 | `https://your-domain.com/api/webhooks/cafe24` |
| 주문 취소 | `https://your-domain.com/api/webhooks/cafe24` |
| 주문 환불 | `https://your-domain.com/api/webhooks/cafe24` |

### 4. 서명 검증
Webhook 헤더: `X-Cafe24-Signature`
- HMAC SHA256으로 payload 서명 검증

---

## 로컬 개발 환경 설정

`.env.local` 파일 생성 (또는 `.env.local.example` 참고):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CAFE24_MALL_ID=yourmall
CAFE24_CLIENT_ID=yourclientid
CAFE24_CLIENT_SECRET=yourclientsecret
CAFE24_SHOP_NO=1
```

---

## API 참고

### Cafe24 Admin API
- Base URL: `https://{mallid}.cafe24api.com/api/v2/admin`
- 인증: OAuth 2.0 Bearer Token
- Rate Limit: Leaky Bucket (1초 2회, 초과시 429)
- 응답 형식: `{ resource: { ... } }`

### 주요 API 엔드포인트
```
GET /admin/orders/{order_no}          # 주문 상세 조회
GET /admin/orders                      # 주문 목록 조회
GET /admin/orders/status?order_no=...   # 주문 상태 조회
POST /admin/orders/{order_no}/tracking # 운송장번호 등록 (향후)
```

### Webhook 이벤트 타입
```
order.created    # 주문 생성
order.paid       # 결제 완료
order.shipped    # 발송 완료
order.delivered  # 배송 완료
order.cancelled  # 주문 취소
order.refunded   # 환불
```

---

## 테스트 방법

### 1. 로컬에서 Webhook 테스트
```bash
# Ngrok로 로컬 서버 노출
ngrok http 3000

# 테스트 주문 생성 (Cafe24 테스트모드)
curl -X POST https://your-ngrok-url/api/webhooks/cafe24 \
  -H "Content-Type: application/json" \
  -H "X-Cafe24-Signature: xxxxx" \
  -d '{"event_type":"order.created","order_no":12345,...}'
```

### 2. Supabase에서 로그 확인
```sql
SELECT * FROM cafe24_sync_logs ORDER BY created_at DESC LIMIT 20;
```

---

## Phase 2 예정 (FR-M03)

### 자사몬 고객 정보 CRM 연동
- 고객 가입/정보 변경 Webhook 처리
- `customers.cafe24_member_id` 자동 매핑
- 구매 이력 자동 동기화

---

## 문의
- Cafe24 API 문서: https://developers.cafe24.com/docs/api/
