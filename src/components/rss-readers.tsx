import type { ReactNode } from 'react';

export type RssReader = {
  id: string;
  name: string;
  blurb: string;
  platforms: string;
  href: string;
  logo: string;
};

export const RSS_READERS: RssReader[] = [
  {
    id: 'feedly',
    name: 'Feedly',
    blurb: 'O mais popular na web, Android e iPhone.',
    platforms: 'Web · Android · iPhone',
    href: 'https://feedly.com/',
    logo: '/readers/feedly.svg',
  },
  {
    id: 'inoreader',
    name: 'Inoreader',
    blurb: 'Bom para muitos feeds e filtros avançados.',
    platforms: 'Web · Android · iPhone',
    href: 'https://www.inoreader.com/',
    logo: '/readers/inoreader.svg',
  },
  {
    id: 'netnewswire',
    name: 'NetNewsWire',
    blurb: 'Grátis e open source para Mac e iPhone.',
    platforms: 'Mac · iPhone · iPad',
    href: 'https://netnewswire.com/',
    logo: '/readers/netnewswire.svg',
  },
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    blurb: 'Leitor de e-mail e RSS no computador, da Mozilla.',
    platforms: 'Windows · Mac · Linux',
    href: 'https://www.thunderbird.net/pt-BR/download/',
    logo: '/readers/thunderbird.svg',
  },
  {
    id: 'newsblur',
    name: 'NewsBlur',
    blurb: 'Open source, com foco em leitura limpa.',
    platforms: 'Web · Android · iPhone',
    href: 'https://newsblur.com/',
    logo: '/readers/newsblur.svg',
  },
];

export function RssReadersGrid({ footer }: { footer?: ReactNode }) {
  return (
    <div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RSS_READERS.map((reader) => (
          <li key={reader.id}>
            <a
              href={reader.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[4.5rem] items-center gap-3 border border-border bg-bg-elevated px-3 py-3 text-text no-underline transition-colors hover:border-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reader.logo}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-md"
              />
              <span className="min-w-0">
                <span className="block font-medium text-text">{reader.name}</span>
                <span className="mt-0.5 block text-xs text-text-muted">{reader.blurb}</span>
                <span className="mt-1 block font-mono text-[11px] text-text-muted">
                  {reader.platforms}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
