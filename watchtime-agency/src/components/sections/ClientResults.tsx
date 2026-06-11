'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

const STATS = [
  { value: 10.7,  prefix: '',  suffix: 'M',  label: 'Views Generated',      decimal: 1 },
  { value: 25.4,  prefix: '+', suffix: 'K',  label: 'New Subscribers',       decimal: 1 },
  { value: 554.5, prefix: '',  suffix: 'K',  label: 'Watch Time Hours',      decimal: 1 },
  { value: 9090,  prefix: '$', suffix: '',   label: 'YouTube Revenue',       decimal: 0, comma: true },
];

function StatBlock({
  value, prefix, suffix, label, decimal, comma, animate,
}: {
  value: number; prefix: string; suffix: string; label: string;
  decimal: number; comma?: boolean; animate: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!animate || done.current) return;
    done.current = true;
    const duration = 1800;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = value * eased;
      setCurrent(decimal ? Math.round(v * 10) / 10 : Math.floor(v));
      if (p < 1) requestAnimationFrame(tick);
      else setCurrent(value);
    };
    requestAnimationFrame(tick);
  }, [animate, value, decimal]);

  const display = comma
    ? Math.floor(current).toLocaleString()
    : decimal
      ? current.toFixed(decimal)
      : current;

  return (
    <div className="flex flex-col gap-1">
      <span
        ref={ref}
        className="text-3xl md:text-4xl font-bold tabular-nums"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#703bff' }}
      >
        {prefix}{display}{suffix}
      </span>
      <span className="text-xs uppercase tracking-widest" style={{ color: '#888888' }}>
        {label}
      </span>
    </div>
  );
}

export default function ClientResults() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      aria-labelledby="client-results-heading"
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(112,59,255,0.06) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, ease }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
            Client Results
          </p>
          <h2
            id="client-results-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            One client.<br />
            <span style={{ color: 'var(--accent-primary)' }}>Real numbers.</span>
          </h2>
          <p className="text-xl max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Alex Stamenkovic — Self-Development Podcast Host. Here&apos;s what 90 days of working together looked like.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8 items-start">

          {/* Left — video */}
          <motion.div
            initial={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(112,59,255,0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(112,59,255,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src="https://www.youtube.com/embed/CHkWYAXUFxU"
                  title="Alex Stamenkovic — Client Testimonial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 'none', display: 'block', borderRadius: '12px' }}
                />
              </div>
            </div>
            <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
              Alex Stamenkovic — Testimonial
            </p>
          </motion.div>

          {/* Right — results card */}
          <motion.div
            initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }}
            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="rounded-xl p-7 flex flex-col gap-7"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Client name + role */}
            <div>
              <p
                className="text-2xl font-bold uppercase tracking-tight mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
              >
                Alex Stamenkovic
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Self-Development Podcast Host
              </p>
            </div>

            {/* 2x2 stats grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-7">
              {STATS.map((s) => (
                <StatBlock key={s.label} {...s} animate={isInView} />
              ))}
            </div>

            {/* Screenshot proof */}
            <div>
              <img
                src="/SCR-20260410-rvaz-2.png"
                alt="YouTube Studio live analytics for Alex Stamenkovic"
                className="w-full"
                style={{ borderRadius: '8px', display: 'block' }}
              />
              <p className="text-sm mt-2 italic" style={{ color: '#888888' }}>
                YouTube Studio — Live Analytics
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
