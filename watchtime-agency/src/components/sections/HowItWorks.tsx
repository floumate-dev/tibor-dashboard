'use client';

import { Map, Lightbulb, Video, Scissors, Image, Upload, BarChart2 } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Button from '@/components/ui/Button';
import { PROCESS_STEPS, FORM_URL } from '@/lib/constants';

const ease = [0.16, 1, 0.3, 1] as const;

const ICONS: Record<string, React.ElementType> = {
  Map, Lightbulb, Video, Scissors, Image, Upload, BarChart2,
};

const hoverOn = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(112,59,255,0.45)';
  el.style.boxShadow = '0 0 32px rgba(112,59,255,0.25)';
};
const hoverOff = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(255,255,255,0.06)';
  el.style.boxShadow = 'none';
};

function StepCard({ step, index, animate }: {
  step: typeof PROCESS_STEPS[0];
  index: number;
  animate: boolean;
}) {
  const Icon = ICONS[step.icon] || Map;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: 'blur(4px)' }}
      animate={animate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.55, ease, delay: index * 0.08 }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: '460px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLElement)}
      onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLElement)}
    >
      {/* Top: number + text */}
      <div className="p-6 flex-1">
        <p
          className="text-5xl font-black leading-none mb-5"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}
        >
          {step.number}
        </p>

        <h3
          className="text-base font-bold mb-3 leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
        >
          {step.title}
        </h3>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {step.description}
        </p>
      </div>

      {/* Bottom: icon area */}
      <div
        className="relative flex items-end justify-center overflow-hidden"
        style={{ height: '220px' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-28 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(112,59,255,0.2) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          aria-hidden="true"
        />

        {/* 3D icon — drop PNG into /public/icons/step-0X.png to activate */}
        <div className="relative z-10 mb-4">
          <img
            src={`/Icons/step-${step.number}.png`}
            alt={step.title}
            width={190}
            height={190}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 22px rgba(112,59,255,0.45))' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* Lucide fallback */}
          <div
            className="hidden items-center justify-center"
            style={{ width: 190, height: 190 }}
          >
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(112,59,255,0.12)',
                border: '1px solid rgba(112,59,255,0.3)',
              }}
            >
              <Icon size={40} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const rowOne = PROCESS_STEPS.slice(0, 4);
  const rowTwo = PROCESS_STEPS.slice(4);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="pt-32 pb-40 px-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      aria-labelledby="process-heading"
    >
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
            Our process
          </p>
          <h2
            id="process-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Seven steps. Zero<br />
            <span style={{ color: 'var(--accent-primary)' }}>effort on your end.</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            From strategy to conversions — every step is handled by our team so you only have to show up and record.
          </p>
        </motion.div>

        {/* Row 1: steps 01–04 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {rowOne.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} animate={isInView} />
          ))}
        </div>

        {/* Row 2: steps 05–07 — centered 3-col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 xl:max-w-[900px] xl:mx-auto">
          {rowTwo.map((step, i) => (
            <StepCard key={step.number} step={step} index={4 + i} animate={isInView} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-center mt-14"
        >
          <Button href={FORM_URL} size="lg">
            Book Your Free Strategy Call
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
