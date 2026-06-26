import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sarit Classes — UPSC Command",
    short_name: "Sarit Classes",
    description:
      "One connected system to learn, practise and revise for UPSC — lessons, doubts, MCQs, tracking and revision in one daily loop.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#1a3a2a",
    categories: ["education"],
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
