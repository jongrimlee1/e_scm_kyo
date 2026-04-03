export const DB_SCHEMA = `
== 핵심 테이블 스키마 ==

branches: id, name, code, channel(STORE/DEPT_STORE/ONLINE/EVENT), address, phone, is_active
products: id, name, code, barcode, unit, price(판매가), cost(원가), is_active
inventories: id, branch_id, product_id, quantity, safety_stock  [UNIQUE(branch_id, product_id)]
inventory_movements: id, branch_id, product_id, movement_type(IN/OUT/ADJUST/TRANSFER/PRODUCTION), quantity, memo, created_at

customers: id, name, phone, email, grade(NORMAL/VIP/VVIP), primary_branch_id, address, health_note, is_active
customer_grades: code(NORMAL/VIP/VVIP), name, point_rate(1%/2%/3%), is_active
point_history: id, customer_id, sales_order_id, type(earn/use/adjust/expire), points, balance, description

sales_orders: id, order_number(SA-...), channel, branch_id, customer_id, total_amount, discount_amount, points_used, points_earned, payment_method(cash/card/kakao), status(COMPLETED/CANCELLED/REFUNDED/PARTIALLY_REFUNDED), ordered_at
sales_order_items: id, sales_order_id, product_id, quantity, unit_price, total_price

suppliers: id, name, code, contact_name, phone, email, is_active
purchase_orders: id, order_number(PO-...), supplier_id, branch_id, status(DRAFT/CONFIRMED/PARTIALLY_RECEIVED/RECEIVED/CANCELLED), total_amount, ordered_at, memo
purchase_order_items: id, purchase_order_id, product_id, ordered_quantity, received_quantity, unit_price

bom: id, product_id(완제품), material_id(원재료), quantity_required
production_orders: id, order_number(WO-...), product_id(완제품), branch_id, quantity, status(PENDING/IN_PROGRESS/COMPLETED/CANCELLED), started_at, completed_at, memo

notifications: id, customer_id, type(SMS/ALIMTALK), message, status(sent/failed/pending), sent_at, sent_by, external_message_id, error_message
users: id, name, email, phone, role(SUPER_ADMIN/HQ_OPERATOR/PHARMACY_STAFF/BRANCH_STAFF/EXECUTIVE), branch_id
`;

export const BUSINESS_RULES = `
== 업무 규칙 ==
고객 등급: NORMAL(일반,1%적립) VIP(2%적립) VVIP(3%적립). 누적구매 100만→VIP, 300만→VVIP 자동승급 가능.
발주 워크플로우: DRAFT → CONFIRMED → (PARTIALLY_RECEIVED) → RECEIVED → 입고 시 재고 자동 증가
생산 워크플로우: PENDING → IN_PROGRESS → COMPLETED. 완료 시 BOM 원재료 차감 + 완제품 재고 증가.
채널: STORE=한약국매장, DEPT_STORE=백화점, ONLINE=자사몰(카페24), EVENT=이벤트
결제: cash=현금, card=카드, kakao=카카오페이
포인트 1P = 1원 할인
`;
