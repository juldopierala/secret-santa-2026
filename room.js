function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function validRoomId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{3,35}$/.test(value);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const room = url.searchParams.get("room") || "";
  if (!validRoomId(room)) return json({ error: "Invalid room id" }, 400);
  if (!env.DB) return json({ error: "D1 binding DB is missing" }, 500);

  try {
    const row = await env.DB.prepare(
      "SELECT data FROM rooms WHERE room_id = ?1"
    ).bind(room).first();
    if (!row) return json({ error: "Room not found" }, 404);
    return new Response(row.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("D1 read failed", error);
    return json({ error: "Shared storage unavailable" }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  const url = new URL(request.url);
  const room = url.searchParams.get("room") || "";
  if (!validRoomId(room)) return json({ error: "Invalid room id" }, 400);
  if (!env.DB) return json({ error: "D1 binding DB is missing" }, 500);

  try {
    const data = await request.json();
    if (
      !data || typeof data !== "object" || Array.isArray(data) ||
      data.roomId !== room || !data.assignments || !data.drawn || !data.pins
    ) {
      return json({ error: "Invalid room data" }, 400);
    }

    const serialized = JSON.stringify(data);
    await env.DB.prepare(
      `INSERT INTO rooms (room_id, data, updated_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(room_id) DO UPDATE SET
         data = excluded.data,
         updated_at = excluded.updated_at`
    ).bind(room, serialized, Number(data.updatedAt) || Date.now()).run();

    return json({ ok: true, updatedAt: Number(data.updatedAt) || Date.now() });
  } catch (error) {
    console.error("D1 write failed", error);
    return json({ error: "Shared storage unavailable" }, 500);
  }
}

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "PUT") {
    return json({ error: "Method not allowed" }, 405);
  }
  return json({ error: "Method not allowed" }, 405);
}
