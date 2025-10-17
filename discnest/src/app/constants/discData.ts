// src/constants/discData.ts

// — Brands —
// Not exhaustive, but covers many major disc manufacturers.  
// You can add more over time (e.g. specialty, boutique, secondary brands).
export const DiscBrands = [
  "Innova",
  "Discraft",
  "Dynamic Discs",
  "Latitude 64",
  "MVP",
  "Axiom",
  "Streamline",
  "Westside Discs",
  "Discmania",
  "Kastaplast",
  "Prodigy",
  "Gateway",
  "Legacy",
  "Mint Discs",
  "Thought Space Athletics",
  "DGA",
  "Infinite Discs",
  "RPM",
  // … add more as you discover / support
] as const;

export type DiscBrand = typeof DiscBrands[number];


// — Plastics —
// This is a curated list of common plastic blends across various brands,
// drawn from plastic-type guides and databases. :contentReference[oaicite:0]{index=0}
export const DiscPlastics = [
  // Innova / Champion family
  "DX",
  "Star",
  "Champion",
  "GStar",
  "Echo Star",
  "Metal Flake Champion",
  "Blizzard Champion",
  "KC Pro",
  "R Pro",
  "XT Pro",

  // Discraft
  "ESP",
  "Z",
  "Z FLX",
  "ESP Glo",
  "Elite Z",
  "Jawbreaker",
  "X",
  "Ti",
  "Cryztal FLX",
  "Cryztal",

  // Dynamic / Trilogy / related
  "Lucid",
  "Fuzion",
  "BioFuzion",
  "Classic",
  "Classic Soft",
  "Hybrid",
  "Fluid",
  "Prime",

  // MVP / Axiom / Streamline
  "Neutron",
  "Proton",
  "Plasma",
  "Fission",
  "Electron",
  "Eclipse",

  // Latitude 64 / Trilogy
  "Opto",
  "Gold Line",
  "Recycled",
  "Frost",
  "Zero",
  "Retro",

  // Westside
  "Tournament",
  "VIP",
  "Origio",
  "BT Hard",
  "BT Medium",
  "BT Soft",
  "Moonshine",

  // Others / general blends
  "Glow",
  "Regrind",
  "Premium",
  "Baseline",
] as const;

export type DiscPlastic = typeof DiscPlastics[number];
