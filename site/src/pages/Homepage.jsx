import Hero from '../components/Hero';
import Pilares from '../components/Pilares';
import PlanosPreview from '../components/PlanosPreview';
import MaratonaCountdown from '../components/MaratonaCountdown';
import SobreResumo from '../components/SobreResumo';
import CtaFinal from '../components/CtaFinal';

export default function Homepage() {
  return (
    <>
      <Hero />
      <Pilares />
      <MaratonaCountdown />
      <PlanosPreview />
      <SobreResumo />
      <CtaFinal />
    </>
  );
}
