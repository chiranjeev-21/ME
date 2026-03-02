import { cn } from '@/utils/cn';
import styles from './SkillPill.module.css';

interface SkillPillProps {
  label: string;
  hot?: boolean;
}

export function SkillPill({ label, hot = false }: SkillPillProps) {
  return <span className={cn(styles.pill, hot && styles.hot)}>{label}</span>;
}
