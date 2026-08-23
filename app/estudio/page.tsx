import type { Metadata } from 'next';
import { RecordingStudio } from '../components/recording-studio';
import { SiteHeader } from '../components/site-header';
import { getScene } from '../../lib/scenes';

export const dynamic = 'force-dynamic';

type StudioPageProps = { searchParams: Promise<{ scene?: string }> };

export async function generateMetadata({ searchParams }: StudioPageProps): Promise<Metadata> {
  const selectedScene = getScene((await searchParams).scene);
  return {
    title: `Estúdio — ${selectedScene.title} | Vortex Voice`,
    description: 'Grave suas falas, refaça tomadas e revise a dublagem completa no estúdio Vortex Voice.',
    robots: { index: false, follow: false },
  };
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const selectedScene = getScene((await searchParams).scene);
  return (
    <main className="studio-page" id="main-content">
      <SiteHeader />
      <div className="studio-shell">
        <div className="studio-breadcrumb">
          <a href={`/desafio?scene=${selectedScene.slug}`}>← Voltar à cena</a>
          <span>{selectedScene.title}</span>
        </div>
        <RecordingStudio challenge={selectedScene} />
      </div>
    </main>
  );
}
