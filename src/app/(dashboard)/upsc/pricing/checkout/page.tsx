import { UpscPricingCheckoutIntent } from "@/components/upsc/UpscPricingCheckoutIntent";

type UpscPricingCheckoutPageProps = {
  searchParams?: Promise<{
    plan?: string;
  }>;
};

export default async function UpscPricingCheckoutPage({ searchParams }: UpscPricingCheckoutPageProps) {
  const params = await searchParams;
  return <UpscPricingCheckoutIntent planId={params?.plan} />;
}
