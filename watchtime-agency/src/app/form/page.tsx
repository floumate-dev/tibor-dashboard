'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { FORM_QUESTIONS, FormQuestion } from '@/lib/form-questions';
import { BOOKING_URL, FORM_WEBHOOK_URL, SITE_NAME } from '@/lib/constants';
import PhoneInput from '@/components/form/PhoneInput';
import { getAttribution } from '@/lib/tracking';

const ease = [0.16, 1, 0.3, 1] as const;

type Answers = Record<string, string>;

/* ─────────────────────────────────────── Validation ─────────────────────────────────────── */

function validate(q: FormQuestion, value: string): string | null {
  const v = (value ?? '').trim();
  if (!v) return 'Please complete this field before continuing.';

  if (q.type === 'email') {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) return 'Please enter a valid email address.';
  }

  if (q.type === 'url') {
    try {
      const u = new URL(v.startsWith('http') ? v : `https://${v}`);
      if (!u.hostname.includes('.')) throw new Error('bad host');
    } catch {
      return 'Please enter a valid URL.';
    }
  }

  if (q.type === 'tel' || q.type === 'phone') {
    const digits = v.replace(/[^\d]/g, '');
    if (digits.length < 6) return 'Please enter a valid phone number.';
  }

  return null;
}

/* ─────────────────────────────────────── Page ─────────────────────────────────────── */

export default function FormPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Track latest step/answers in a ref so rapid radio clicks always see
  // up-to-date state instead of a stale closure from a previous render.
  const stepRef = useRef(0);
  const answersRef = useRef<Answers>({});
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const total = FORM_QUESTIONS.length;
  // Defensive clamp so we never render an undefined question if something races.
  const safeStep = Math.min(Math.max(step, 0), total - 1);
  const current = FORM_QUESTIONS[safeStep];
  const progress = ((safeStep + 1) / total) * 100;

  /* Go next */
  const advance = (value?: string) => {
    const s = stepRef.current;
    const q = FORM_QUESTIONS[s];
    if (!q) return;

    const answer = value ?? answersRef.current[q.id] ?? '';
    const err = validate(q, answer);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    const nextAnswers = { ...answersRef.current, [q.id]: answer };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    if (s >= total - 1) {
      handleSubmit(nextAnswers);
      return;
    }

    setDirection(1);
    setStep(s + 1);
  };

  const goBack = () => {
    const s = stepRef.current;
    if (s === 0) return;
    setError(null);
    setDirection(-1);
    setStep(s - 1);
  };

  const handleSubmit = async (finalAnswers: Answers) => {
    setSubmitting(true);
    setSubmitError(null);

    // Remap keys from internal IDs ("fullName") to the human-readable question
    // titles ("What's your full name?") so the variables inside Make.com match
    // the questions 1:1. This makes mapping columns in Google Sheets trivial.
    const byQuestion: Record<string, string> = {};
    for (const q of FORM_QUESTIONS) {
      byQuestion[q.title] = finalAnswers[q.id] ?? '';
    }

    // Pull first-touch attribution (src/sub_src + UTMs + referrer/landing).
    const attribution = getAttribution();

    const payload = {
      ...byQuestion,
      // Attribution fields
      src: attribution.src,
      sub_src: attribution.sub_src,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      referrer: attribution.referrer,
      landingPage: attribution.landingPage,
      attributionCapturedAt: attribution.capturedAt,
      // Metadata
      submittedAt: new Date().toISOString(),
      source: 'watchtime-agency-form',
    };

    // eslint-disable-next-line no-console
    console.log('[WatchTime Form Submission]', payload);

    try {
      const res = await fetch(FORM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Make.com webhooks typically return 200 with "Accepted". Anything 2xx is a success.
      if (!res.ok) {
        throw new Error(`Webhook responded with ${res.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.error('[WatchTime Form Submit Failed]', msg);
      setSubmitError(
        "We couldn't submit your application. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const retrySubmit = () => {
    handleSubmit(answersRef.current);
  };

  /* Success screen */
  if (submitted) {
    return <SuccessScreen name={(answers.fullName || '').split(' ')[0]} />;
  }

  /* In-flight submission */
  if (submitting) {
    return <SubmittingScreen />;
  }

  /* Submission failed — let the user retry */
  if (submitError) {
    return (
      <ErrorScreen
        message={submitError}
        onRetry={retrySubmit}
        onEdit={() => {
          setSubmitError(null);
          // Drop back to the last question so they can review + resubmit
          setStep(total - 1);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Top bar with logo + progress */}
      <header className="px-6 pt-6 pb-4 max-w-[960px] w-full mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            {SITE_NAME}
          </Link>
          <p
            className="text-xs font-semibold tabular-nums uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {String(step + 1).padStart(2, '0')}{' '}
            <span style={{ color: 'var(--text-muted)' }}>/</span>{' '}
            {String(total).padStart(2, '0')}
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="relative w-full h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #703bff, #9f6bff)',
              boxShadow: '0 0 12px rgba(112,59,255,0.5)',
            }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease }}
          />
        </div>
      </header>

      {/* Ambient glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(112,59,255,0.08) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="relative w-full max-w-[720px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current.id}
              custom={direction}
              initial={{
                opacity: 0,
                x: direction > 0 ? 40 : -40,
                filter: 'blur(6px)',
              }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -40 : 40,
                filter: 'blur(6px)',
              }}
              transition={{ duration: 0.4, ease }}
            >
              <QuestionBlock
                question={current}
                value={answers[current.id] ?? ''}
                onChange={(v) => {
                  setAnswers((prev) => ({ ...prev, [current.id]: v }));
                  if (error) setError(null);
                }}
                onAdvance={advance}
                error={error}
                isLast={step === total - 1}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom nav */}
      <footer className="px-6 pb-8 max-w-[720px] w-full mx-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{
              color: step === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (step !== 0) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (step !== 0) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
            aria-label="Previous question"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* Next button — only shown for non-radio types. For radio, clicking an option auto-advances. */}
          {current.type !== 'radio' && (
            <button
              type="button"
              onClick={() => advance()}
              className="inline-flex items-center gap-2 rounded-xl font-semibold text-sm px-6 py-3 transition-all"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                boxShadow: '0 0 24px rgba(112,59,255,0.35)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 0 36px rgba(112,59,255,0.55), 0 0 72px rgba(112,59,255,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 0 24px rgba(112,59,255,0.35)';
              }}
            >
              {step === total - 1 ? 'Submit' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────── Question block ─────────────────────────────────────── */

function QuestionBlock({
  question,
  value,
  onChange,
  onAdvance,
  error,
  isLast,
}: {
  question: FormQuestion;
  value: string;
  onChange: (v: string) => void;
  onAdvance: (value?: string) => void;
  error: string | null;
  isLast: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus text inputs when the step changes
  useEffect(() => {
    if (question.type !== 'radio') {
      inputRef.current?.focus();
    }
  }, [question.id, question.type]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdvance();
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    borderBottom: '1px solid rgba(255,255,255,0.14)',
    outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif",
  };

  return (
    <div>
      {question.subtitle && (
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'var(--accent-primary)' }}
        >
          {question.subtitle}
        </p>
      )}

      <h1
        className="font-bold mb-8"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          color: 'var(--text-primary)',
          fontSize: 'clamp(26px, 4.4vw, 44px)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {question.title}
      </h1>

      {question.type === 'phone' ? (
        <div>
          <PhoneInput
            value={value}
            onChange={onChange}
            onEnter={() => onAdvance()}
            placeholder={question.placeholder}
          />
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Press{' '}
            <kbd
              className="px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.7rem',
              }}
            >
              Enter
            </kbd>{' '}
            to {isLast ? 'submit' : 'continue'}
          </p>
        </div>
      ) : question.type === 'radio' ? (
        <div className="flex flex-col gap-3">
          {question.options!.map((opt, i) => {
            const selected = value === opt;
            return (
              <motion.button
                key={opt}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: i * 0.04 }}
                onClick={() => {
                  onChange(opt);
                  // Small delay so the user sees the selection before advancing
                  setTimeout(() => onAdvance(opt), 180);
                }}
                className="group w-full text-left flex items-center justify-between rounded-xl px-5 py-4 transition-all"
                style={{
                  backgroundColor: selected
                    ? 'rgba(112,59,255,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  border: selected
                    ? '1px solid rgba(112,59,255,0.55)'
                    : '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: selected ? '0 0 24px rgba(112,59,255,0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'rgba(112,59,255,0.35)';
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'rgba(112,59,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'rgba(255,255,255,0.03)';
                  }
                }}
              >
                <span
                  className="text-base md:text-lg"
                  style={{
                    color: selected
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    fontWeight: selected ? 600 : 500,
                  }}
                >
                  {opt}
                </span>
                <span
                  className="flex items-center justify-center rounded-full w-6 h-6 shrink-0 ml-4 transition-all"
                  style={{
                    backgroundColor: selected
                      ? 'var(--accent-primary)'
                      : 'transparent',
                    border: selected
                      ? '1px solid var(--accent-primary)'
                      : '1px solid rgba(255,255,255,0.2)',
                  }}
                  aria-hidden="true"
                >
                  {selected && <Check size={14} color="#fff" strokeWidth={3} />}
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type={question.type === 'url' ? 'url' : question.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={question.placeholder}
            className="w-full text-2xl md:text-3xl py-3"
            style={inputStyle}
            autoComplete={
              question.type === 'email'
                ? 'email'
                : question.type === 'tel'
                  ? 'tel'
                  : question.id === 'fullName'
                    ? 'name'
                    : 'off'
            }
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderBottomColor =
                'var(--accent-primary)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderBottomColor =
                'rgba(255,255,255,0.14)';
            }}
          />
          <p
            className="text-xs mt-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Press <kbd
              className="px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.7rem',
              }}
            >Enter</kbd> to {isLast ? 'submit' : 'continue'}
          </p>
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 text-sm font-medium"
          style={{ color: '#ff5a5a' }}
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── Submitting / Error screens ─────────────────────────────────────── */

function SubmittingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(112,59,255,0.1) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-10 text-center"
      >
        {/* Spinner */}
        <div
          className="w-12 h-12 rounded-full mx-auto mb-6"
          style={{
            border: '3px solid rgba(112,59,255,0.2)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 0.9s linear infinite',
          }}
          aria-hidden="true"
        />
        <p
          className="text-lg font-semibold"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-primary)',
          }}
        >
          Submitting your application…
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Just a second.
        </p>
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
  onEdit,
}: {
  message: string;
  onRetry: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,90,90,0.08) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease }}
        className="relative z-10 max-w-[520px] text-center"
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#ff5a5a' }}
        >
          Submission failed
        </p>
        <h1
          className="text-3xl md:text-5xl font-bold mb-5"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Something went wrong.
        </h1>
        <p className="text-base md:text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl font-semibold px-7 py-3.5 transition-all"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              boxShadow: '0 0 30px rgba(112,59,255,0.4)',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            Review my answers
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────── Success screen ─────────────────────────────────────── */

function SuccessScreen({ name }: { name: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(112,59,255,0.12) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 max-w-[620px]"
      >
        {/* Check icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(112,59,255,0.15)',
            border: '1px solid rgba(112,59,255,0.5)',
            boxShadow: '0 0 40px rgba(112,59,255,0.35)',
          }}
        >
          <Check size={34} color="#703bff" strokeWidth={3} />
        </motion.div>

        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'var(--accent-primary)' }}
        >
          Application received
        </p>

        <h1
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Thanks{name ? `, ${name}` : ''}.<br />
          <span style={{ color: 'var(--accent-primary)' }}>You&apos;re in.</span>
        </h1>

        <p
          className="text-lg md:text-xl mb-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          Our team is reviewing your answers now. The last step is to book your free
          30-minute strategy call — pick a time that works for you below.
        </p>

        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl font-semibold px-9 py-4 text-lg transition-all"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            boxShadow: '0 0 30px rgba(112,59,255,0.4)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 0 40px rgba(112,59,255,0.6), 0 0 80px rgba(112,59,255,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 0 30px rgba(112,59,255,0.4)';
          }}
        >
          Book your strategy call
          <ArrowRight size={18} />
        </a>

        <p
          className="text-sm mt-8"
          style={{ color: 'var(--text-muted)' }}
        >
          <span style={{ color: 'var(--accent-primary)' }}>✓</span> Free 30-minute call
          &nbsp;&nbsp;
          <span style={{ color: 'var(--accent-primary)' }}>✓</span> No pitch, no pressure
        </p>

        <div className="mt-12">
          <Link
            href="/"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
