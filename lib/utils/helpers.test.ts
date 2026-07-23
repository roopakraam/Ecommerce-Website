import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/utils/safe-next-path";
import { formatPrice } from "@/lib/utils/format-price";
import { slugify } from "@/lib/utils/slugify";
import { escapeCsvCell, rowsToCsv, csvDownloadResponse } from "@/lib/utils/csv";
import { isOrderStatus, ORDER_STATUSES } from "@/lib/orders/status";
import { rupeesToPaise } from "@/lib/razorpay/client";

describe("safeNextPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/account", "/")).toBe("/account");
    expect(safeNextPath("/checkout?x=1", "/")).toBe("/checkout?x=1");
  });

  it("blocks open redirects", () => {
    expect(safeNextPath("//evil.com", "/")).toBe("/");
    expect(safeNextPath("https://evil.com", "/")).toBe("/");
    expect(safeNextPath("/\\evil.com", "/")).toBe("/");
    expect(safeNextPath(undefined, "/home")).toBe("/home");
  });
});

describe("formatPrice", () => {
  it("formats INR with two fraction digits", () => {
    expect(formatPrice(99.5)).toMatch(/99\.50/);
    expect(formatPrice(1000)).toMatch(/1,000\.00/);
  });
});

describe("slugify", () => {
  it("slugifies titles and strips junk", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("!!!")).toBe("");
  });
});

describe("csv helpers", () => {
  it("escapes quotes and builds BOM CSV", () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
    const csv = rowsToCsv(["a", "b"], [[1, 'x"y']]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\r\n");
  });

  it("sanitizes download filenames", () => {
    const res = csvDownloadResponse('evil"\r\n.csv', "a,b\r\n");
    expect(res.headers.get("Content-Disposition")).toContain("evil_.csv");
  });
});

describe("order status", () => {
  it("guards known statuses", () => {
    expect(ORDER_STATUSES).toEqual([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ]);
    expect(isOrderStatus("confirmed")).toBe(true);
    expect(isOrderStatus("refunded")).toBe(false);
  });
});

describe("rupeesToPaise", () => {
  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(1130)).toBe(113000);
    expect(rupeesToPaise(10.55)).toBe(1055);
  });
});
