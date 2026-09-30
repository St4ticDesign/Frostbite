const OWNER_ID = 3982553;

function json(data,status=200){ return Response.json(data,{status}); }

async function verifyOwner(apiKey) {
  const response = await fetch("https://api.torn.com/v2/key/info", {
    headers: { Authorization: `ApiKey ${apiKey}` },
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok || data?.error) return false;
  return Number(data?.info?.user?.id) === OWNER_ID;
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ok:false,error:"Database unavailable."},503);

    const body = await context.request.json();
    const apiKey = String(body?.apiKey || "").trim();
    const targetId = Number(body?.targetId);
    const role = String(body?.role || "");

    if (!apiKey || !(await verifyOwner(apiKey)))
      return json({ok:false,error:"Only the Frostbite owner can change Admin roles."},403);

    if (!Number.isInteger(targetId) || targetId <= 0 || targetId === OWNER_ID)
      return json({ok:false,error:"Invalid role target."},400);
    if (!["member","admin"].includes(role))
      return json({ok:false,error:"Invalid role."},400);

    const target = await context.env.DB.prepare(
      "SELECT torn_id, name FROM members WHERE torn_id = ?"
    ).bind(targetId).first();

    if (!target)
      return json({ok:false,error:"That member has not registered with Frostbite."},404);

    await context.env.DB.prepare(
      "UPDATE members SET role = ?, updated_at = unixepoch() WHERE torn_id = ?"
    ).bind(role,targetId).run();

    return json({ok:true,targetId,role,name:target.name});
  } catch {
    return json({ok:false,error:"Role update failed."},500);
  }
}
