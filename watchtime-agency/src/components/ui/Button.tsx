'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline';
  href?: string;
  onClick?: () => void;
  className?: string;
  target?: string;
  rel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  className = '',
  target,
  rel,
  size = 'md',
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-9 py-4 text-lg',
  };

  const baseStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          backgroundColor: 'var(--accent-primary)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 0 30px rgba(112, 59, 255, 0.4)',
        }
      : {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        };

  const classes = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer ${sizeClasses[size]} ${className}`;

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (variant === 'primary') {
      (e.currentTarget as HTMLElement).style.boxShadow =
        '0 0 40px rgba(112, 59, 255, 0.6), 0 0 80px rgba(112, 59, 255, 0.3)';
    } else {
      (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)';
      (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (variant === 'primary') {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(112, 59, 255, 0.4)';
    } else {
      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
    }
  };

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        style={baseStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={classes}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
