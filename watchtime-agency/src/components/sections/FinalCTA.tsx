'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { FORM_URL } from '@/lib/constants';

export default function FinalCTA() {
  return (
    <section
      className="py-32 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
      aria-labelledby="final-cta-heading"
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(112,59,255,0.07) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-[700px] mx-auto text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--accent-primary)' }}>
          Ready to start?
        </p>
        <h2
          id="final-cta-heading"
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          A YouTube channel that<br />
          <span style={{ color: 'var(--accent-primary)' }}>works as hard as you do.</span>
        </h2>
        <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
          Book a free 30-minute strategy call. No pitch, no pressure — just a clear roadmap for your YouTube growth.
        </p>

        <Button href={FORM_URL} size="lg" className="text-lg px-12 py-5">
          Book Your Free Strategy Call
        </Button>

        <p className="text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent-primary)' }}>✓</span> No long-term contracts
          &nbsp;&nbsp;
          <span style={{ color: 'var(--accent-primary)' }}>✓</span> Cancel anytime
          &nbsp;&nbsp;
          <span style={{ color: 'var(--accent-primary)' }}>✓</span> Free strategy session
        </p>
      </motion.div>
    </section>
  );
}
