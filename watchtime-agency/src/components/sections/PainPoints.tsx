'use client';

import { Clock, TrendingDown, DollarSign, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { PAIN_POINTS } from '@/lib/constants';

const ICONS: Record<string, React.ElementType> = {
  Clock,
  TrendingDown,
  DollarSign,
  Eye,
};

const hoverOn = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(112,59,255,0.45)';
  el.style.boxShadow = '0 0 32px rgba(112,59,255,0.25)';
};
const hoverOff = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(255,255,255,0.06)';
  el.style.boxShadow = 'none';
};

function PainCard({ icon, headline, description, index, animate }: {
  icon: string;
  headline: string;
  description: string;
  index: number;
  animate: boolean;
}) {
  const Icon = ICONS[icon] || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
      animate={animate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="p-6 rounded-2xl"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLElement)}
      onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLElement)}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(112,59,255,0.1)' }}
      >
        <Icon size={20} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <h3
        className="text-base font-semibold mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
      >
        {headline}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </motion.div>
  );
}

export default function PainPoints() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 px-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      aria-labelledby="pain-heading"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
            Sound familiar?
          </p>
          <h2
            id="pain-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            You know you should be<br />
            <span style={{ color: 'var(--accent-primary)' }}>on YouTube. But...</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Every founder we talk to says the same thing. Here&apos;s what&apos;s actually stopping you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PAIN_POINTS.map((item, i) => (
            <PainCard key={item.headline} {...item} index={i} animate={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
