import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'cta' | 'social';

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <a className={cn(styles.btn, styles[variant], className)} {...rest}>
      {children}
    </a>
  );
}
