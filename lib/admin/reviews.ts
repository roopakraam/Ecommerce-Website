export const ADMIN_REVIEWS_PATH = "/admin/reviews";

export const REVIEW_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type AdminReviewStatusFilter = "all" | (typeof REVIEW_STATUSES)[number];
