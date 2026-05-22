import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import type { MapPosition } from '@/types';

/**
 * PUT /api/vendors/[id]
 * Update vendor details. Admin-only.
 * Body: { map_position?: MapPosition, ... other vendor fields }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return new Response('Unauthorized', { status: 403 });
    }

    const body = await request.json();
    const { map_position, ...otherFields } = body;

    // Use admin client to bypass RLS
    const admin = await createAdminClient();

    // Build update object
    const updates: any = { ...otherFields };
    if (map_position !== undefined) {
      updates.map_position = map_position;
    }

    const resolvedParams = await params;
    const { data, error } = await admin
      .from('vendors')
      .update(updates)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update vendor:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT /api/vendors/[id]:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
