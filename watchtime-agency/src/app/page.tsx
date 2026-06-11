import Hero from '@/components/sections/Hero';
import OurWork from '@/components/sections/OurWork';
import PainPoints from '@/components/sections/PainPoints';
import Solution from '@/components/sections/Solution';
import HowItWorks from '@/components/sections/HowItWorks';
import Comparison from '@/components/sections/Comparison';
import ClientResults from '@/components/sections/ClientResults';
import EarlyCTA from '@/components/sections/EarlyCTA';
import About from '@/components/sections/About';
import FAQ from '@/components/sections/FAQ';
import FinalCTA from '@/components/sections/FinalCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <OurWork />
      <PainPoints />
      <Solution />
      <HowItWorks />
      <Comparison />
      <ClientResults />
      <EarlyCTA />
      <About />
      <FAQ />
      <FinalCTA />
    </>
  );
}
