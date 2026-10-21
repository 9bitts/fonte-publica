import type { MetadataRoute } from 'next';
import { UFS } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site';

export async function generateSitemaps() {
  return [{ id: 0 }];
}

/**
 * Só páginas-hub. Cada contratação no sitemap faz o crawler acordar
 * o servidor o dia inteiro; a busca continua achando o registro.
 */
export default async function sitemap(props: {
  id: Promise<number> | number;
}): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const id = typeof props.id === 'object' ? await props.id : props.id;
  if (id !== 0) return [];

  const entries: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: 'daily', priority: 1 },
    { url: `${site}/busca`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site}/alertas`, changeFrequency: 'weekly', priority: 0.5 },
  ];
  for (const sigla of Object.keys(UFS)) {
    entries.push({
      url: `${site}/uf/${sigla}`,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }
  return entries;
}
