/**
 * Server-side data accessors for the events table.
 * Use these from Server Components — they go through RLS as the current user.
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Event } from '@/types';

/**
 * Fetch the current year's event.
 * For now, we assume there's only one active event per year.
 * Returns null if no event found.
 */
export async function getCurrentEvent(): Promise<Event | null> {
  const supabase = await createServerClient();
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('year', currentYear)
    .single();

  if (error) {
    console.error('getCurrentEvent:', error);
    return null;
  }
  return (data ?? null) as Event | null;
}

/**
 * Fetch all events, ordered by year descending (newest first).
 */
export async function getAllEvents(): Promise<Event[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('year', { ascending: false });

  if (error) {
    console.error('getAllEvents:', error);
    return [];
  }
  return (data ?? []) as Event[];
}
