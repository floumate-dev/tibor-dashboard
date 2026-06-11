'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 px-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      aria-labelledby="about-heading"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="relative w-full h-[400px] md:h-full min-h-[500px]"
          >
            <img
              src="/Aleksa Slika (1).jpg"
              alt="Aleksa Rupic, founder of WatchTime Agency"
              className="w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '16px',
                border: '1px solid rgba(112,59,255,0.3)',
              }}
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent-primary)' }}>
              About us
            </p>
            <h2
              id="about-heading"
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              The team behind<br />
              <span style={{ color: 'var(--accent-primary)' }}>WatchTime Agency.</span>
            </h2>

            <div className="space-y-4" style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7' }}>
              <p>
                We built WatchTime Agency after watching dozens of brilliant business professionals fail on YouTube — not because they lacked expertise, but because they lacked time and the right system.
              </p>
              <p>
                Our team has spent years studying what makes YouTube channels grow for <strong style={{ color: 'var(--text-primary)' }}>business owners, consultants, and personal brands</strong>. We&apos;ve distilled that into a repeatable production process that delivers results in 90 days.
              </p>
              <p>
                We&apos;re not a generic video agency. We don&apos;t just edit videos — we build <strong style={{ color: 'var(--text-primary)' }}>authority-generating content machines</strong> that bring clients to you. Every strategy is built around your business goals, not just your view count.
              </p>
              <p>
                When you work with us, you get a dedicated team — strategist, scriptwriter, editor, and thumbnail designer — all obsessively focused on one thing: making you the go-to authority in your space.
              </p>
            </div>

            <div className="flex gap-6 mt-8">
              <div>
                <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent-primary)' }}>100+</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>channels managed</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent-primary)' }}>50M+</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>views generated</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent-primary)' }}>90</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>days to results</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
