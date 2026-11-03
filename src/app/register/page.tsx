import type { Metadata } from "next";
import { RegistrationFlow } from "@/components/register/RegistrationFlow";
import { RegistrationClosed } from "@/components/register/RegistrationClosed";
import { REGISTRATION_OPEN, REGISTRATION_SEASON } from "@/lib/registration-status";

const openDescription =
  "Choose Winter Indoor Streetball for paid registration, or Spring PTA Rec Soccer to share player information with no payment.";

export const metadata: Metadata = REGISTRATION_OPEN
  ? {
      title: "Winter 2026 & Spring 2027 Soccer Registration | 1 Ball 1 Game Foundation",
      description: openDescription,
      openGraph: { description: openDescription },
      twitter: { description: openDescription },
    }
  : {
      title: `Registration Closed | 1 Ball 1 Game Foundation`,
      description: `${REGISTRATION_SEASON} soccer registration is now closed. Email registration@1ball1game.org to hear first when the next season opens.`,
      robots: { index: false, follow: true },
    };

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-16 pt-10 sm:pt-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-sky/30 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-magenta/15 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {REGISTRATION_OPEN ? <RegistrationFlow /> : <RegistrationClosed />}
      </div>
    </main>
  );
}
