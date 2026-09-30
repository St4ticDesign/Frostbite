const OWNER_ID = 3982553;

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) {
      return Response.json({ok:false,error:"Database unavailable."},{status:503});
    }

    const url = new URL(context.request.url);
    const id = Number(url.searchParams.get("memberId"));

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ok:false,error:"Invalid member."},{status:400});
    }

    const member = await context.env.DB
      .prepare("SELECT torn_id FROM members WHERE torn_id = ?")
      .bind(id)
      .first();

    if (!member) {
      return Response.json({ok:false,error:"Member is not registered."},{status:404});
    }

    const { results } = await context.env.DB.prepare(`
      SELECT badge_key AS badgeKey,
             badge_tier AS badgeTier,
             earned_at AS earnedAt,
             source,
             details
      FROM achievements
      WHERE torn_id = ?
      ORDER BY earned_at DESC
    `).bind(id).all();

    const achievements = results || [];

    // Verified founding awards for St4TIC.
    // La Familia: 145 days in faction shown at award confirmation,
    // qualifying for the 90-day Silver tier.
    // Trader: Bazaar revenue $1,821,647,973, exceeding the $1B threshold.
    if (id === OWNER_ID) {
      const verifiedAt = 1790755200; // 30 Sep 2026 UTC

      if (!achievements.some(a => a.badgeKey === "la_familia")) {
        achievements.push({
          badgeKey: "la_familia",
          badgeTier: "silver",
          earnedAt: verifiedAt,
          source: "manual",
          details: "Verified at 145 days in Frostbite; Silver tier (90+ days)."
        });
      }

      if (!achievements.some(a => a.badgeKey === "trader")) {
        achievements.push({
          badgeKey: "trader",
          badgeTier: null,
          earnedAt: verifiedAt,
          source: "manual",
          metricValue: 1821647973,
          details: "Verified public Bazaar revenue: $1,821,647,973; Trader threshold: over $1,000,000,000."
        });
      }

      if (!achievements.some(a => a.badgeKey === "criminal")) {
        achievements.push({
          badgeKey: "criminal",
          badgeTier: null,
          earnedAt: verifiedAt,
          source: "manual",
          details: "Verified all-time OC analytics: 73 total scenarios, 63 successful scenarios."
        });
      }
    }

    return Response.json({ok:true,memberId:id,achievements});
  } catch {
    return Response.json(
      {ok:false,error:"Unable to load achievements."},
      {status:500}
    );
  }
}
