export async function onRequestGet(context) {
  try {
    if (!context.env.DB) {
      return Response.json(
        { ok: false, service: "frostbite", database: "unbound" },
        { status: 503 }
      );
    }

    const result = await context.env.DB
      .prepare("SELECT 1 AS ready")
      .first();

    return Response.json({
      ok: result?.ready === 1,
      service: "frostbite",
      database: "d1"
    });
  } catch (error) {
    return Response.json(
      { ok: false, service: "frostbite", error: "database_unavailable" },
      { status: 500 }
    );
  }
}
