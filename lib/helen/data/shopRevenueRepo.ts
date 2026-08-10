import { readJSON, writeJSON } from "./storage";

const KEY = "helen-shop-revenue";

/** Mock global total of everything ever spent in the Shop (EUR), mirrored
 *  into the Impact Fund total alongside membership revenue — see
 *  app/home/impact/page.tsx. Same per-browser caveat as globalRepo's
 *  member count until this moves to Supabase. */
export function getShopRevenue(): number {
  return readJSON<number>(KEY) ?? 0;
}

export function addShopRevenue(amountEur: number): void {
  writeJSON(KEY, getShopRevenue() + amountEur);
}
