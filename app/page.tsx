import BackgroundFX from "@/components/ui/BackgroundFX";
import FloatingAgent from "@/components/ui/FloatingAgent";
import HudBottom from "@/components/ui/HudBottom";
import HudTop from "@/components/ui/HudTop";
import Architecture from "@/components/home/Architecture";
import Cta from "@/components/home/Cta";
import Dashboard from "@/components/home/Dashboard";
import Hero from "@/components/home/Hero";
import Mission from "@/components/home/Mission";
import Process from "@/components/home/Process";
import Trust from "@/components/home/Trust";

export default function Home() {
  return (
    <>
      <BackgroundFX />
      <HudTop />
      <main>
        <Hero />
        <Mission />
        <Process />
        <Architecture />
        <Trust />
        <Dashboard />
        <Cta />
      </main>
      <FloatingAgent />
      <HudBottom />
    </>
  );
}
