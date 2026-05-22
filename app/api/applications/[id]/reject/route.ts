import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';

/**
 * POST /api/applications/:id/reject
 * Admin-only. Marks the application as rejected and emails the applicant.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: app } = await admin
    .from('vendor_applications')
    .select('*')
    .eq('id', id)
    .single();
  if (!app) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await admin
    .from('vendor_applications')
    .update({ status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: `MCPAP <no-reply@${new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').hostname}>`,
        to: app.email,
        subject: 'Magic City Plant-A-Palooza — application update',
        text: `Hi ${app.contact_name},\n\nThanks for your interest in Magic City Plant-A-Palooza. After review, we're unable to offer you a vendor spot at this time.\n\nWe truly appreciate you applying and hope to see you in future seasons.\n\n— The MCPAP Team`,
      });
    } catch (err) {
      console.error('Rejection email failed:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
