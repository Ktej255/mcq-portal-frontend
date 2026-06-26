import { SaritHome } from "@/components/marketing/SaritHome";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Sarit Classes — AI-Driven UPSC Preparation Platform",
  description:
    "Stop juggling tabs, PDFs and apps. Sarit Classes keeps your UPSC lessons, doubts, maps, MCQs, tracking and revision in one personalized daily loop — honestly.",
  path: "/",
});

export default function Home() {
  return <SaritHome />;
}
