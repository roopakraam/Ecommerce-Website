const MESSAGES = [
  "Book My Tees",
  "Free Shipping Over ₹1499",
  "Pan-India Delivery",
  "Premium 240 GSM Cotton",
];

// One repeated block must stay wider than any real viewport, otherwise the
// track runs out of content before the loop resets and a blank gap flashes
// at the seam. 8x comfortably covers ultra-wide monitors; duration scales
// with it so the per-message scroll speed stays constant.
const REPEAT = 8;
const REPEATED_SET = Array.from({ length: REPEAT }, () => MESSAGES).flat();

export function PromoTicker() {
  const items = [...REPEATED_SET, ...REPEATED_SET];

  return (
    <div
      className="overflow-hidden whitespace-nowrap bg-neon py-3.5"
      aria-hidden="true"
    >
      <div
        className="inline-flex animate-marquee will-change-transform motion-reduce:animate-none"
        style={{ animationDuration: `${24 * REPEAT}s` }}
      >
        {items.map((message, index) => (
          <span
            key={index}
            className="inline-block px-6 text-base font-bold uppercase tracking-wide text-ink"
          >
            <i className="mr-6 not-italic text-ink">✦</i>
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
