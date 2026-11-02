import { Parallax } from '../../components/motion/Parallax';
import { Reveal } from '../../components/motion/Reveal';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import { GAMES, GAME_NOTICES, SPORTS } from '../../data/pastimes.ts';
import type { GameFeature, GameImage } from '../../data/pastimes.ts';
import { Scene } from '../Projects/ProjectFeature';
import feature from '../Projects/ProjectFeature.module.css';
import styles from './Pastimes.module.css';

/** 05.2 — the outdoors half of after hours: a scoreboard of sports, set as type. */
export function Sport() {
  return (
    <section className={styles.sport} aria-labelledby="sport-title">
      <Reveal className={styles.head}>
        <p className="u-label">05.2 — Sport</p>
        <h3 id="sport-title" className={styles.title}>
          Game for <em>anything.</em>
        </h3>
        <p className={styles.lede}>
          Cricket, badminton, swimming — honestly, any sport. If there’s a game on, I’m game.
        </p>
      </Reveal>
      <Reveal as="ul" className={styles.board} stagger={0.08} start="top 80%">
        {SPORTS.map((sport, index) => (
          <li key={sport.name} className={sport.open ? styles.open : undefined}>
            <span className={styles.index} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Parallax className={styles.sportName} depth={0} drift={index % 2 ? 0.05 : -0.05}>
              {sport.open ? <em>{sport.name}</em> : sport.name}
            </Parallax>
            <span className={styles.note}>{sport.note}</span>
          </li>
        ))}
      </Reveal>
    </section>
  );
}

function Still({ image, pan = false }: { image: GameImage; pan?: boolean }) {
  return (
    <img
      src={image.src}
      srcSet={`${image.srcSmall} 1200w, ${image.src} 1920w`}
      sizes="100vw"
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading="lazy"
      decoding="async"
      data-pan={pan ? '' : undefined}
    />
  );
}

/** A game staged like the featured work: the frame opens on an official image and holds. */
function GameScene({ game, index }: { game: GameFeature; index: number }) {
  const [first, second] = game.images;
  const visual = second ? (
    <div className={styles.versus}>
      <Still image={first} />
      <div className={styles.wipe} data-wipe>
        <Still image={second} />
      </div>
      <span className={styles.edge} data-edge aria-hidden="true" />
    </div>
  ) : (
    <Still image={first} pan />
  );
  return (
    <Scene
      headingId={`game-${game.slug}`}
      title={game.title}
      summary={game.summary}
      label={`05.3 — ${game.kind}`}
      treatment={second ? 'versus' : 'still'}
      side={index % 2 === 0 ? 'right' : 'left'}
      length={1.8}
      heading="h4"
      tint={game.tint}
      hold={0.1}
      dataAttributes={{ 'data-game': game.slug }}
      visual={visual}
    >
      <div className={feature.detailCol} data-detail>
        <p className="u-label">The pull</p>
        <p className={feature.questLead}>{game.lead}</p>
      </div>
      <div className={feature.detailCol} data-detail>
        <p className="u-label">The game</p>
        <ul className={feature.detailList}>
          {game.facts.map(fact => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
      <div className={feature.detailCol} data-detail>
        <p className="u-label">{second ? 'Images' : 'Image'}</p>
        {game.images.map(image => (
          <p key={image.src} className={feature.visualNote}>
            {image.credit}
          </p>
        ))}
        <div className={`${feature.links} ${feature.questLinks}`}>
          {game.links.map(link => (
            <ExternalLink key={link.href} href={link.href} className="u-link">
              {link.label} <Icon name="arrow-up-right" />
            </ExternalLink>
          ))}
        </div>
      </div>
    </Scene>
  );
}

/** 05.3 — the indoors half: the games I play, ahead of the one I'm making. */
export function Games() {
  return (
    <section className={styles.games} aria-labelledby="games-title">
      <Reveal className={styles.head}>
        <p className="u-label">05.3 — Games</p>
        <h3 id="games-title" className={styles.title}>
          One more <em>run.</em>
        </h3>
        <p className={styles.lede}>
          Indoors, it’s games: the punishing ones, the fast ones, and the ones with a story.
        </p>
      </Reveal>

      <div className={styles.scenes}>
        {GAMES.map((game, index) => (
          <GameScene key={game.slug} game={game} index={index} />
        ))}
      </div>

      <div className={styles.coda}>
        <Reveal className={styles.story}>
          <p className="u-label">05.3 — Story mode</p>
          <p className={styles.storyLine}>
            And the ones with a story — <em>start to finish,</em> cutscenes and all.
          </p>
        </Reveal>
        <Reveal as="p" className={styles.continue} delay={0.1}>
          <span className="u-label">Continue?</span>
          <span>
            Playing them is half of it. The one I’m making is next <Icon name="arrow-down" />
          </span>
        </Reveal>
        <div className={styles.notices}>
          {GAME_NOTICES.map(notice => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
