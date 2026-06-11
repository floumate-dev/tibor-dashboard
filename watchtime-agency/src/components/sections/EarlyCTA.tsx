'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Button from '@/components/ui/Button';
import { FORM_URL } from '@/lib/constants';

const ease = [0.16, 1, 0.3, 1] as const;

export default function EarlyCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      aria-labelledby="early-cta-heading"
    >
      {/* Subtle glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(112,59,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
        animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 max-w-[640px] mx-auto text-center"
      >
        <h2
          id="early-cta-heading"
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Ready to grow your<br />
          <span style={{ color: 'var(--accent-primary)' }}>YouTube channel?</span>
        </h2>
        <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
          Book a free 30-minute strategy call. No pitch, no pressure.
        </p>
        <Button href={FORM_URL} size="lg">
          Book Your Free Strategy Call
        </Button>
      </motion.div>
    </section>
  );
}
