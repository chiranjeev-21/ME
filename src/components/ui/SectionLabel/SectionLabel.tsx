import type { HTMLAttributes, ReactNode } from 'react';
import styles from './SectionLabel.module.css';

interface SectionLabelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function SectionLabel({ children, ...rest }: SectionLabelProps) {
  return (
    <div className={styles.label} {...rest}>
      {children}
    </div>
  );
}
