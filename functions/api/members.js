const OWNER_ID = 3982553;

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return Response.json({ok:false,error:"Database unavailable."},{status:503});

    const { results } = await context.env.DB.prepare(`
      SELECT torn_id AS id, name, role, faction_id AS factionId,
             days_in_faction AS daysInFaction, registered_at AS registeredAt,
             last_seen_at AS lastSeenAt, updated_at AS updatedAt
      FROM members
      ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
               name COLLATE NOCASE
    `).all();

    const members = (results || []).map(m => ({
      ...m,
      role: Number(m.id) === OWNER_ID ? "owner" : m.role
    }));

    return Response.json({ok:true,members});
  } catch {
    return Response.json({ok:false,error:"Unable to load registered members."},{status:500});
  }
}
