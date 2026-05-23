import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import type { Database, MapPosition } from '@/types';

type VendorUpdate = Database['public']['Tables']['vendors']['Update'];

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

    if (!user || !isAdmin(user)) {
      return new Response('Unauthorized', { status: 403 });
    }

    const body = (await request.json()) as Partial<VendorUpdate> & {
      map_position?: MapPosition | null;
    };
    const { map_position, ...otherFields } = body;

    // Use admin client to bypass RLS (createAdminClient is synchronous — no await).
    const admin = createAdminClient();

    // Build update object — narrowed to the table's Update shape.
    const updates: VendorUpdate = { ...otherFields };
    if (map_position !== undefined) {
      updates.map_position = map_position;
    }

    const { id: vendorId } = await params;
    const { data, error } = await admin
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
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
