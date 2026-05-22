import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
};

const FAQS = [
  {
    q: 'When and where is the event?',
    a: 'Dates and the exact location are announced on the homepage each season. Bookmark this site or follow us on social for updates.',
  },
  {
    q: 'How much does it cost to attend?',
    a: 'Magic City Plant-A-Palooza is free to attend for everyone. Vendors set their own prices for plants and goods.',
  },
  {
    q: 'Is the event family- and dog-friendly?',
    a: 'Absolutely. Strollers, well-behaved dogs on leashes, and plant-curious kiddos are all welcome.',
  },
  {
    q: 'Is the venue accessible?',
    a: 'Yes. The grounds have paved or compacted pathways throughout, and accessible parking is available near the entrance. Reach out before the event if you need additional accommodations — we’re happy to help.',
  },
  {
    q: 'How do I become a vendor?',
    a: 'Head to the Apply page and fill out the application. Approved vendors get login access to a portal where they can manage their profile and event participation.',
  },
  {
    q: 'Can I sponsor the event?',
    a: 'We love sponsors. Email us at the organizer address listed on the homepage to talk through tiers and benefits.',
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-prose-narrow px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">Frequently Asked Questions</h1>
      <p className="mt-2 text-muted dark:text-sage-300">If your question isn’t answered below, drop us a line.</p>

      <div className="mt-10 divide-y divide-border dark:divide-sage-700">
        {FAQS.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex min-h-touch cursor-pointer items-center justify-between gap-4 font-medium text-ink dark:text-cream-50">
              {item.q}
              <span aria-hidden="true" className="text-sage-600 transition group-open:rotate-45 dark:text-sage-400">+</span>
            </summary>
            <p className="mt-2 text-muted dark:text-sage-300">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
