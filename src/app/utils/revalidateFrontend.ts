// Ping the storefront's on-demand revalidation route so a product / content
// change shows up immediately instead of waiting for ISR. Awaited (with a short
// timeout) so it still fires on serverless backends that would otherwise tear
// down before a fire-and-forget request is sent. Never throws — revalidation
// must not break the mutation that triggered it.
//
// Requires env: FRONTEND_URL (e.g. https://zoomxdigital.com) and
// REVALIDATE_SECRET (must match the frontend's REVALIDATE_SECRET).
export const revalidateFrontend = async (slug?: string): Promise<void> => {
  const url = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    // eslint-disable-next-line no-console
    console.warn(
      "[revalidateFrontend] skipped — FRONTEND_URL or REVALIDATE_SECRET not set"
    );
    return;
  }

  try {
    const params = new URLSearchParams({ secret });
    if (slug) params.set("slug", slug);

    const res = await fetch(`${url.replace(/\/$/, "")}/api/revalidate?${params}`, {
      method: "POST",
      // Don't let a slow/unreachable storefront hang the mutation response.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[revalidateFrontend] storefront responded ${res.status} — check REVALIDATE_SECRET matches`
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[revalidateFrontend] ping failed:", (err as Error)?.message);
  }
};
