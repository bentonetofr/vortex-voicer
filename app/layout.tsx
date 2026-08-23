import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { SiteFooter } from './components/site-footer';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vortex Voice — Escolha uma cena e solte a voz',
  description: 'Explore um pack completo de cenas e duble direto no navegador, sem login.',
  openGraph: {
    title: 'Vortex Voice — Sua voz, uma nova cena',
    description: 'Um pack completo de cenas para você interpretar e gravar sem login.',
    images: [{ url: '/vortex-voice-logo.png', width: 512, height: 512, alt: 'Símbolo do Vortex Voice' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Vortex Voice — Sua voz, uma nova cena',
    description: 'Um pack completo de cenas para você interpretar e gravar sem login.',
    images: ['/vortex-voice-logo.png'],
  },
  icons: {
    icon: '/vortex-voice-logo.png',
    apple: '/vortex-voice-logo.png',
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0e0c14',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} antialiased`}>
        <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
