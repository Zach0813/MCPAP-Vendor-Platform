import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';

/**
 * POST /api/applications/:id/approve
 *
 * Admin-only. Steps:
 *  1. Verify caller is admin (server-side check, can't be spoofed from the client).
 *  2. Update application status to 'approved' — the `sync_approved_application_to_vendor`
 *     trigger (migration 0002) creates or updates the matching `vendors` row by email.
 *  3. Create or fetch the auth.users row for the applicant's email
 *     (this is what `inviteUserByEmail` is for).
 *  4. UPDATE the trigger-created vendors row to set `user_id` (so RLS lets the
 *     applicant edit their own profile). We don't INSERT here — that would
 *     duplicate the row created by the trigger.
 *  5. Send approval email with a magic link via Resend.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: applicationId } = await context.params;

  // Identity check
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch application
  const { data: app, error: fetchErr } = await admin
    .from('vendor_applications')
    .select('*')
    .eq('id', applicationId)
    .single();
  if (fetchErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (app.status !== 'pending') {
    return NextResponse.json({ error: 'Application already decided' }, { status: 409 });
  }

  // 2. Mark application approved
  await admin
    .from('vendor_applications')
    .update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
    .eq('id', applicationId);

  // 3. Create or fetch auth user for this email (idempotent via inviteUserByEmail)
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(app.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/vendor/dashboard`,
  });
  // It's fine if user already exists — we just want their id.
  let userId: string | null = invited?.user?.id ?? null;
  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email === app.email)?.id ?? null;
  }

  // 4. Link the vendor row (created by the 0002 trigger) to the auth user.
  // The trigger already synced name/description/category/etc. from the application.
  // All we need to add here is the user_id binding so RLS lets them edit their profile.
  if (userId) {
    const { error: linkErr } = await admin
      .from('vendors')
      .update({ user_id: userId })
      .eq('email', app.email);
    if (linkErr) {
      console.error('Could not link vendor.user_id (non-fatal):', linkErr);
    }
  }

  // 5. Send approval email (non-fatal if it fails)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: `MCPAP <no-reply@${new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').hostname}>`,
        to: app.email,
        subject: 'You’re approved! Welcome to Magic City Plant-A-Palooza',
        text: `Hi ${app.contact_name},\n\nGreat news — your vendor application has been approved! Sign in to your portal here:\n\n${process.env.NEXT_PUBLIC_SITE_URL}/login\n\nWe just sent you a magic-link invitation; one click and you're in.\n\n— The MCPAP Team`,
      });
    } catch (err) {
      console.error('Approval email failed:', err);
    }
  }

  if (inviteErr && !inviteErr.message.includes('already')) {
    console.error('inviteUserByEmail error:', inviteErr);
  }

  return NextResponse.json({ ok: true });
}
