/** After hours: sport and games. Personal interests only — no stats, ranks or hours. */

export interface Sport {
  name: string;
  note: string;
  /** The open-ended last row. */
  open?: boolean;
}

export const SPORTS: Sport[] = [
  { name: 'Cricket', note: 'Bat, ball, and a whole afternoon.' },
  { name: 'Badminton', note: 'Quick hands, quicker shuttles.' },
  { name: 'Swimming', note: 'Lanes, laps, and a quiet head.' },
  { name: 'Anything else', note: 'If there’s a score, count me in.', open: true },
];

export interface GameImage {
  src: string;
  srcSmall: string;
  width: number;
  height: number;
  alt: string;
  /** Where the image comes from and who owns it. */
  credit: string;
}

export interface GameFeature {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  lead: string;
  /** Plain public facts: genre, developer, year. */
  facts: string[];
  links: { label: string; href: string }[];
  tint: string;
  /** One photograph holds; two play as consecutive rounds. */
  images: [GameImage] | [GameImage, GameImage];
}

const image = (name: string, alt: string, credit: string): GameImage => ({
  src: `/images/games/${name}-1920.webp`,
  srcSmall: `/images/games/${name}-1200.webp`,
  width: 1920,
  height: 1080,
  alt,
  credit,
});

export const GAMES: GameFeature[] = [
  {
    slug: 'elden-ring',
    kind: 'Souls-like',
    title: 'Elden Ring',
    summary: 'Where “You died” is just feedback.',
    lead: 'Patience, pattern-reading, and the quiet satisfaction of finally getting it right.',
    facts: ['Action RPG · Souls-like', 'FromSoftware · 2022'],
    links: [
      { label: 'Steam page', href: 'https://store.steampowered.com/app/1245620/ELDEN_RING/' },
    ],
    tint: '#e2c27a',
    images: [
      image(
        'elden-ring',
        'Elden Ring: a rider on horseback looks out over ruined lands beneath the glowing golden Erdtree.',
        'Official screenshot from the Steam store page. © Bandai Namco Entertainment Inc. / © FromSoftware, Inc.'
      ),
    ],
  },
  {
    slug: 'tactical-fps',
    kind: 'Tactical FPS',
    title: 'Counter-Strike & Valorant',
    summary: 'One more round. Always one more round.',
    lead: 'Five on five, one life a round: crosshair placement, utility, and comms.',
    facts: [
      'Tactical FPS · 5v5',
      'Counter-Strike 2 · Valve · 2023',
      'Valorant · Riot Games · 2020',
    ],
    links: [
      { label: 'Counter-Strike 2', href: 'https://www.counter-strike.net/' },
      { label: 'Valorant', href: 'https://playvalorant.com/' },
    ],
    tint: '#e0a77a',
    images: [
      image(
        'counter-strike',
        'Counter-Strike 2: hard sunlight casts lattice shadows across a stone passage as a player moves through it.',
        'Counter-Strike 2: official screenshot from the Steam store page. © Valve Corporation.'
      ),
      image(
        'valorant-ascent',
        'Valorant: the Ascent map, a floating Venetian-style city around a brick bell tower.',
        'Valorant: Ascent wallpaper from Riot’s official media page, cropped. © Riot Games, Inc.'
      ),
    ],
  },
];

/** Shown wherever the game imagery appears; Riot asks for this notice verbatim. */
export const GAME_NOTICES = [
  'Game images belong to their publishers and are shown here under their fan-content terms. This site isn’t affiliated with or endorsed by Bandai Namco, FromSoftware, Valve or Riot Games.',
  'Chiranjeev Singh’s portfolio was created under Riot Games’ “Legal Jibber Jabber” policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.',
];
