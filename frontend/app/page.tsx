import { FeaturesSection } from "@/components/home/FeatureSection"
import HeroSection from "@/components/home/HeroSection"
import Navbar from "@/components/home/Navbar"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <>
    <Navbar/>
    <HeroSection/>
    <FeaturesSection/>
    </>
  )
}
