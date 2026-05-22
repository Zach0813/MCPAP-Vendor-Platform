import { createServerClient } from '@/lib/supabase/server';
import { RequestList } from '@/components/vendor/RequestList';
import { NewRequestForm } from '@/components/vendor/NewRequestForm';

export const dynamic = 'force-dynamic';

export default async function VendorRequests() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle();

  const { data: requests } = vendor
    ? await supabase
        .from('event_requests')
        .select('*, events(year,name)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">Event Requests</h1>
        <p className="mt-2 text-muted dark:text-sage-300">
          Submit a request to participate in a future event, cancel your booth, or change details.
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl font-semibold text-sage-900 dark:text-cream-50">New request</h2>
          <NewRequestForm vendorId={vendor?.id ?? null} />
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-sage-900 dark:text-cream-50">My requests</h2>
          <RequestList requests={requests ?? []} />
        </section>
      </div>
    </>
  );
}
