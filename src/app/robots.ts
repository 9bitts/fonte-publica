import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/contratacao/', '/orgao/', '/municipio/'],
      },
      // Buscas generativas / agentes (GEO): permitir leitura do conteúdo HTML.
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/contratacao/', '/orgao/', '/municipio/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/', '/contratacao/', '/orgao/', '/municipio/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/contratacao/', '/orgao/', '/municipio/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/contratacao/', '/orgao/', '/municipio/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/contratacao/', '/orgao/', '/municipio/'],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
