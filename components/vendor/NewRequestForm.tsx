'use client';

import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';
import { REQUEST_TYPE, type RequestType, type Event } from '@/types';

export function NewRequestForm({ vendorId }: { vendorId: string | null }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [type, setType] = useState<RequestType>('participation');
  const [eventId, setEventId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    void supabase
      .from('events')
      .select('*')
      .order('year', { ascending: false })
      .then(({ data }) => {
        setEvents(data ?? []);
        if (data && data[0]) setEventId(data[0].id);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) {
      setMsg({ kind: 'err', text: 'Your vendor profile must be approved before submitting requests.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.from('event_requests').insert({
        vendor_id: vendorId,
        event_id: eventId,
        type,
        message: message || null,
      });
      if (error) throw error;
      setMsg({ kind: 'ok', text: 'Request submitted.' });
      setMessage('');
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="req-type" className="text-sm font-medium text-ink dark:text-cream-50">Type</label>
        <select
          id="req-type"
          value={type}
          onChange={(e) => setType(e.target.value as RequestType)}
          className="min-h-touch rounded-card border border-border bg-surface px-3 text-ink dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700"
        >
          {REQUEST_TYPE.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="req-event" className="text-sm font-medium text-ink dark:text-cream-50">Event</label>
        <select
          id="req-event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="min-h-touch rounded-card border border-border bg-surface px-3 text-ink dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700"
          required
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
      </div>
      <Textarea
        label="Message"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {msg ? (
        <p
          role="alert"
          className={msg.kind === 'ok' ? 'text-sm text-sage-800 dark:text-sage-200' : 'text-sm text-terracotta-700 dark:text-terracotta-400'}
        >
          {msg.text}
        </p>
      ) : null}
      <Button type="submit" loading={submitting} disabled={!vendorId}>
        Submit request
      </Button>
    </form>
  );
}
