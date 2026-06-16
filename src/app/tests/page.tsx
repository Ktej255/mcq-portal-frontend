import { pageMeta } from "@/lib/seo";
import TestsClient from "./TestsClient";

export const metadata = pageMeta({
  title: "UPSC Tests & Daily Practice — Prelims, CSAT & Mains Mock Tests | Sarit Learn",
  description:
    "Daily quizzes, full-length Prelims mocks, CSAT practice and Mains answer writing — with instant solutions, weakness analytics and all-India percentile, inside one daily loop.",
  path: "/tests",
});

export default function TestsPage() {
  return <TestsClient />;
}
