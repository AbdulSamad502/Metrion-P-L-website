import { ImageResponse } from "next/og";

export const alt = "Metrion free ecommerce profit and loss calculator for Amazon, Flipkart and Meesho sellers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          color: "#ffffff",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, letterSpacing: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 14, background: "#9bde43" }} />
          METRION
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Know your real profit on every order
          </div>
          <div style={{ fontSize: 34, color: "#9bde43" }}>Free P&amp;L calculator for Amazon, Flipkart &amp; Meesho sellers</div>
        </div>
        <div style={{ fontSize: 26, color: "#b8c2b4" }}>GST &middot; RTO &middot; returns &middot; break-even &middot; no signup</div>
      </div>
    ),
    size,
  );
}
