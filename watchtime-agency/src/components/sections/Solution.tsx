'use client';

import { Map, FileText, Video, Image, Search, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { SERVICES } from '@/lib/constants';

const ICONS: Record<string, React.ElementType> = {
  Map,
  FileText,
  Video,
  Image,
  Search,
  BarChart2,
};

const hoverOn = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(112,59,255,0.45)';
  el.style.boxShadow = '0 0 32px rgba(112,59,255,0.25)';
};
const hoverOff = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(255,255,255,0.06)';
  el.style.boxShadow = 'none';
};

export default function Solution() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 px-6"
      style={{ backgroundColor: 'var(--bg-accent-subtle)' }}
      aria-labelledby="solution-heading"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
            What we do
          </p>
          <h2
            id="solution-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Everything you need.{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Nothing you don&apos;t.</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            We handle your entire YouTube presence end-to-end so you can focus on what you do best — running your business.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((service, i) => {
            const Icon = ICONS[service.icon] || Map;
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
                animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
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
                  className="text-base font-semibold mb-1.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
                >
                  {service.name}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center mt-12"
        >
          <a
            href="#how-it-works"
            className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            See How It Works →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
