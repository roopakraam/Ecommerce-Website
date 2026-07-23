// Database types matching supabase migrations (initial schema + Phase 0)

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type AdminRole = "admin" | "super_admin";

/** Snapshot stored on orders.shipping_address (jsonb) */
export interface ShippingAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface CategoryInsert {
  id?: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  /** Sum of active variant stock (maintained by DB trigger). */
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  category_id?: string | null;
  stock_quantity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number;
  compare_at_price?: number | null;
  category_id?: string | null;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  price_override: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantInsert {
  id?: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity?: number;
  price_override?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariantUpdate {
  size?: string;
  color?: string;
  sku?: string;
  stock_quantity?: number;
  price_override?: number | null;
  is_active?: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
}

export interface ProductImageInsert {
  id?: string;
  product_id: string;
  url: string;
  position?: number;
}

export interface ProductImageUpdate {
  url?: string;
  position?: number;
}

export interface Customer {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  phone: string | null;
  admin_notes: string;
  created_at: string;
}

export interface CustomerInsert {
  id?: string;
  auth_user_id: string;
  full_name?: string | null;
  phone?: string | null;
  admin_notes?: string;
  created_at?: string;
}

export interface CustomerUpdate {
  full_name?: string | null;
  phone?: string | null;
  admin_notes?: string;
}

export interface Address {
  id: string;
  customer_id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface AddressInsert {
  id?: string;
  customer_id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

export interface AddressUpdate {
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  is_default?: boolean;
}

/** Row in public.cart_items — distinct from storefront CartItem in lib/store/cart */
export interface CartItemRow {
  id: string;
  customer_id: string;
  variant_id: string;
  quantity: number;
  updated_at: string;
}

export interface CartItemInsert {
  id?: string;
  customer_id: string;
  variant_id: string;
  quantity: number;
  updated_at?: string;
}

export interface CartItemUpdate {
  quantity?: number;
  updated_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  coupon_id: string | null;
  coupon_code: string | null;
  total: number;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_reference: string | null;
  shipping_address: ShippingAddress;
  inventory_reserved: boolean;
  internal_notes: string;
  created_at: string;
}

export interface OrderInsert {
  id?: string;
  customer_id: string;
  status?: OrderStatus;
  subtotal: number;
  shipping_fee?: number;
  discount_amount?: number;
  coupon_id?: string | null;
  coupon_code?: string | null;
  total: number;
  payment_status?: PaymentStatus;
  payment_provider?: string | null;
  payment_reference?: string | null;
  shipping_address: ShippingAddress;
  inventory_reserved?: boolean;
  internal_notes?: string;
  created_at?: string;
}

export interface OrderUpdate {
  status?: OrderStatus;
  subtotal?: number;
  shipping_fee?: number;
  discount_amount?: number;
  coupon_id?: string | null;
  coupon_code?: string | null;
  total?: number;
  payment_status?: PaymentStatus;
  payment_provider?: string | null;
  payment_reference?: string | null;
  shipping_address?: ShippingAddress;
  inventory_reserved?: boolean;
  internal_notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  size_snapshot: string | null;
  color_snapshot: string | null;
  sku_snapshot: string | null;
  unit_price: number;
  quantity: number;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name_snapshot: string;
  size_snapshot?: string | null;
  color_snapshot?: string | null;
  sku_snapshot?: string | null;
  unit_price: number;
  quantity: number;
}

export interface OrderItemUpdate {
  product_id?: string | null;
  variant_id?: string | null;
  product_name_snapshot?: string;
  size_snapshot?: string | null;
  color_snapshot?: string | null;
  sku_snapshot?: string | null;
  unit_price?: number;
  quantity?: number;
}

export interface AdminUser {
  id: string;
  auth_user_id: string;
  role: AdminRole;
  display_name: string | null;
}

export interface AdminUserInsert {
  id?: string;
  auth_user_id: string;
  role?: AdminRole;
  display_name?: string | null;
}

export interface AdminUserUpdate {
  role?: AdminRole;
  display_name?: string | null;
}

export type StoreCurrency = "INR" | "USD";

export interface StoreSettings {
  id: number;
  store_name: string;
  currency: StoreCurrency;
  tax_rate: number;
  support_email: string | null;
  support_phone: string | null;
  notify_email_customer: boolean;
  notify_whatsapp_customer: boolean;
  notify_email_admin: boolean;
  notify_whatsapp_admin: boolean;
  notify_low_stock: boolean;
  admin_notify_email: string | null;
  admin_notify_phone: string | null;
  updated_at: string;
}

export interface StoreSettingsUpdate {
  store_name?: string;
  currency?: StoreCurrency;
  tax_rate?: number;
  support_email?: string | null;
  support_phone?: string | null;
  notify_email_customer?: boolean;
  notify_whatsapp_customer?: boolean;
  notify_email_admin?: boolean;
  notify_whatsapp_admin?: boolean;
  notify_low_stock?: boolean;
  admin_notify_email?: string | null;
  admin_notify_phone?: string | null;
}

export interface ShippingZone {
  id: string;
  name: string;
  states: string[];
  flat_rate: number;
  free_above: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingZoneInsert {
  id?: string;
  name: string;
  states?: string[];
  flat_rate?: number;
  free_above?: number | null;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface ShippingZoneUpdate {
  name?: string;
  states?: string[];
  flat_rate?: number;
  free_above?: number | null;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_auth_user_id: string | null;
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogInsert {
  id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_auth_user_id?: string | null;
  previous_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export type CouponDiscountType = "percentage" | "fixed";

export interface InventoryAdjustment {
  id: string;
  variant_id: string;
  delta: number;
  quantity_before: number;
  quantity_after: number;
  reason: string | null;
  actor_auth_user_id: string | null;
  created_at: string;
}

export interface InventoryAdjustmentInsert {
  id?: string;
  variant_id: string;
  delta: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string | null;
  actor_auth_user_id?: string | null;
  created_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number | null;
  min_order_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponInsert {
  id?: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  per_customer_limit?: number | null;
  min_order_amount?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CouponUpdate {
  code?: string;
  discount_type?: CouponDiscountType;
  discount_value?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  per_customer_limit?: number | null;
  min_order_amount?: number | null;
  is_active?: boolean;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ContactMessageStatus = "new" | "emailed" | "email_failed";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
}

export interface ContactMessageInsert {
  id?: string;
  name: string;
  email: string;
  message: string;
  status?: ContactMessageStatus;
  created_at?: string;
}

export interface ContactMessageUpdate {
  name?: string;
  email?: string;
  message?: string;
  status?: ContactMessageStatus;
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_id: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  reviewer_name: string | null;
  moderated_at: string | null;
  moderated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductReviewInsert {
  id?: string;
  product_id: string;
  customer_id?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  status?: ReviewStatus;
  reviewer_name?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductReviewUpdate {
  rating?: number;
  title?: string | null;
  body?: string;
  status?: ReviewStatus;
  reviewer_name?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
}

/** Supabase-style Database map for typed clients */
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: ProductVariantInsert;
        Update: ProductVariantUpdate;
      };
      product_images: {
        Row: ProductImage;
        Insert: ProductImageInsert;
        Update: ProductImageUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      addresses: {
        Row: Address;
        Insert: AddressInsert;
        Update: AddressUpdate;
      };
      cart_items: {
        Row: CartItemRow;
        Insert: CartItemInsert;
        Update: CartItemUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      admin_users: {
        Row: AdminUser;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: Partial<AuditLogInsert>;
      };
      inventory_adjustments: {
        Row: InventoryAdjustment;
        Insert: InventoryAdjustmentInsert;
        Update: Partial<InventoryAdjustmentInsert>;
      };
      coupons: {
        Row: Coupon;
        Insert: CouponInsert;
        Update: CouponUpdate;
      };
      product_reviews: {
        Row: ProductReview;
        Insert: ProductReviewInsert;
        Update: ProductReviewUpdate;
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: ContactMessageInsert;
        Update: ContactMessageUpdate;
      };
      store_settings: {
        Row: StoreSettings;
        Insert: Partial<StoreSettings> & { id?: number };
        Update: StoreSettingsUpdate;
      };
      shipping_zones: {
        Row: ShippingZone;
        Insert: ShippingZoneInsert;
        Update: ShippingZoneUpdate;
      };
      integration_credentials: {
        Row: import("./integrations").IntegrationCredentialRow;
        Insert: import("./integrations").IntegrationCredentialInsert;
        Update: import("./integrations").IntegrationCredentialUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_customer_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      reserve_order_inventory: {
        Args: { p_order_id: string };
        Returns: boolean;
      };
      release_order_inventory: {
        Args: { p_order_id: string };
        Returns: boolean;
      };
      adjust_variant_inventory: {
        Args: {
          p_variant_id: string;
          p_delta: number;
          p_reason?: string | null;
        };
        Returns: InventoryAdjustment;
      };
      admin_analytics_sales: {
        Args: { p_days?: number };
        Returns: unknown;
      };
      admin_analytics_inventory: {
        Args: { p_days?: number };
        Returns: unknown;
      };
      admin_analytics_customers: {
        Args: { p_months?: number };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
  };
}
