import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BOOK MY TEES — premium T-shirt apparel";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#a3e635",
          }}
        >
          BOOK MY TEES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#fafafa",
              maxWidth: 900,
            }}
          >
            Tees that speak louder than words
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#a3a3a3",
              maxWidth: 820,
            }}
          >
            Premium cotton graphic tees and everyday essentials — ships across India.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
