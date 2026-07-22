export const ADMIN_PRODUCTS_PATH = "/admin/products";
export const ADMIN_CATEGORIES_PATH = "/admin/categories";
export const ADMIN_PRODUCTS_PAGE_SIZE = 20;
export const ADMIN_LOW_STOCK_THRESHOLD = 5;

export type AdminProductSort =
  | "created_at"
  | "name"
  | "price"
  | "stock_quantity"
  | "is_active";

export type AdminProductStatusFilter = "all" | "active" | "inactive";

export type AdminProductStockFilter = "all" | "in_stock" | "low" | "out";

export interface AdminProductListOptions {
  q?: string;
  categoryId?: string;
  status?: AdminProductStatusFilter;
  stock?: AdminProductStockFilter;
  sort?: AdminProductSort;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export const ADMIN_PRODUCT_SORTS: AdminProductSort[] = [
  "created_at",
  "name",
  "price",
  "stock_quantity",
  "is_active",
];
