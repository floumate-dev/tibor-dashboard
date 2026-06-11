import type { Metadata } from 'next';
import { Map, FileText, Video, Image, Search, BarChart2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { FORM_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Services — WatchTime Agency',
  description: 'Full-service YouTube content production for business leaders. Strategy, scripting, editing, thumbnails, SEO, and analytics — all done for you.',
};

const DETAILED_SERVICES = [
  {
    icon: Map,
    name: 'Content Strategy',
    tagline: 'A roadmap built around your business goals — not just views.',
    bullets: [
      'Custom 90-day content calendar aligned with your niche and audience',
      'Keyword and competitor research to find high-opportunity topics',
      'Content pillars designed to attract your ideal client',
      "Monthly strategy reviews to adapt to what's working",
    ],
  },
  {
    icon: FileText,
    name: 'Scripting & Research',
    tagline: 'Scripts that sound like you — and keep people watching.',
    bullets: [
      'Full scripts or detailed outlines based on your preference',
      'Opening hooks engineered to beat the 30-second drop-off',
      'Research-backed content that positions you as an authority',
      'Talking points and coaching for natural on-camera delivery',
    ],
  },
  {
    icon: Video,
    name: 'Video Editing',
    tagline: 'Professional editing that keeps viewers engaged to the end.',
    bullets: [
      'Dynamic cuts, B-roll, and motion graphics',
      'Captions optimized for accessibility and watch time',
      'Color grading and audio mastering for a premium look',
      "Multiple revision rounds until you're 100% satisfied",
    ],
  },
  {
    icon: Image,
    name: 'Thumbnail Design',
    tagline: 'Click-worthy thumbnails that compete with the biggest channels.',
    bullets: [
      'A/B tested thumbnail concepts for every video',
      'High-contrast designs engineered for mobile and desktop',
      'Consistent brand visual identity across your channel',
      'CTR analysis with monthly design optimizations',
    ],
  },
  {
    icon: Search,
    name: 'SEO & Publishing',
    tagline: 'Your videos found by the people who need to see them.',
    bullets: [
      'Optimized titles, descriptions, and tags for YouTube search',
      'Strategic publishing schedule for maximum algorithmic reach',
      'Playlist organization and end-screen optimization',
      'Cross-platform distribution to LinkedIn, Twitter, and newsletters',
    ],
  },
  {
    icon: BarChart2,
    name: 'Analytics & Optimization',
    tagline: 'Data-driven decisions, every month.',
    bullets: [
      'Monthly performance reports with key metrics and insights',
      'Watch time, CTR, and subscriber growth analysis',
      'Audience retention breakdown to improve future videos',
      'Quarterly strategy pivots based on what the data shows',
    ],
  },
];

export default function ServicesPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)' }} className="pt-24">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-[800px] mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent-primary)' }}>
            What we do
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            A full YouTube team.{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Without the full-time hire.</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Every service is designed to remove you from the production process — so you can focus on your business while your YouTube channel grows on autopilot.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {DETAILED_SERVICES.map(({ icon: Icon, name, tagline, bullets }) => (
            <div
              key={name}
              className="p-8 rounded-2xl"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(112,59,255,0.1)' }}
              >
                <Icon size={22} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
              >
                {name}
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--accent-primary)' }}>{tagline}</p>
              <ul className="space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-1 shrink-0 text-xs" style={{ color: 'var(--accent-primary)' }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            Ready to get started?
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Book a free strategy call. We&apos;ll assess your channel and tell you exactly how we&apos;d grow it.
          </p>
          <Button href={FORM_URL} size="lg">
            Book Your Free Strategy Call
          </Button>
        </div>
      </section>
    </div>
  );
}
