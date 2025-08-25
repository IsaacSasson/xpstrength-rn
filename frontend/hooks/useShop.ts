// Path: /hooks/useShop.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { SHOP_THEMES } from "@/context/constants/themeConstants";
import { useUserProgress } from "@/context/UserProvider";

// DEV: your always-free base theme
const DEFAULT_FREE_THEME_ID = "purple_default";

type ThemeLike = {
  id: string;
  name?: string;
  price?: number;
  serverId?: number; // we’ll add these in Step 2
};

const THEMES: ThemeLike[] = Object.values(SHOP_THEMES) as unknown as ThemeLike[];

/* ------------------------------ Mapping ------------------------------ */
// Prefer explicit mapping via `serverId`. TEMP fallback: index in THEMES.
function themeIdFromServerId(serverId: number): string | null {
  const explicit = THEMES.find((t) => typeof t.serverId === "number" && t.serverId === serverId);
  if (explicit) return explicit.id;
  const fallback = THEMES[serverId];
  return fallback?.id ?? null;
}
function serverIdFromThemeId(themeId: string): number | null {
  const t = THEMES.find((x) => x.id === themeId);
  if (!t) return null;
  if (typeof t.serverId === "number") return t.serverId;
  const idx = THEMES.findIndex((x) => x.id === themeId);
  return idx >= 0 ? idx : null;
}

/* ------------------------- Response helpers ------------------------- */
async function readJson(res: Response) {
  let body: any = null;
  try {
    body = await res.json();
  } catch {}
  return body;
}

function extractCoins(body: any): number {
  if (typeof body === "number") return Number(body) || 0;
  const keys = ["data", "coins", "total", "value", "amount", "balance"];
  for (const k of keys) {
    const v = body?.[k];
    if (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function extractIdArray(body: any): number[] {
  if (Array.isArray(body)) {
    return body.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }
  const keys = ["data", "ids", "purchases", "items", "unlocks", "unlockIds", "themeIds"];
  for (const k of keys) {
    const v = body?.[k];
    if (Array.isArray(v)) {
      return v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    }
  }
  return [];
}

function errorFrom(body: any, fallback: string): Error {
  const msg = body?.error || body?.message || fallback;
  const code = body?.code;
  const err = new Error(msg);
  (err as any).code = code;
  return err;
}

/* -------------------------------- Hook ------------------------------ */
export function useShop() {
  const { currency, addCurrency } = useUserProgress();

  const [coins, setCoins] = useState<number | null>(null);
  const [ownedThemes, setOwnedThemes] = useState<string[]>([DEFAULT_FREE_THEME_ID]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const syncCoinsIntoUserContext = useCallback((serverCoins: number) => {
    // Keep UserProvider.currency in sync by applying the delta
    const delta = serverCoins - (currency || 0);
    if (delta !== 0) addCurrency(delta);
    setCoins(serverCoins);
  }, [currency, addCurrency]);

  const fetchCoins = useCallback(async () => {
    const res = await api.get("/api/v1/shop/coins");
    const body = await readJson(res);
    if (!res.ok) throw errorFrom(body, "Failed to fetch coins.");
    const value = extractCoins(body);
    syncCoinsIntoUserContext(value);
    return value;
  }, [syncCoinsIntoUserContext]);

  const fetchPurchases = useCallback(async () => {
    const res = await api.get("/api/v1/shop/purchases");
    const body = await readJson(res);
    if (!res.ok) throw errorFrom(body, "Failed to fetch purchases.");

    const ids = extractIdArray(body);
    const mapped = ids
      .map((pid) => themeIdFromServerId(pid))
      .filter((x): x is string => Boolean(x));

    // Always include the default free theme
    const unique = Array.from(new Set<string>([...mapped, DEFAULT_FREE_THEME_ID]));
    setOwnedThemes(unique);
    return unique;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCoins(), fetchPurchases()]);
    } catch (e: any) {
      setError(e?.message || "Failed to refresh shop data.");
    } finally {
      setLoading(false);
    }
  }, [fetchCoins, fetchPurchases]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Buy a theme. We rely on the server to validate funds and deduct coins.
   * If server returns `INSUFFICIENT_FUNDS`, we surface that error and do not highlight.
   */
  const buyTheme = useCallback(
    async (themeId: string) => {
      setError(null);

      if (ownedThemes.includes(themeId)) return true;
      if (themeId === DEFAULT_FREE_THEME_ID) return true;

      const itemId = serverIdFromThemeId(themeId);
      if (itemId == null) {
        throw new Error("Theme → backend item mapping missing. Add `serverId` in SHOP_THEMES.");
      }

      const res = await api.post("/api/v1/shop/purchase", { data: { itemId } });
      const body = await readJson(res);

      if (!res.ok) {
        const err = errorFrom(body, "Purchase failed.");
        // Special-case insufficient funds: keep UI from highlighting
        if ((err as any).code === "INSUFFICIENT_FUNDS") {
          throw err;
        }
        throw err;
      }

      // Updated unlock IDs may be in this response; if not, we refetch
      const updatedIds = extractIdArray(body);
      if (updatedIds.length) {
        const mapped = updatedIds
          .map((pid) => themeIdFromServerId(pid))
          .filter((x): x is string => Boolean(x));
        const unique = Array.from(new Set<string>([...mapped, DEFAULT_FREE_THEME_ID]));
        setOwnedThemes(unique);
      } else {
        await fetchPurchases();
      }

      // Re-pull coins from server to sync
      await fetchCoins();
      return true;
    },
    [ownedThemes, fetchPurchases, fetchCoins]
  );

  /**
   * Grant coins via backend (for your “Get 500” button).
   * You need a server route for persistence. Proposed:
   *   POST /api/v1/shop/grant-coins  { data: { amount: number } }
   * Response should include the new total in data or coins.
   */
  const grantCoins = useCallback(async (amount: number) => {
    setError(null);
    const res = await api.post("/api/v1/shop/grant-coins", { data: { amount } });
    const body = await readJson(res);
    if (!res.ok) {
      // If backend doesn’t have this route yet, tell the user clearly
      const err = errorFrom(body, "Failed to grant coins.");
      throw err;
    }
    const newTotal = extractCoins(body);
    if (Number.isFinite(newTotal)) {
      syncCoinsIntoUserContext(newTotal);
    } else {
      // If server returns no new total, at least hard refresh coins
      await fetchCoins();
    }
  }, [fetchCoins, syncCoinsIntoUserContext]);

  return {
    coins,         // number | null (mirrors server)
    ownedThemes,   // string[]
    loading,
    error,

    refresh,       // () => Promise<void>
    buyTheme,      // (themeId: string) => Promise<boolean>
    grantCoins,    // (amount: number) => Promise<void>  // requires backend route
  };
}
