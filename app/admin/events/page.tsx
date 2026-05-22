import { createServerClient } from "@/lib/supabase/server";
import { EventEditor } from "@/components/admin/EventEditor";
import { getCurrentEvent } from "@/lib/data/events";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <div>
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-sage-900">Event Configuration</h1>
          <p className="mt-2 text-muted">Edit event details and map settings.</p>
        </header>
        <p className="rounded-card border border-sage-300 bg-sage-50 p-4 text-sage-700">
          No event found for the current year. Create one in Supabase before editing.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-sage-900">Event Configuration</h1>
        <p className="mt-2 text-muted">
          Edit {event.name} ({event.year}) — location, dates, and vendor map settings.
        </p>
      </header>
      <EventEditor event={event} />
    </div>
  );
}
