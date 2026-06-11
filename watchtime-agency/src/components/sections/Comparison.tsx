'use client';

import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { COMPARISON_ROWS } from '@/lib/constants';

export default function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 px-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
      aria-labelledby="comparison-heading"
    >
      <div className="max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
            The difference
          </p>
          <h2
            id="comparison-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Without vs.<br />
            <span style={{ color: 'var(--accent-primary)' }}>With WatchTime Agency.</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            The gap between where you are and where you want to be is one decision.
          </p>
        </motion.div>

        {/* Table header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-4"
        >
          <div
            className="text-center text-sm font-semibold py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171' }}
          >
            Without WatchTime Agency
          </div>
          <div
            className="text-center text-sm font-semibold py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(112,59,255,0.08)', color: 'var(--accent-primary)' }}
          >
            With WatchTime Agency
          </div>
        </motion.div>

        {/* Rows */}
        <div className="flex flex-col gap-3">
          {COMPARISON_ROWS.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.07 }}
              className="grid grid-cols-2 gap-4"
            >
              <div
                className="flex items-start gap-3 p-4 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  color: '#fca5a5',
                }}
              >
                <X size={15} className="shrink-0 mt-0.5 opacity-70" />
                <span>{row.without}</span>
              </div>
              <div
                className="flex items-start gap-3 p-4 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(112,59,255,0.05)',
                  border: '1px solid rgba(112,59,255,0.15)',
                  color: 'var(--text-primary)',
                }}
              >
                <Check size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                <span>{row.with}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
