'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Play, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const LONG_FORM = [
  { id: '0NTHoYso6MQ', embedUrl: 'https://www.youtube.com/embed/0NTHoYso6MQ' },
  { id: '127CeKnnNhA', embedUrl: 'https://www.youtube.com/embed/127CeKnnNhA' },
  { id: 'tPMZAIHV_-w', embedUrl: 'https://www.youtube.com/embed/tPMZAIHV_-w' },
  { id: 'UEOsLTxvxaw', embedUrl: 'https://www.youtube.com/embed/UEOsLTxvxaw' },
  { id: 'JwFauYZjp60', embedUrl: 'https://www.youtube.com/embed/JwFauYZjp60' },
];

const SHORT_FORM: Array<{ type: 'youtube'; embedUrl: string } | { type: 'instagram'; linkUrl: string }> = [
  { type: 'youtube', embedUrl: 'https://www.youtube.com/embed/EwDjXLix_FU' },
  { type: 'instagram', linkUrl: 'https://www.instagram.com/reel/DUGqRm1CEop/' },
  { type: 'instagram', linkUrl: 'https://www.instagram.com/reel/DKzKI67yGvg/' },
];

const THUMB_IMAGES = [
  '/Hussein-durrah-v2.jpg',
  '/Lucas-TUDCA-V3 (1).jpg',
  '/maxresdefault-5-1.jpg',
  '/Lucas-supps-changed-my-life (1).jpg',
  '/4.jpg',
  '/Chris-Reynolds--Dr-Niranjan-podcast-1.jpg',
  '/MicrobiomeExpert-false-alarm-1.jpg',
  '/Nathalie-podcast-377-3.jpg',
  '/AlexRupic-video-everyone-needs-to-have-v3-3 (1).jpg',
  '/ESB-Podcast-izlozba-slikanja-v2-1.jpg',
  '/Nathalie-podcast-371-1.jpg',
  '/Nikola-Milanovic-konferencija-vlog-1.jpg',
  '/Nikola-Milanovic-Lisbon-Vlog (1).jpg',
];

const THUMBS_ROW1 = [...THUMB_IMAGES, ...THUMB_IMAGES];
const THUMBS_ROW2 = [...THUMB_IMAGES.slice(5), ...THUMB_IMAGES.slice(0, 5), ...THUMB_IMAGES.slice(5), ...THUMB_IMAGES.slice(0, 5)];

const STATS = [
  { value: '50M+', label: 'Views Generated' },
  { value: '100+', label: 'Clients Served' },
  { value: '3+', label: 'Years Running' },
  { value: '100%', label: 'Done For You' },
];

const glassCard: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const hoverOn = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(112,59,255,0.45)';
  el.style.boxShadow = '0 0 32px rgba(112,59,255,0.25)';
};
const hoverOff = (el: HTMLElement) => {
  el.style.borderColor = 'rgba(255,255,255,0.06)';
  el.style.boxShadow = 'none';
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, filter: 'blur(6px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, filter: 'blur(6px)' }),
};

export default function OurWork() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (next: number) => {
    const clamped = (next + LONG_FORM.length) % LONG_FORM.length;
    setDirection(next > activeIndex || (next === 0 && activeIndex === LONG_FORM.length - 1) ? 1 : -1);
    setActiveIndex(clamped);
  };

  return (
    <section
      ref={ref}
      className="pt-32 pb-40 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
      aria-labelledby="our-work-heading"
    >
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[900px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(112,59,255,0.07) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
            Portfolio
          </p>
          <h2
            id="our-work-heading"
            className="text-5xl md:text-7xl font-bold mb-6 leading-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Work That Speaks<br />
            <span style={{ color: 'var(--accent-primary)' }}>For Itself.</span>
          </h2>
          <p className="text-xl max-w-2xl mb-12" style={{ color: 'var(--text-secondary)' }}>
            Long-form authority content, viral short-form clips, and thumbnails engineered to stop the scroll. Every week. For every client.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-x-12 gap-y-5">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, ease, delay: 0.15 + i * 0.08 }}
              >
                <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
                  {s.value}
                </p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Long-Form Slider ── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease, delay: 0.15 }}
        className="max-w-[1200px] mx-auto px-6 mb-5"
      >
        {/* Label + counter */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
            Long Form
          </p>
          <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {String(activeIndex + 1).padStart(2, '0')} / {String(LONG_FORM.length).padStart(2, '0')}
          </p>
        </div>

        {/* Main video */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => go(activeIndex - 1)}
            aria-label="Previous video"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(112,59,255,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(112,59,255,0.5)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => go(activeIndex + 1)}
            aria-label="Next video"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(112,59,255,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(112,59,255,0.5)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <ChevronRight size={18} style={{ color: 'var(--text-primary)' }} />
          </button>

          {/* Video frame */}
          <div className="rounded-2xl overflow-hidden" style={{ ...glassCard }}>
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.iframe
                  key={activeIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease }}
                  src={LONG_FORM[activeIndex].embedUrl}
                  title={`Long-form video ${activeIndex + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 'none', display: 'block' }}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Thumbnail nav strip */}
        <div className="flex gap-3 mt-4">
          {LONG_FORM.map((v, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
              aria-label={`Go to video ${i + 1}`}
              className="flex-1 rounded-xl overflow-hidden transition-all"
              style={{
                border: i === activeIndex ? '2px solid rgba(112,59,255,0.8)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: i === activeIndex ? '0 0 16px rgba(112,59,255,0.3)' : 'none',
                opacity: i === activeIndex ? 1 : 0.45,
                transition: 'all 0.2s ease',
              }}
            >
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <img
                  src={`https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`}
                  alt={`Video ${i + 1} thumbnail`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Thumbnail Marquees ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, ease, delay: 0.3 }}
        className="mt-20 mb-4 flex flex-col gap-4 overflow-hidden"
      >
        <p className="text-xs font-semibold uppercase tracking-widest px-6 max-w-[1200px] mx-auto w-full mb-2" style={{ color: 'var(--accent-primary)' }}>
          Thumbnails
        </p>

        {/* Row 1: left→right */}
        <div className="marquee-track flex gap-4" style={{ width: 'max-content' }}>
          {THUMBS_ROW1.map((src, i) => (
            <div key={i} className="shrink-0" style={{ width: '380px' }}>
              <div
                className="rounded-xl overflow-hidden"
                style={{ ...glassCard, transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLElement)}
                onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLElement)}
              >
                <div className="relative" style={{ paddingTop: '56.25%' }}>
                  <img
                    src={src}
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: right→left */}
        <div className="marquee-track-reverse flex gap-4" style={{ width: 'max-content' }}>
          {THUMBS_ROW2.map((src, i) => (
            <div key={i} className="shrink-0" style={{ width: '380px' }}>
              <div
                className="rounded-xl overflow-hidden"
                style={{ ...glassCard, transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLElement)}
                onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLElement)}
              >
                <div className="relative" style={{ paddingTop: '56.25%' }}>
                  <img
                    src={src}
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Short-Form ── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease, delay: 0.35 }}
        className="max-w-[1200px] mx-auto px-6 mt-20"
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent-primary)' }}>
          Short Form
        </p>
        <div className="flex gap-5 justify-center flex-wrap">
          {SHORT_FORM.map((item, i) => (
            <div key={i} style={{ width: '280px', flexShrink: 0 }}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ ...glassCard, transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLElement)}
                onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLElement)}
              >
                <div
                  className="relative"
                  style={{ paddingTop: '177.78%', backgroundColor: 'rgba(0,0,0,0.4)' }}
                >
                  {item.type === 'youtube' ? (
                    <iframe
                      src={item.embedUrl}
                      title={`Short-form video ${i + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 'none', display: 'block' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div
                        className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full"
                        style={{ width: '28%', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)' }}
                      />
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(112,59,255,0.2)',
                          border: '1.5px solid rgba(112,59,255,0.5)',
                        }}
                      >
                        <Play size={20} fill="#703bff" style={{ color: '#703bff', marginLeft: '3px' }} />
                      </div>
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        Watch on Instagram <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
