import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { EventLocationSection } from '@/components/EventLocationSection';

function extractCityState(address: string | null | undefined): string {
  if (!address) return 'our plant party';
  // Extract city and state from address (e.g., "123 Main St, Birmingham, AL 35203" → "Birmingham, AL")
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    // City is typically at index 1, State at index 2
    return `${parts[1]!}, ${parts[2]!.split(' ')[0]}`;
  }
  return address;
}

// Generate dynamic metadata from current event
export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createServerClient();
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .order('year', { ascending: false })
      .limit(1)
      .single();

    const cityState = event?.address ? extractCityState(event.address) : 'our plant party';
    const description = `${cityState}'s biggest plant party. Vendors, workshops, music, food, and an outdoor garden marketplace.`;

    return {
      title: 'Magic City Plant-A-Palooza',
      description: description,
      openGraph: {
        title: 'Magic City Plant-A-Palooza',
        description: `${cityState}'s biggest plant party.`,
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Magic City Plant-A-Palooza',
        description: `${cityState}'s biggest plant party.`,
      },
    };
  } catch (error) {
    // Fallback metadata if database query fails
    return {
      title: 'Magic City Plant-A-Palooza',
      description: 'A plant vendor marketplace with local makers, workshops, music, food, and an outdoor garden celebration.',
    };
  }
}

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const locationDisplay = extractCityState(event?.address);

  return (
    <>
      <style>{`
        .hero-subtitle {
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        .hero-title {
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
        }
        .hero-description {
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
      `}</style>
      {/* HERO ------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* Featured carousel background */}
        <FeaturedCarousel />

        {/* Hero content overlay with dark gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/50" />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="hero-subtitle font-display text-lg uppercase tracking-widest text-cream-50 sm:text-xl md:text-2xl">
            {locationDisplay}
          </p>
          <h1 className="hero-title mt-4 font-display text-5xl font-semibold text-cream-50 sm:text-6xl md:text-7xl">
            Magic City Plant-A-Palooza
          </h1>
          <p className="hero-description mx-auto mt-6 max-w-prose-narrow text-lg text-cream-100">
            Local plant vendors, garden workshops, live music, food trucks, and the friendliest crowd of plant
            people you'll ever meet. Free to attend, family-friendly, and dog-approved.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/map"
              className="inline-flex min-h-touch items-center justify-center rounded-card bg-sage-700 px-6 font-medium text-cream-50 transition hover:bg-sage-800"
            >
              See the vendor map
            </Link>
            <Link
              href="/apply"
              className="inline-flex min-h-touch items-center justify-center rounded-card bg-sage-600 px-6 font-medium text-cream-50 transition hover:bg-sage-700"
            >
              Apply as a vendor
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK LINKS ----------------------------------------------------- */}
      <section className="bg-sage-50 py-16 dark:bg-sage-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="sr-only">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/map', title: 'Interactive map', body: 'Find every vendor by booth or category.' },
            { href: '/vendors', title: 'Vendor directory', body: 'Browse the full list of approved makers and growers.' },
            { href: '/gallery', title: 'Photo gallery', body: 'See past events and share your own snapshots.' },
            { href: '/feed', title: 'Social feed', body: 'Latest posts, tagged photos, and live updates.' },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col rounded-card border border-border bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:border-sage-300 hover:shadow-panel dark:bg-sage-900 dark:border-sage-700 dark:hover:border-sage-600"
            >
              <h3 className="font-display text-xl font-semibold text-sage-800 dark:text-cream-50">{card.title}</h3>
              <p className="mt-2 text-sm text-muted dark:text-sage-300">{card.body}</p>
              <span className="mt-4 text-sm font-medium text-terracotta-600 group-hover:underline dark:text-terracotta-400">
                Explore →
              </span>
            </Link>
          ))}
        </div>
        </div>
      </section>

      {/* CTA STRIP ------------------------------------------------------- */}
      <section className="bg-sage-800 text-cream-50 dark:bg-sage-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:flex-row sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-semibold">Want to vend with us?</h2>
            <p className="text-sage-100 dark:text-sage-200">
              Applications open seasonally. Tell us about your booth and we'll be in touch.
            </p>
          </div>
          <Link
            href="/apply"
            className="inline-flex min-h-touch items-center justify-center rounded-card bg-sage-600 px-6 font-medium text-cream-50 transition hover:bg-sage-700 dark:bg-sage-700 dark:hover:bg-sage-600"
          >
            Start your application
          </Link>
        </div>
      </section>

      {/* EVENT LOCATION ----------------------------------------------------- */}
      <EventLocationSection event={event} />
    </>
  );
}
