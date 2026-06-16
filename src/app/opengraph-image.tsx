import { ImageResponse } from "next/og";

export const alt = "Sarit Learn — UPSC Command: one connected system to learn, practise and revise for UPSC.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f7f4ee",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              height: "56px",
              width: "56px",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1a3a2a",
              borderRadius: "12px",
              color: "white",
              fontSize: "30px",
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "30px", fontWeight: 800, color: "#13251d" }}>Sarit Learn</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1d9e75", letterSpacing: "4px" }}>UPSC COMMAND</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "60px", fontWeight: 800, color: "#13251d", lineHeight: 1.1 }}>
            One connected system to learn, practise and revise for UPSC.
          </span>
          <span style={{ marginTop: "24px", fontSize: "28px", fontWeight: 600, color: "#536259" }}>
            Lessons, doubts, MCQs, tracking and revision — in one daily loop.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", fontWeight: 700 }}>
          <span style={{ color: "#8c5d14" }}>upsccommand.com</span>
          <span style={{ color: "#1d9e75" }}>Start free — no card</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
