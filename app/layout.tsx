import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vortex Voice — Sua voz, uma nova cena',
  description: 'Entre no desafio diário de dublagem, dê sua voz a uma nova cena e compartilhe sua interpretação.',
  icons: {
    icon: '/vortex-voice-logo.png',
    apple: '/vortex-voice-logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geist.variable} antialiased`}>{children}</body></html>;
}
