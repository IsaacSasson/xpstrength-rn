// path: /utils/handleApiError.ts
export async function handleApiError(res: Response) {
  let details: { error?: string; code?: string } = {};
  try {
    details = await res.json();
  } catch (_) {
    // non‑JSON response – just log status text
  }
  console.error(
    `API error ${res.status} (${details.code ?? 'UNKNOWN'}): ${details.error ?? res.statusText}`
  );
  return details;
}