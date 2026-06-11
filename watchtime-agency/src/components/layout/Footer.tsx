'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Share2, Rss, ExternalLink } from 'lucide-react';
import { SITE_NAME, SITE_TAGLINE, NAV_LINKS } from '@/lib/constants';

export default function Footer() {
  const pathname = usePathname();

  // Hide the global Footer on the form page — /form is a single-purpose flow.
  if (pathname?.startsWith('/form')) return null;

  return (
    <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <p
              className="text-xl font-bold mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
            >
              {SITE_NAME}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {SITE_TAGLINE}
            </p>
            <div className="flex gap-4 mt-6">
              {[
                { Icon: Globe, label: 'YouTube', href: '#' },
                { Icon: Share2, label: 'LinkedIn', href: '#' },
                { Icon: ExternalLink, label: 'X (Twitter)', href: '#' },
                { Icon: Rss, label: 'Instagram', href: '#' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="transition-colors hover:text-white"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Links
            </p>
            <ul className="flex flex-col gap-3">
              {[...NAV_LINKS, { label: 'Contact', href: '/contact' }].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Get in Touch
            </p>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Ready to build a YouTube channel that works for your business?
            </p>
            <a
              href="/contact"
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent-primary)' }}
            >
              Book a Free Strategy Call →
            </a>
          </div>
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 pt-8"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs transition-colors hover:text-white"
              style={{ color: 'var(--text-muted)' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs transition-colors hover:text-white"
              style={{ color: 'var(--text-muted)' }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
