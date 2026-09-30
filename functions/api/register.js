const FROSTBITE_FACTION_ID = 41234;
const OWNER_ID = 3982553;

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ ok:false, error:"Database unavailable." },503);

    const body = await context.request.json();
    const tornId = Number(body?.tornId);
    const name = String(body?.name || "").trim().slice(0,64);
    const factionId = Number(body?.factionId);
    const daysInFaction = Math.max(0, Number(body?.daysInFaction || 0));

    if (!Number.isInteger(tornId) || tornId <= 0 || !name) {
      return json({ ok:false, error:"Invalid member data." },400);
    }
    if (factionId !== FROSTBITE_FACTION_ID) {
      return json({ ok:false, error:"Frostbite membership required." },403);
    }

    const existing = await context.env.DB.prepare(
      "SELECT role FROM members WHERE torn_id = ?"
    ).bind(tornId).first();

    const role = tornId === OWNER_ID ? "owner" :
      existing?.role === "admin" ? "admin" : "member";

    await context.env.DB.prepare(`
      INSERT INTO members
        (torn_id,name,role,faction_id,days_in_faction,registered_at,last_seen_at,updated_at)
      VALUES (?,?,?,?,?,unixepoch(),unixepoch(),unixepoch())
      ON CONFLICT(torn_id) DO UPDATE SET
        name=excluded.name,
        role=?,
        faction_id=excluded.faction_id,
        days_in_faction=MAX(members.days_in_faction, excluded.days_in_faction),
        last_seen_at=unixepoch(),
        updated_at=unixepoch()
    `).bind(tornId,name,role,factionId,daysInFaction,role).run();

    return json({ok:true,member:{id:tornId,name,role,factionId,daysInFaction}});
  } catch {
    return json({ok:false,error:"Registration sync failed."},500);
  }
}
