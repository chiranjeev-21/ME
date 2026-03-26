import type { CSSProperties } from 'react';
import { usePinnedQuests } from '@/hooks/usePinnedQuests';
import type { HiddenQuestProject } from '@/types';
import styles from './SideQuests.module.css';

interface SideQuestsProps {
  onBack?: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getDaysSince(updatedAt: string): number | null {
  const updatedDate = new Date(updatedAt);

  if (Number.isNaN(updatedDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatUpdatedLabel(updatedAt: string): string {
  const updatedDate = new Date(updatedAt);

  if (Number.isNaN(updatedDate.getTime())) {
    return 'Updated recently';
  }

  const daysAgo = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAgo < 1) return 'Updated today';
  if (daysAgo < 30) return `Updated ${daysAgo}d ago`;

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) return `Updated ${monthsAgo}mo ago`;

  return `Updated ${updatedDate.getFullYear()}`;
}

function formatFreshnessValue(updatedAt: string | null): string {
  if (!updatedAt) return '--';

  return formatUpdatedLabel(updatedAt).replace(/^Updated /, '');
}

function getVaultTraces(items: HiddenQuestProject[]): string[] {
  const languageTraces = Array.from(
    new Set(
      items
        .map(item => item.primaryLanguage?.name)
        .filter((value): value is string => Boolean(value))
    )
  );
  const topicTraces = Array.from(new Set(items.flatMap(item => item.topics)));

  return Array.from(new Set([...languageTraces, ...topicTraces])).slice(0, 3);
}

function QuestMeta({ item }: { item: HiddenQuestProject }) {
  return (
    <div className={styles.metaRow}>
      {item.primaryLanguage && (
        <span className={styles.metaPill}>
          <span
            className={styles.languageDot}
            style={{ backgroundColor: item.primaryLanguage.color ?? '#7dd3fc' }}
            aria-hidden="true"
          />
          {item.primaryLanguage.name}
        </span>
      )}
      {item.stargazerCount > 0 && (
        <span
          className={styles.metaPill}
        >{`${formatCompactNumber(item.stargazerCount)} stars`}</span>
      )}
      {item.forkCount > 0 && (
        <span className={styles.metaPill}>{`${formatCompactNumber(item.forkCount)} forks`}</span>
      )}
      <span className={styles.metaPill}>{formatUpdatedLabel(item.updatedAt)}</span>
      {item.homepageUrl && <span className={styles.metaPill}>Demo available</span>}
    </div>
  );
}

export function SideQuests({ onBack }: SideQuestsProps) {
  const { data, isLoading, notice } = usePinnedQuests();
  const [featuredQuest, ...otherQuests] = data.items;
  const totalEngagement = data.items.reduce(
    (sum, item) => sum + item.stargazerCount + item.forkCount,
    0
  );
  const totalLanguageTracks = new Set(
    data.items
      .map(item => item.primaryLanguage?.name)
      .filter((value): value is string => Boolean(value))
  ).size;
  const latestUpdatedAt =
    data.items.reduce<string | null>((latest, item) => {
      if (!latest) return item.updatedAt;
      return new Date(item.updatedAt).getTime() > new Date(latest).getTime()
        ? item.updatedAt
        : latest;
    }, null) ??
    featuredQuest?.updatedAt ??
    null;
  const freshnessDays = latestUpdatedAt ? getDaysSince(latestUpdatedAt) : null;
  const traceValues = getVaultTraces(data.items);

  const artifactPercent = isLoading
    ? 26
    : clamp(data.items.length * 22 + traceValues.length * 8, 24, 100);
  const resonancePercent = isLoading
    ? 22
    : clamp(
        data.items.length * 18 + traceValues.length * 12 + Math.min(totalEngagement * 8, 34),
        data.source === 'github' ? 48 : 34,
        100
      );
  const freshnessPercent = isLoading
    ? 20
    : freshnessDays === null
      ? 22
      : clamp(100 - freshnessDays * 4, 18, 100);
  const vaultSignalPercent = isLoading
    ? 24
    : clamp(
        Math.round((artifactPercent + resonancePercent + freshnessPercent) / 3),
        data.source === 'github' ? 62 : 40,
        100
      );

  const vaultMeterStyle: CSSProperties & Record<'--vault-signal', string> = {
    '--vault-signal': `${vaultSignalPercent}%`,
  };

  const vaultStats = [
    {
      label: 'Artifacts',
      value: isLoading ? '--' : String(data.items.length),
      detail: data.items.length === 1 ? 'quest active' : 'quests active',
      percent: artifactPercent,
    },
    {
      label: 'Signals',
      value: isLoading ? '--' : String(Math.max(totalLanguageTracks, traceValues.length, 1)),
      detail:
        totalEngagement > 0
          ? `${formatCompactNumber(totalEngagement)} interactions`
          : 'signal trails',
      percent: resonancePercent,
    },
    {
      label: 'Freshness',
      value: isLoading ? '--' : formatFreshnessValue(latestUpdatedAt),
      detail: 'latest trace',
      percent: freshnessPercent,
    },
  ];

  const vaultHeading = isLoading
    ? 'Scanning the vault...'
    : `${data.items.length} hidden artifact${data.items.length === 1 ? '' : 's'} detected`;

  const vaultSummary = isLoading
    ? 'Looking for hidden artifacts tucked behind the treasure chest.'
    : data.source === 'github'
      ? 'Live sync on.'
      : (notice ?? 'The vault is showing its local fallback artifact right now.');

  const topStatus = isLoading
    ? 'Scanning vault'
    : data.source === 'github'
      ? 'Vault active'
      : 'Vault fallback';

  return (
    <section id="side-quests" className={styles.section} aria-label="Hidden vault">
      <div className={styles.cloudLayer} aria-hidden="true">
        <div className={`${styles.cloud} ${styles.cloud1}`} />
        <div className={`${styles.cloud} ${styles.cloud2}`} />
        <div className={`${styles.cloud} ${styles.cloud3}`} />
        <div className={`${styles.cloud} ${styles.cloud4}`} />
      </div>

      <div className={styles.sparkLayer} aria-hidden="true">
        <span className={`${styles.spark} ${styles.spark1}`} />
        <span className={`${styles.spark} ${styles.spark2}`} />
        <span className={`${styles.spark} ${styles.spark3}`} />
        <span className={`${styles.spark} ${styles.spark4}`} />
        <span className={`${styles.spark} ${styles.spark5}`} />
      </div>

      <div className={styles.inner}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <span className={styles.backIcon} aria-hidden="true">
              ←
            </span>
            Return to Portfolio
          </button>
          <div className={styles.topStatus}>{topStatus}</div>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.copyCol}>
            <div className={styles.badge}>Hidden Vault</div>
            <h1 className={styles.heading}>
              Secret experiments,
              <br />
              <span className={styles.accent}>off the main path.</span>
            </h1>
            <p className={styles.description}>
              You&apos;ve uncovered a tucked-away room of playful experiments, research-heavy
              builds, and unexpected ideas. Opened through the treasure chest in the hero, this
              vault now syncs with my open source journey.
            </p>
            <div className={styles.sourceRow}>
              <a
                className={styles.profileLink}
                href={data.profile.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {`Explore @${data.profile.login} ↗`}
              </a>
            </div>
            {notice && <p className={styles.notice}>{notice}</p>}
          </div>

          <aside className={styles.vaultPanel}>
            <p className={styles.vaultPanelLabel}>Vault signal</p>
            <div className={styles.vaultMeter} style={vaultMeterStyle}>
              <span className={styles.vaultMeterRing} />
              <span className={styles.vaultMeterGlow} />
              <span className={styles.vaultMeterCore}>
                <span className={styles.vaultMeterValue}>{`${vaultSignalPercent}%`}</span>
                <span className={styles.vaultMeterCaption}>signal</span>
              </span>
            </div>
            <p className={styles.vaultPanelValue}>{vaultHeading}</p>
            <p className={styles.vaultPanelText}>{vaultSummary}</p>
            <div className={styles.vaultStats}>
              {vaultStats.map(stat => (
                <div key={stat.label} className={styles.vaultStat}>
                  <div className={styles.vaultStatTop}>
                    <span className={styles.vaultStatLabel}>{stat.label}</span>
                    <span className={styles.vaultStatValue}>{stat.value}</span>
                  </div>
                  <div className={styles.vaultStatBar} aria-hidden="true">
                    <span style={{ width: `${stat.percent}%` }} />
                  </div>
                  <span className={styles.vaultStatDetail}>{stat.detail}</span>
                </div>
              ))}
            </div>
            {traceValues.length > 0 && (
              <div className={styles.vaultTraceRow}>
                {traceValues.map(trace => (
                  <span key={trace} className={styles.vaultTraceChip}>
                    {trace}
                  </span>
                ))}
              </div>
            )}
          </aside>
        </div>

        {featuredQuest && (
          <div className={styles.questSection}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionEyebrow}>Featured quest</p>
                <h2 className={styles.sectionTitle}>{featuredQuest.name}</h2>
              </div>
            </div>

            <a
              className={styles.featureCard}
              href={featuredQuest.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.featureGlow} />
              <div className={styles.featureTop}>
                <span className={styles.featureBadge}>Unlocked Artifact</span>
                <span className={styles.featureArrow} aria-hidden="true">
                  ↗
                </span>
              </div>

              <div className={styles.featureBody}>
                <p className={styles.featureLabel}>
                  {data.source === 'github' ? 'Featured artifact' : 'Vault artifact'}
                </p>
                <h3 className={styles.featureTitle}>{featuredQuest.name}</h3>
                <p className={styles.featureDescription}>{featuredQuest.description}</p>
              </div>

              <QuestMeta item={featuredQuest} />
            </a>
          </div>
        )}

        {otherQuests.length > 0 && (
          <div className={styles.questSection}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionEyebrow}>More hidden quests</p>
                <h2 className={styles.sectionTitle}>More hidden discoveries</h2>
              </div>
            </div>

            <div className={styles.questGrid}>
              {otherQuests.map(quest => (
                <a
                  key={quest.id}
                  className={styles.questCard}
                  href={quest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={styles.questCardTop}>
                    <span className={styles.questCardLabel}>Hidden quest</span>
                    <span className={styles.questCardArrow} aria-hidden="true">
                      ↗
                    </span>
                  </div>

                  <h3 className={styles.questName}>{quest.name}</h3>
                  <p className={styles.questDescription}>{quest.description}</p>

                  <QuestMeta item={quest} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
