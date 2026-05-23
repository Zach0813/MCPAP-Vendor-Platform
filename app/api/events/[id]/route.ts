import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import type { EventMapConfig, PinLocation, EventTimes, EventContactInfo } from "@/types";

type EventUpdateBody = {
  name?: string;
  location?: string;
  address?: string | null;
  date_start?: string;
  date_end?: string;
  pin_location?: PinLocation | null;
  event_times?: EventTimes | null;
  contact_info?: EventContactInfo | null;
  map_config?: EventMapConfig;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await request.json()) as EventUpdateBody;
    const {
      name,
      location,
      address,
      date_start,
      date_end,
      pin_location,
      event_times,
      contact_info,
      map_config,
    } = body;

    // Validate required fields
    if (!name || !location || !date_start || !date_end) {
      return Response.json(
        { error: "Missing required fields: name, location, date_start, date_end" },
        { status: 400 }
      );
    }

    // Use admin client for unrestricted update (createAdminClient is sync).
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("events")
      .update({
        name,
        location,
        address: address ?? null,
        date_start,
        date_end,
        pin_location: pin_location ?? null,
        event_times: event_times ?? null,
        contact_info: contact_info ?? null,
        ...(map_config && { map_config }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating event:", error);
      return Response.json(
        { error: error.message || "Failed to update event" },
        { status: 500 }
      );
    }

    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in PUT /api/events/[id]:", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
