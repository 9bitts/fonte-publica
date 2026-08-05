import type { Metadata, Viewport } from 'next';
import { Source_Sans_3, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  display: 'swap',
});

const display = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fontepublica.org';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1215' },
    { media: '(prefers-color-scheme: light)', color: '#f4f2ee' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fonte Pública — radar de licitações e contratos do PNCP',
    template: '%s · Fonte Pública',
  },
  description:
    'Busca full-text, filtros e alertas RSS sobre contratações públicas brasileiras indexadas a partir do PNCP.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Fonte Pública',
    title: 'Fonte Pública',
    description:
      'Radar de licitações e contratos públicos brasileiros a partir do Portal Nacional de Contratações Públicas.',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Fonte Pública' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fonte Pública',
    description: 'Radar de licitações e contratos públicos brasileiros.',
    images: ['/og.svg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: 'var(--font-sans-loaded), var(--font-sans)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
