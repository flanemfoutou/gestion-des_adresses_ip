import type { Metadata } from 'next';
import { Providers } from '@/components/apollo-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cambium | Network Control',
  description: 'Tableau de bord de gestion et de supervision des adresses IP.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
