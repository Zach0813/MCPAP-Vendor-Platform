import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Verify admin auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return Response.json(
        { error: "Missing path parameter" },
        { status: 400 }
      );
    }

    // Revalidate the specified path
    revalidatePath(path);

    return Response.json(
      { message: `Revalidated ${path}` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in revalidate:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
