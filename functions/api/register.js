const FROSTBITE_FACTION_ID = 41234;
const OWNER_ID = 3982553;

function json(data, status = 200) {
  return Response.json(data, { status });
}

async function torn(path, apiKey) {
  const response = await fetch(`https://api.torn.com/v2/${path}`, {
    headers: { Authorization: `ApiKey ${apiKey}` },
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.error || data?.error?.message || "Torn verification failed.");
  }
  return data;
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ ok:false, error:"Database unavailable." },503);

    const body = await context.request.json();
    const apiKey = String(body?.apiKey || "").trim();
    if (!apiKey) return json({ok:false,error:"Torn API key required."},400);

    const keyInfo = await torn("key/info", apiKey);
    const tornId = Number(keyInfo?.info?.user?.id);
    const factionId = Number(keyInfo?.info?.user?.faction_id);
    const keyType = String(keyInfo?.info?.access?.type || "");

    if (!tornId) return json({ok:false,error:"Torn could not identify this API key."},403);
    if (keyType && keyType.toLowerCase() !== "limited access")
      return json({ok:false,error:"Please use a Limited Access API key."},403);
    if (factionId !== FROSTBITE_FACTION_ID)
      return json({ok:false,error:"This Torn account is not currently a Frostbite member."},403);

    const basic = await torn("user/basic", apiKey);
    const name = String(basic?.name || basic?.profile?.name || `Player ${tornId}`).slice(0,64);

    const existing = await context.env.DB.prepare(
      "SELECT role FROM members WHERE torn_id = ?"
    ).bind(tornId).first();

    const role = tornId === OWNER_ID ? "owner" :
      existing?.role === "admin" ? "admin" : "member";

    await context.env.DB.prepare(`
      INSERT INTO members
        (torn_id,name,role,faction_id,registered_at,last_seen_at,updated_at)
      VALUES (?,?,?,?,unixepoch(),unixepoch(),unixepoch())
      ON CONFLICT(torn_id) DO UPDATE SET
        name=excluded.name,
        role=?,
        faction_id=excluded.faction_id,
        last_seen_at=unixepoch(),
        updated_at=unixepoch()
    `).bind(tornId,name,role,factionId,role).run();

    return json({ok:true,member:{id:tornId,name,role,factionId}});
  } catch (error) {
    return json({ok:false,error:error?.message || "Registration sync failed."},500);
  }
}
