# POS 관련 작업 예정

> 최종 업데이트: 2026-04-04

---

## 완료된 작업

- [x] POS 기본 결제 흐름 (현금/카드/카카오) — 카드 기본값
- [x] 바코드 스캔 + 제품 검색
- [x] 고객 연동 (포인트 사용/적립)
- [x] 빠른 고객 등록
- [x] 할인 기능 (금액 / % 토글)
- [x] 영수증 출력 (프린트)
- [x] 환불 처리
- [x] 모바일 슬라이드업 장바구니
- [x] VAN 카드 단말기 연동 인프라 구축
  - `src/lib/card-terminal.ts` 작성
  - 카드 결제 2단계 흐름 (승인 요청 → 결제 완료)
  - `sales_orders.approval_no` / `card_info` 컬럼 추가 (migration 011)
  - 영수증에 승인번호·카드정보 표시
- [x] 가상 단말기 테스트 모드 (`/api/card-terminal/mock`)
  - env 미설정 시 자동 활성화, 2초 후 가짜 승인 반환
  - POS 화면에 "테스트 모드" 배지 표시

---

## ⚡ VAN 에이전트 수령 시 즉시 적용 절차

> 에이전트를 받는 즉시 아래 순서대로 진행. 코드 수정 최소화.

### Step 1 — 에이전트 설치 및 포트 확인

VAN사 에이전트를 설치하고 **HTTP 로컬 포트 번호** 확인.
(에이전트 설치 가이드 또는 설정 파일에 명시됨 — 보통 7001, 8080 등)

### Step 2 — 환경변수 1줄 추가

프로젝트 루트의 `.env.local` 파일에 추가:

```
NEXT_PUBLIC_CARD_TERMINAL_URL=http://localhost:7001
```

> 포트번호를 실제 에이전트 포트로 교체.  
> 이 줄 하나만 추가하면 테스트 mock이 자동 비활성화되고 실제 단말기로 전환됨.

### Step 3 — 빌드 및 재시작

```bash
npm run build
npm run start
```

### Step 4 — 응답 필드명 확인 (필요 시만)

에이전트 문서를 받아 아래 필드명과 비교:

| 항목 | 현재 코드가 인식하는 필드명 후보 |
|------|-------------------------------|
| 성공코드 | `resultCode`, `ResultCode`, `code`, `resCd`, `result` |
| 성공값 | `0000`, `00`, `000`, `SUCCESS`, `APPROVED`, `OK` |
| 승인번호 | `approvalNo`, `ApprovalNo`, `approval_no`, `authNo`, `AuthNo` |
| 카드사명 | `cardName`, `CardName`, `card_name`, `issuerName` |
| 카드번호 | `cardNo`, `CardNo`, `card_no`, `maskedCardNo` |
| 할부 | `installment`, `Installment`, `quota` |
| 오류메시지 | `resultMsg`, `ResultMsg`, `message`, `errMsg` |

**위 목록에 없는 필드명이면** `src/lib/card-terminal.ts` 의 해당 `pick()` 호출에 추가:

```typescript
// 예시 — 승인번호 필드명이 "authCode" 인 경우
approvalNo: pick(data, 'approvalNo', 'ApprovalNo', 'authNo', 'AuthNo', 'authCode'),
```

### Step 5 — 요청 바디 확인 (필요 시만)

에이전트가 다른 요청 포맷을 요구하면 `src/lib/card-terminal.ts` 의 `requestCardApproval()` 내 body 수정:

```typescript
body: JSON.stringify({
  reqType: 'APPROVAL',   // VAN사 요구 필드명으로 교체
  tradeType: '01',
  amount,
  taxAmount,
  supplyAmount: amount - taxAmount,
  serviceAmount: 0,
  installment: '00',
}),
```

### Step 6 — 테스트 체크리스트

- [ ] 카드 승인 정상 흐름 (신용카드 일시불)
- [ ] 카드 승인 거절 처리 (한도 초과 등)
- [ ] 타임아웃 — 60초 내 응답 없을 때 에러 메시지 표시
- [ ] 영수증에 승인번호 · 카드정보 정상 출력

### Step 7 — Windows 시작프로그램 등록

에이전트가 PC 재부팅 후에도 자동 실행되도록 등록:

```
Win + R → shell:startup → 에이전트 바로가기 붙여넣기
```

또는 VAN사 에이전트가 Windows 서비스로 설치되는 경우 자동 등록됨.

---

## 추후 검토 항목

- [ ] **카드 취소(환불) 자동 연동** — 현재 환불 시 VAN 취소 요청 미연결
  - `src/app/(dashboard)/pos/RefundModal.tsx` → `requestCardCancel()` 호출 추가
  - 원승인번호를 `sales_orders.approval_no` 에서 조회해 취소 요청
  - 구현 위치: `RefundModal` 의 환불 확정 직전 단계
- [ ] **할부 선택 UI** — 현재 일시불(`00`) 고정
  - 카드 선택 시 0/3/6/12개월 버튼 추가
  - `requestCardApproval(amount, taxAmount, installment)` 인자 추가
- [ ] **Supabase migration 011 적용** (아직 미적용)
  ```sql
  ALTER TABLE sales_orders
    ADD COLUMN IF NOT EXISTS approval_no  VARCHAR(20)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS card_info    VARCHAR(100) DEFAULT NULL;
  ```

---

## 단말기 정보

| 항목 | 내용 |
|------|------|
| 제조사 | O2CHECK |
| 모델 | SWT-3100A |
| 연결 | LAN (유선) |
| VAN사 | 확인 필요 — O2CHECK 고객센터 1588-1948 |
| 연동 방식 | 로컬 HTTP 에이전트 → `http://localhost:포트` |

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `src/lib/card-terminal.ts` | VAN 에이전트 통신, 필드명 매핑 |
| `src/app/api/card-terminal/mock/route.ts` | 테스트용 가상 단말기 |
| `src/app/(dashboard)/pos/page.tsx` | POS UI, 카드 승인 흐름 |
| `src/app/(dashboard)/pos/ReceiptModal.tsx` | 영수증, 승인번호 표시 |
| `src/lib/actions.ts` → `processPosCheckout()` | DB 저장, approval_no/card_info |
| `supabase/migrations/011_card_approval.sql` | DB 컬럼 추가 (미적용) |
