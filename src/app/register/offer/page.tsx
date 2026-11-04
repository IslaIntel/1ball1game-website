import type { Metadata } from "next";
import { OfferCheckout } from "@/components/register/OfferCheckout";

export const metadata: Metadata = {
  title: "Accept your Winter Streetball place | 1 Ball 1 Game Foundation",
  robots: { index: false, follow: false },
};

export default async function OfferPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return (
    <main className="relative min-h-screen overflow-hidden pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <OfferCheckout token={token} />
      </div>
    </main>
  );
}
