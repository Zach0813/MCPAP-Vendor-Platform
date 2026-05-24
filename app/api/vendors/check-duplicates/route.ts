import { createServerClient } from '@/lib/supabase/server';

/**
 * Server-side endpoint to check for duplicate vendors
 * Uses admin client to bypass RLS and see all vendors
 */
export async function POST(request: Request) {
  try {
    const { vendors } = await request.json();

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return new Response(
        JSON.stringify({ duplicates: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use server-side Supabase client (has full access)
    const supabase = await createServerClient();

    // Fetch ALL vendors with admin access (no RLS restrictions)
    const { data: allVendors, error } = await supabase
      .from('vendors')
      .select('id, name, email, phone');

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!allVendors || allVendors.length === 0) {
      return new Response(
        JSON.stringify({ duplicates: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build lookup maps (same logic as client-side, but with full data)
    const nameMap = new Map(
      allVendors
        .filter((v) => v.name?.trim())
        .map((v) => [v.name!.toLowerCase(), v])
    );
    const emailMap = new Map(
      allVendors
        .filter((v) => v.email?.trim())
        .map((v) => [v.email!.toLowerCase(), v])
    );
    const phoneMap = new Map(
      allVendors
        .filter((v) => v.phone?.trim())
        .map((v) => [v.phone!.toLowerCase(), v])
    );

    // Check each vendor for duplicates
    const duplicates = vendors
      .map((vendor, index) => {
        const nameLower = vendor.name?.toLowerCase();
        const emailLower = vendor.email?.toLowerCase();
        const phoneLower = vendor.phone?.toLowerCase();

        const existingByName = nameMap.get(nameLower);
        const existingByEmail = emailLower ? emailMap.get(emailLower) : null;
        const existingByPhone = phoneLower ? phoneMap.get(phoneLower) : null;

        const existing = existingByName || existingByEmail || existingByPhone;

        if (existing) {
          return {
            index,
            vendor,
            existingId: existing.id,
            matchType: existingByName ? 'name' : existingByEmail ? 'email' : 'phone',
          };
        }

        return null;
      })
      .filter((d) => d !== null);

    return new Response(
      JSON.stringify({ duplicates }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Duplicate check error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Check failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
