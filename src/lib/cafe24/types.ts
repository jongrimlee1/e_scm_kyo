export interface Cafe24OrderItem {
  product_no: number;
  product_name: string;
  product_code: string;
  option_id: string;
  option_value: string;
  quantity: number;
  price: number;
  discount_amount: number;
  total_discount_amount: number;
}

export interface Cafe24Order {
  order_id: string;
  order_no: number;
  order_date: string;
  order_status: Cafe24OrderStatus;
  member_id: string;
  customer_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_message: string;
  items: Cafe24OrderItem[];
  total_product_price: number;
  total_discount_price: number;
  total_delivery_price: number;
  total_order_price: number;
  payment_method: string;
  payment_date: string;
  shipped_date: string | null;
  completed_date: string | null;
}

export type Cafe24OrderStatus =
  | 'N'  // New order (not processed)
  | 'P'  // Preparing
  | 'S'  // Shipped
  | 'D'  // Delivered
  | 'C'; // Cancelled

export interface Cafe24WebhookEvent {
  event_type: Cafe24WebhookEventType;
  order_id: string;
  order_no: number;
  status_code: string;
  member_id: string;
  product_no: number;
  quantity: number;
  tracking_no: string | null;
  shipped_date: string | null;
  timestamp: number;
}

export type Cafe24WebhookEventType =
  | 'order.created'
  | 'order.paid'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.refunded';

export interface Cafe24OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface Cafe24APIResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface Cafe24SyncResult {
  success: boolean;
  order_id: string;
  local_order_id?: string;
  error?: string;
}

export const CAFE24_ORDER_STATUS_MAP: Record<Cafe24OrderStatus, string> = {
  N: 'PENDING',
  P: 'CONFIRMED',
  S: 'SHIPPED',
  D: 'COMPLETED',
  C: 'CANCELLED',
};

export const CAFE24_STATUS_TO_LOCAL: Record<string, string> = {
  N: 'PENDING',
  P: 'CONFIRMED',
  S: 'SHIPPED',
  D: 'COMPLETED',
  C: 'CANCELLED',
};
