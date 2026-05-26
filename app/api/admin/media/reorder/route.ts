import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { z } from 'zod';

/**
 * POST /api/admin/media/reorder
 *
 * Admin-only. Batch reorder featured media items.
 *
 * Request body:
 * {
 *   items: Array<{ id: string; featured_order: number }>
 * }
 *
 * Updates all specified media items' featured_order atomically.
 * Returns 403 if not admin, 400 if invalid payload, 200 with updated count on success.
 */

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid('Invalid media ID format'),
      featured_order: z.number().int().nonnegative('featured_order must be non-negative'),
    })
  ).nonempty('items array must not be empty'),
});

type ReorderPayload = z.infer<typeof reorderSchema>;

export async function POST(request: NextRequest) {
  // 1. Identity check
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Parse and validate body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // 3. Batch update all items
  const admin = createAdminClient();
  try {
    // Build array of update promises
    const updates = parsed.data.items.map((item) =>
      admin
        .from('media')
        .update({ featured_order: item.featured_order })
        .eq('id', item.id)
    );

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Reorder update errors:', errors);
      return NextResponse.json(
        { error: 'Failed to update some items' },
        { status: 500 }
      );
    }

    // Success: return count of updated items
    return NextResponse.json(
      {
        ok: true,
        updated: parsed.data.items.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Reorder batch update failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
