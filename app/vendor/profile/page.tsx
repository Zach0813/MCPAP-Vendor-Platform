import { createServerClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/vendor/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function VendorProfile() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle();

  // If no vendor found by user_id, try to link an imported vendor by email
  if (!vendor && user?.email) {
    const { data: importedVendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', user.email)
      .is('user_id', null) // Only unlinked vendors
      .maybeSingle();

    if (importedVendor) {
      // Link the vendor to this user
      const { data: linkedVendor } = await supabase
        .from('vendors')
        .update({ user_id: user.id })
        .eq('id', importedVendor.id)
        .select()
        .single();

      vendor = linkedVendor;
    }
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">My Profile</h1>
        <p className="mt-2 text-muted dark:text-sage-300">
          This is the information that appears on the public vendor map and directory.
        </p>
      </header>
      <ProfileForm initialValues={vendor ?? null} />
    </>
  );
}
