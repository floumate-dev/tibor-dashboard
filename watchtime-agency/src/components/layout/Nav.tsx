'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS, SITE_NAME, FORM_URL } from '@/lib/constants';

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide the global Nav on the form page — /form has its own minimal header.
  // (Must come AFTER all hooks to respect React rules of hooks.)
  if (pathname?.startsWith('/form')) return null;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            {SITE_NAME}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: 'var(--text-secondary)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href={FORM_URL}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 0 20px var(--accent-glow), 0 0 40px var(--accent-glow)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              Book a Call
            </Link>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href={FORM_URL}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            >
              Book a Call
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="p-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col pt-20 px-6"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <nav className="flex flex-col gap-6 mt-8" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-2xl font-semibold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto mb-12">
            <Link
              href={FORM_URL}
              onClick={() => setMenuOpen(false)}
              className="block w-full text-center py-4 rounded-xl text-base font-bold"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            >
              Book Your Free Strategy Call
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
