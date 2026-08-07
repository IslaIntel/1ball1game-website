import type { Metadata } from "next";
import { RegistrationForm } from "@/components/register/RegistrationForm";

export const metadata: Metadata = {
  title: "Fall 2026 Soccer Registration | 1 Ball 1 Game Foundation",
  description:
    "Register your K–2 player for the Fall 2026 school PTA soccer season. 75% of every fee goes back to participating school PTAs.",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-16 pt-10 sm:pt-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-sky/30 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-magenta/15 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RegistrationForm />
      </div>
    </main>
  );
}
