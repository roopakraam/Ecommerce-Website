import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/checkout/**",
        "lib/orders/**",
        "lib/razorpay/**",
        "lib/payments/**",
        "lib/utils/**",
        "lib/validations/**",
        "lib/integrations/crypto.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
