/** Shared checkout/order total math (client + server safe). */

export interface ShippingZoneLike {
  name: string;
  states: string[];
  flat_rate: number;
  free_above: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface OrderTotalsResult {
  shippingFee: number;
  taxAmount: number;
  total: number;
  discountAmount: number;
  zone: ShippingZoneLike | null;
}

export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function normalizeState(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Match customer state to an active shipping zone.
 * Prefer an explicit state match, then empty-states (All India), then first active zone.
 */
export function matchShippingZone(
  zones: ShippingZoneLike[],
  state: string | null | undefined
): ShippingZoneLike | null {
  const active = [...zones]
    .filter((zone) => zone.is_active)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });

  if (active.length === 0) {
    return null;
  }

  const normalized = normalizeState(state);

  if (normalized) {
    const stateMatch = active.find((zone) =>
      zone.states.some((entry) => normalizeState(entry) === normalized)
    );
    if (stateMatch) {
      return stateMatch;
    }
  }

  const allIndia = active.find((zone) => zone.states.length === 0);
  if (allIndia) {
    return allIndia;
  }

  return active[0] ?? null;
}

export function computeShippingFee(
  zone: ShippingZoneLike | null,
  subtotal: number
): number {
  if (!zone) {
    return 0;
  }

  if (zone.free_above != null && subtotal >= Number(zone.free_above)) {
    return 0;
  }

  return roundMoney(Number(zone.flat_rate));
}

/** Tax is a percent of merchandise subtotal (not shipping). */
export function computeTaxAmount(
  subtotal: number,
  taxRatePercent: number
): number {
  const rate = Number(taxRatePercent);
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }
  return roundMoney((subtotal * rate) / 100);
}

export function computeOrderTotals(input: {
  subtotal: number;
  taxRatePercent: number;
  zones: ShippingZoneLike[];
  state?: string | null;
  /** Merchandise discount (coupon); capped at subtotal. */
  discountAmount?: number;
}): OrderTotalsResult {
  const discountAmount = roundMoney(
    Math.min(
      Math.max(0, Number(input.discountAmount ?? 0)),
      Math.max(0, Number(input.subtotal))
    )
  );
  const taxableSubtotal = roundMoney(
    Math.max(0, Number(input.subtotal) - discountAmount)
  );
  const zone = matchShippingZone(input.zones, input.state);
  // Free-shipping threshold uses post-discount merchandise (payable goods).
  const shippingFee = computeShippingFee(zone, taxableSubtotal);
  const taxAmount = computeTaxAmount(taxableSubtotal, input.taxRatePercent);
  const total = roundMoney(taxableSubtotal + shippingFee + taxAmount);

  return { shippingFee, taxAmount, total, discountAmount, zone };
}

/** Reconstruct tax from stored order amounts when no tax column exists. */
export function taxFromOrderAmounts(input: {
  subtotal: number;
  shippingFee: number;
  total: number;
  discountAmount?: number;
}): number {
  const discount = roundMoney(Math.max(0, Number(input.discountAmount ?? 0)));
  return roundMoney(
    Math.max(
      0,
      Number(input.total) -
        (Number(input.subtotal) - discount) -
        Number(input.shippingFee)
    )
  );
}
