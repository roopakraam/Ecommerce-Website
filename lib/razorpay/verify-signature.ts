import crypto from "crypto";

function timingSafeEqualHex(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}): boolean {
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(body)
    .digest("hex");

  return timingSafeEqualHex(
    expected,
    params.razorpaySignature.trim().toLowerCase()
  );
}

/** Razorpay webhook signature: HMAC-SHA256 of raw body with webhook secret. */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(params.rawBody)
    .digest("hex");

  return timingSafeEqualHex(expected, params.signature.trim().toLowerCase());
}
