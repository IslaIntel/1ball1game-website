import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { About } from "@/components/sections/About";
import { Impact } from "@/components/sections/Impact";
import { WhyMatters } from "@/components/sections/WhyMatters";
import { Program } from "@/components/sections/Program";
import { WhyPartner } from "@/components/sections/WhyPartner";
import { Sponsorship } from "@/components/sections/Sponsorship";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Impact />
      <WhyMatters />
      <Program />
      <WhyPartner />
      <Sponsorship />
      <Contact />
      <Footer />
    </main>
  );
}
