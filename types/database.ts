// Database types matching supabase/migrations/20260721133000_initial_ecommerce_schema.sql

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
  created_at: string;
}

export interface CustomerInsert {
  id?: string;
  auth_user_id: string;
  full_name?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface CustomerUpdate {
  full_name?: string | null;
  phone?: string | null;
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

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_reference: string | null;
  shipping_address: ShippingAddress;
  created_at: string;
}

export interface OrderInsert {
  id?: string;
  customer_id: string;
  status?: OrderStatus;
  subtotal: number;
  shipping_fee?: number;
  total: number;
  payment_status?: PaymentStatus;
  payment_provider?: string | null;
  payment_reference?: string | null;
  shipping_address: ShippingAddress;
  created_at?: string;
}

export interface OrderUpdate {
  status?: OrderStatus;
  subtotal?: number;
  shipping_fee?: number;
  total?: number;
  payment_status?: PaymentStatus;
  payment_provider?: string | null;
  payment_reference?: string | null;
  shipping_address?: ShippingAddress;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
}

export interface OrderItemUpdate {
  product_id?: string | null;
  product_name_snapshot?: string;
  unit_price?: number;
  quantity?: number;
}

export interface AdminUser {
  id: string;
  auth_user_id: string;
  role: AdminRole;
}

export interface AdminUserInsert {
  id?: string;
  auth_user_id: string;
  role?: AdminRole;
}

export interface AdminUserUpdate {
  role?: AdminRole;
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
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_customer_id: { Args: Record<string, never>; Returns: string | null };
    };
    Enums: Record<string, never>;
  };
}
