'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { FORM_URL } from '@/lib/constants';

const LINE1 = 'YOUR YOUTUBE CHANNEL.';
const LINE2 = 'FULLY MANAGED.';

const ease = [0.16, 1, 0.3, 1] as const;

function TypewriterLine({
  text,
  color,
  startCharIdx,
}: {
  text: string;
  color: string;
  startCharIdx: number;
}) {
  return (
    <span style={{ display: 'block', paddingBottom: '0.05em', wordBreak: 'break-word' }}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.001, delay: (startCharIdx + i) * 0.08 }}
          style={{ color, display: 'inline' }}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </span>
  );
}

const fadeUp = (delay: number) => ({
  hidden: { y: 20, opacity: 0, filter: 'blur(4px)' },
  visible: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease, delay },
  },
});

export default function Hero() {
  const totalChars = LINE1.length + LINE2.length;
  const subDelay = totalChars * 0.08 + 0.14;
  const ctaDelay = subDelay + 0.15;
  const statsDelay = ctaDelay + 0.12;

  return (
    <section
      id="main"
      className="relative flex items-center justify-center min-h-screen px-6"
      style={{ overflowX: 'hidden' }}
      aria-label="Hero"
    >
      {/* Cinematic background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 hero-grid opacity-60" aria-hidden="true" />

      {/* Subtle headline glow */}
      <div
        className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(112,59,255,0.10) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 text-center mx-auto pt-24 pb-16" style={{ maxWidth: 'min(1024px, 100%)', width: '100%' }}>
        {/* H1 — typewriter character by character */}
        <h1
          className="font-black uppercase leading-none tracking-tight mb-6"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(56px, 10vw, 120px)',
            lineHeight: '0.95',
            letterSpacing: '-0.02em',
          }}
        >
          <TypewriterLine text={LINE1} color="var(--text-primary)" startCharIdx={0} />
          <TypewriterLine text={LINE2} color="#703bff" startCharIdx={LINE1.length} />
        </h1>

        {/* Subheadline */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp(subDelay)}
          className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          You record. We handle strategy, scripting, editing, thumbnails, and publishing. Your channel grows while you focus on your business.
        </motion.p>

        {/* CTA group */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp(ctaDelay)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Button href={FORM_URL} size="lg">
            Book a Call
          </Button>
          <Button href="#results" variant="outline" size="lg">
            See Results
          </Button>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp(statsDelay)}
          className="inline-flex items-center gap-0 rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {[
            { value: '100+', label: 'Clients Served' },
            { value: '50M+', label: 'Views Generated' },
            { value: '3+', label: 'Years Running' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div
                  className="w-px self-stretch"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  aria-hidden="true"
                />
              )}
              <div className="px-8 py-5 text-center">
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
