import { SaritHome } from "@/components/marketing/SaritHome";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Sarit Learn — One Connected UPSC Preparation System",
  description:
    "Stop juggling tabs, PDFs and apps. Sarit Learn keeps your UPSC lessons, doubts, maps, MCQs, tracking and revision in one personalized daily loop — honestly.",
  path: "/",
});

export default function Home() {
  return <SaritHome />;
}
