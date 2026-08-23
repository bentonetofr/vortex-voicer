import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { SiteFooter } from './components/site-footer';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vortex Voice — Dublagem multiplayer',
  description: 'Crie uma sala, convide seus amigos e disputem cinco rodadas de dublagem.',
  openGraph: {
    title: 'Vortex Voice — Dublagem multiplayer',
    description: 'A mesma cena para todo mundo. Oito vozes e cinco rodadas para jogar com os amigos.',
    images: [{ url: '/vortex-voice-logo.png', width: 512, height: 512, alt: 'Símbolo do Vortex Voice' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Vortex Voice — Dublagem multiplayer',
    description: 'A mesma cena para todo mundo. Oito vozes e cinco rodadas para jogar com os amigos.',
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
