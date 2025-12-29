import { Helmet } from 'react-helmet-async';
import GameCanvas from '@/components/game/GameCanvas';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Orbit! - A Game About Connection</title>
        <meta name="description" content="Orbit! is a cosmic cooperative game where two celestial entities must stay connected through gravity to collect energy fragments and evolve their bond." />
      </Helmet>
      <main className="w-full h-screen">
        <GameCanvas />
      </main>
    </>
  );
};

export default Index;
