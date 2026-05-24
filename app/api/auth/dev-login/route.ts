import { createServerClient } from '@/lib/supabase/server';

/**
 * Dev-only endpoint for passwordless sign-in without email verification.
 * Only works in development mode (NODE_ENV === 'development').
 *
 * POST /api/auth/dev-login
 * Body: { email: string }
 *
 * Returns auth session data on success.
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response(
      JSON.stringify({ error: 'Dev login only available in development mode' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = await createServerClient();

    // List all users and find by email
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Failed to list users:', listError);
      return new Response(
        JSON.stringify({ error: `Failed to list users: ${listError.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = allUsers?.users.find((u) => u.email === email);

    let userId: string;
    let newUser = false;

    if (user) {
      userId = user.id;
    } else {
      // Create new user with dev password
      const devPassword = 'dev-test-password-123';
      const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: devPassword,
        email_confirm: true, // Auto-confirm email for dev
      });

      if (createError) {
        console.error('Failed to create user:', {
          message: createError.message,
          status: (createError as any).status,
          code: (createError as any).code,
        });
        return new Response(
          JSON.stringify({
            error: `Failed to create user: ${createError.message}`,
            details: (createError as any).code,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      userId = newUserData!.user.id;
      newUser = true;

      // Auto-create a vendor profile for the new dev user so they have access
      const { error: vendorError } = await supabase.from('vendors').insert({
        name: `Dev User - ${email}`,
        email,
        user_id: userId,
        status: 'approved' as any,
        phone: null,
        category: null,
        website: null,
        instagram_handle: null,
        facebook_handle: null,
        tiktok_handle: null,
        description: null,
        logo_url: null,
        owner_photo_url: null,
        featured_photo_url: null,
        map_position: null,
        event_years: null,
      });

      if (vendorError) {
        console.warn('Failed to create dev vendor profile:', vendorError);
        // Don't fail the login, just warn
      }
    }

    // Return the dev password so client can sign in
    const devPassword = 'dev-test-password-123';

    return new Response(
      JSON.stringify({
        message: newUser ? 'User created' : 'User found',
        email,
        password: devPassword, // Client will use this to sign in
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Dev login error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Login failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
