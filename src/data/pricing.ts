// PLACEHOLDER DATA — replace with the real price sheet.
// Nothing in the takeoff is hardcoded to these values.
//
// Wall unit prices live on the SKU in catalog.ts, because they vary per SKU.
// What lives here are the coefficients that do not: the cap's price relative to
// the unit it caps, and the two bulk materials.

export type Pricing = {
  /** Caps are priced off the block they sit on, so this scales with the SKU. */
  capPriceFactor: number
  gravelPricePerTon: number
  adhesivePricePerTube: number
}

export const PRICING: Pricing = {
  capPriceFactor: 0.85,
  gravelPricePerTon: 42,
  adhesivePricePerTube: 9.5,
}
