import { Parallax } from '../../components/motion/Parallax';
import { Reveal } from '../../components/motion/Reveal';
import { Icon } from '../../components/ui/Icon';
import styles from './Pastimes.module.css';

const SPORTS = [
  { name: 'Cricket', note: 'Bat, ball, and a whole afternoon.' },
  { name: 'Badminton', note: 'Quick hands, quicker shuttles.' },
  { name: 'Swimming', note: 'Lanes, laps, and a quiet head.' },
  { name: 'Anything else', note: 'If there’s a score, count me in.', open: true },
];

const GAMES = [
  { kind: 'Souls-likes', names: ['Elden Ring'], note: 'Where “You died” is just feedback.' },
  {
    kind: 'Tactical FPS',
    names: ['Counter-Strike', 'Valorant'],
    note: 'One more round. Always one more round.',
  },
  { kind: 'Story mode', names: ['Campaigns'], note: 'Start to finish, cutscenes and all.' },
];

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
      <Reveal as="ul" className={styles.shelf} stagger={0.1} start="top 82%">
        {GAMES.map(game => (
          <li key={game.kind}>
            <p className="u-label">{game.kind}</p>
            <p className={styles.gameNames}>
              {game.names.map((name, index) => (
                <span key={name}>
                  {index > 0 && <i className={styles.amp}>&amp; </i>}
                  {name}
                </span>
              ))}
            </p>
            <p className={styles.note}>{game.note}</p>
          </li>
        ))}
      </Reveal>
      <Reveal as="p" className={styles.continue}>
        <span className="u-label">Continue?</span>
        <span>
          Playing them is half of it. The one I’m making is next <Icon name="arrow-down" />
        </span>
      </Reveal>
    </section>
  );
}
