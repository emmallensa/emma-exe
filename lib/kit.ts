const BASE = process.env.KIT_API_BASE || "https://api.kit.com/v4";

function headers() {
  const k = process.env.KIT_API_KEY;
  if (!k) throw new Error("Falta KIT_API_KEY");
  return { "X-Kit-Api-Key": k, "Content-Type": "application/json", Accept: "application/json" };
}

export type KitSub = { id: number; first_name: string | null; email_address: string };
export type KitTag = { id: number; name: string; tagged_at: string };

export async function findSubscriber(email: string): Promise<KitSub | null> {
  const r = await fetch(`${BASE}/subscribers?email_address=${encodeURIComponent(email)}&status=all`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Kit ${r.status}`);
  const j = await r.json();
  return j.subscribers?.[0] ?? null;
}

export async function subscriberTags(id: number): Promise<KitTag[]> {
  const out: KitTag[] = [];
  let after = "";
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${BASE}/subscribers/${id}/tags?per_page=500${after ? `&after=${after}` : ""}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Kit ${r.status}`);
    const j = await r.json();
    out.push(...(j.tags ?? []));
    if (!j.pagination?.has_next_page) break;
    after = j.pagination.end_cursor;
  }
  return out;
}

/** Tags a subscriber by email (creates the subscriber if needed). Never throws. */
export async function tagByEmail(tagId: number, email: string) {
  try {
    let r = await fetch(`${BASE}/tags/${tagId}/subscribers`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email_address: email }),
    });
    if (r.status === 404 || r.status === 422) {
      // Not in Kit yet: create it, then tag.
      await fetch(`${BASE}/subscribers`, { method: "POST", headers: headers(), body: JSON.stringify({ email_address: email }) });
      r = await fetch(`${BASE}/tags/${tagId}/subscribers`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ email_address: email }),
      });
    }
    if (!r.ok) console.error("Kit tag", tagId, r.status, await r.text());
  } catch (e) {
    console.error("Kit tag", tagId, e);
  }
}

