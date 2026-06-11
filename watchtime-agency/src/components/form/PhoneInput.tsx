'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  COUNTRIES,
  Country,
  DEFAULT_COUNTRY_ISO,
  findCountryByIso,
  parsePhoneValue,
} from '@/lib/countries';

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  placeholder?: string;
}

/**
 * Phone input with a dial-code / flag picker + automatic country detection
 * via https://ipapi.co/json/ on mount. Matches the pattern used on
 * edumena.org/forma-2026 but implemented as a React component styled for
 * WatchTime's dark + purple theme.
 */
export default function PhoneInput({ value, onChange, onEnter, placeholder }: PhoneInputProps) {
  // Seed from incoming value if it contains a dial code (e.g. user went Back and forward).
  const initialParsed = parsePhoneValue(value);
  const [country, setCountry] = useState<Country>(
    initialParsed.country ?? findCountryByIso(DEFAULT_COUNTRY_ISO) ?? COUNTRIES[0]
  );
  const [localNumber, setLocalNumber] = useState<string>(initialParsed.local);
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const userEditedCountry = useRef<boolean>(!!initialParsed.country);

  /** Emit combined value to parent whenever either side changes.
   *  We normalize to E.164-ish format: "+countrycode" + digits only, no spaces.
   *  So "+381 60 123 4567" becomes "+381601234567". */
  const emit = (c: Country, local: string) => {
    const digits = local.replace(/\D/g, '');
    onChange(digits ? `${c.dial}${digits}` : '');
  };

  /** Auto-detect country from IP on first mount. */
  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        // Don't override a country the user has already picked or one already seeded
        // from the incoming value.
        if (userEditedCountry.current) return;
        const match = findCountryByIso(data.country_code);
        if (match) {
          setCountry(match);
          emit(match, localNumber);
        }
      })
      .catch(() => {
        /* silent — default country stays */
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Close dropdown when clicking outside. */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  /** Focus the number field after mount for smooth typing UX. */
  useEffect(() => {
    numberInputRef.current?.focus();
  }, []);

  const selectCountry = (c: Country) => {
    userEditedCountry.current = true;
    setCountry(c);
    setOpen(false);
    emit(c, localNumber);
    // Return focus to the number input
    setTimeout(() => numberInputRef.current?.focus(), 0);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalNumber(v);
    emit(country, v);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Picker + number input row */}
      <div
        className="flex items-center gap-3 border-b transition-colors"
        style={{ borderColor: 'rgba(255,255,255,0.14)' }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLElement).style.borderBottomColor = 'var(--accent-primary)';
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLElement).style.borderBottomColor = 'rgba(255,255,255,0.14)';
        }}
      >
        {/* Dial picker */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Country: ${country.name}, dial code ${country.dial}`}
          className="flex items-center gap-2 py-3 shrink-0 transition-colors"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-primary)',
            fontSize: 'clamp(20px, 3.2vw, 28px)',
          }}
        >
          <span style={{ fontSize: '1.3em', lineHeight: 1 }} aria-hidden="true">
            {country.flag}
          </span>
          <span className="tabular-nums">{country.dial}</span>
          <ChevronDown
            size={18}
            style={{
              color: 'var(--text-secondary)',
              transition: 'transform 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {/* Number input */}
        <input
          ref={numberInputRef}
          type="tel"
          value={localNumber}
          onChange={handleLocalChange}
          onKeyDown={handleKey}
          placeholder={placeholder || '60 123 4567'}
          className="flex-1 min-w-0 py-3 bg-transparent outline-none"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-primary)',
            fontSize: 'clamp(20px, 3.2vw, 28px)',
          }}
          autoComplete="tel-national"
          inputMode="tel"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-2 rounded-xl overflow-y-auto z-20"
          style={{
            backgroundColor: 'rgba(18,18,18,0.96)',
            border: '1px solid rgba(112,59,255,0.25)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maxHeight: '320px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 24px rgba(112,59,255,0.12)',
          }}
        >
          {COUNTRIES.map((c) => {
            const selected = c.iso === country.iso;
            return (
              <button
                key={c.iso}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectCountry(c)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                style={{
                  color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: selected ? 'rgba(112,59,255,0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'rgba(112,59,255,0.08)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span style={{ fontSize: '1.15rem', lineHeight: 1 }} aria-hidden="true">
                    {c.flag}
                  </span>
                  <span className="text-sm truncate">{c.name}</span>
                </span>
                <span
                  className="text-sm tabular-nums shrink-0 ml-4"
                  style={{ color: selected ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                >
                  {c.dial}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
