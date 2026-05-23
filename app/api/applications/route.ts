import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { applicationSchema } from '@/lib/validation/application';

/**
 * POST /api/applications
 * Body: vendor application JSON (validated server-side with Zod).
 *
 * 1. Insert into vendor_applications (status=pending).
 * 2. Send confirmation email to applicant via Resend.
 * 3. Send notification email to ORGANIZER_EMAIL.
 *
 * Public — no auth required.
 */
// Photo URLs aren't part of the Zod schema (they're optional client-supplied
// uploads), so we narrow the raw payload with a small structural type instead
// of using `any`. The fields are still strings-or-undefined when present.
type PhotoFields = {
  logoUrl?: string | null;
  ownerPhotoUrl?: string | null;
  featuredPhotoUrl?: string | null;
};

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const photos = (payload && typeof payload === 'object' ? payload : {}) as PhotoFields;

  const supabase = createAdminClient();
  const { data: app, error } = await supabase
    .from('vendor_applications')
    .insert({
      vendor_name: parsed.data.vendorName,
      contact_name: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      business_description: parsed.data.businessDescription,
      category: parsed.data.category,
      website: parsed.data.website ?? null,
      social_links: parsed.data.socialLinks ?? {},
      logo_url: photos.logoUrl ?? null,
      owner_photo_url: photos.ownerPhotoUrl ?? null,
      featured_photo_url: photos.featuredPhotoUrl ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !app) {
    console.error('Failed to insert vendor application:', error);
    return NextResponse.json({ error: 'Could not save application' }, { status: 500 });
  }

  // Emails are non-fatal — log but don't block the success response if Resend fails.
  const resendKey = process.env.RESEND_API_KEY;
  const organizerEmail = process.env.ORGANIZER_EMAIL;
  if (resendKey && organizerEmail) {
    const resend = new Resend(resendKey);
    try {
      await Promise.all([
        resend.emails.send({
          from: `MCPAP <no-reply@${new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').hostname}>`,
          to: parsed.data.email,
          subject: 'We received your vendor application',
          text: `Hi ${parsed.data.contactName},\n\nThanks for applying to Magic City Plant-A-Palooza! We review applications within 2 weeks and will email you with a decision.\n\n— The MCPAP Team`,
        }),
        resend.emails.send({
          from: `MCPAP <no-reply@${new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').hostname}>`,
          to: organizerEmail,
          subject: `New vendor application: ${parsed.data.vendorName}`,
          text: `A new application has been submitted.\n\nReview it at ${process.env.NEXT_PUBLIC_SITE_URL}/admin/applications`,
        }),
      ]);
    } catch (emailErr) {
      console.error('Resend email failed (non-fatal):', emailErr);
    }
  }

  return NextResponse.json({ id: app.id, status: 'received' }, { status: 201 });
}
