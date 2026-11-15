import { pageMeta } from "@/lib/seo";
import TestsClient from "./TestsClient";

export const metadata = pageMeta({
  title: "UPSC Tests & Daily Practice — Prelims, CSAT & Mains Practice | Sarit Classes",
  description:
    "Daily quizzes, sectional Prelims sets, CSAT practice and Mains answer writing — with instant solutions, weakness analytics and your own accuracy trend, inside one daily loop.",
  path: "/tests",
});

export default function TestsPage() {
  return <TestsClient />;
}
