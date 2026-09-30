const OWNER_ID = 3982553;

function json(data,status=200){ return Response.json(data,{status}); }

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ok:false,error:"Database unavailable."},503);

    const body = await context.request.json();
    const actorId = Number(body?.actorId);
    const targetId = Number(body?.targetId);
    const role = String(body?.role || "");

    if (actorId !== OWNER_ID) return json({ok:false,error:"Only the Frostbite owner can change Admin roles."},403);
    if (!Number.isInteger(targetId) || targetId <= 0 || targetId === OWNER_ID)
      return json({ok:false,error:"Invalid role target."},400);
    if (!["member","admin"].includes(role))
      return json({ok:false,error:"Invalid role."},400);

    const target = await context.env.DB.prepare(
      "SELECT torn_id FROM members WHERE torn_id = ?"
    ).bind(targetId).first();

    if (!target) return json({ok:false,error:"That member is not registered with Frostbite."},404);

    await context.env.DB.prepare(
      "UPDATE members SET role = ?, updated_at = unixepoch() WHERE torn_id = ?"
    ).bind(role,targetId).run();

    return json({ok:true,targetId,role});
  } catch {
    return json({ok:false,error:"Role update failed."},500);
  }
}
