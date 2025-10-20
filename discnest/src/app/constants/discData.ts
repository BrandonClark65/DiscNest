// src/constants/discData.ts

// — Brands —
// Not exhaustive, but covers many major disc manufacturers.  
// You can add more over time (e.g. specialty, boutique, secondary brands).
export const DiscBrands = [
  "Axiom",
  "DGA",
  "Discmania",
  "Discraft",
  "Dynamic Discs",
  "Gateway",
  "Infinite Discs",
  "Innova",
  "Kastaplast",
  "Latitude 64",
  "Legacy",
  "Mint Discs",
  "MVP",
  "Prodigy",
  "RPM",
  "Streamline",
  "Thought Space Athletics",
  "Westside Discs",
] as const;


export type DiscBrand = typeof DiscBrands[number];


// — Plastics —
// This is a curated list of common plastic blends across various brands,
// drawn from plastic-type guides and databases. :contentReference[oaicite:0]{index=0}
export const DiscPlastics = [
  "Baseline",
  "BioFuzion",
  "Blizzard Champion",
  "BT Hard",
  "BT Medium",
  "BT Soft",
  "Champion",
  "Classic",
  "Classic Soft",
  "Cryztal",
  "Cryztal FLX",
  "DX",
  "Echo Star",
  "Eclipse",
  "Electron",
  "Elite Z",
  "ESP",
  "ESP Glo",
  "Fission",
  "Fluid",
  "Frost",
  "Fuzion",
  "GStar",
  "Gateway",
  "Glow",
  "Gold Line",
  "Hybrid",
  "Jawbreaker",
  "K1 Glow-Line",
  "K1 Grind",
  "K1 Handler",
  "K1 Soft",
  "K3 Glow-Line",
  "K3 Hard",
  "K4",
  "KC Pro",
  "Lucid",
  "Metal Flake Champion",
  "Moonshine",
  "Neutron",
  "Opto",
  "Origio",
  "Plasma",
  "Premium",
  "Prime",
  "Proton",
  "R Pro",
  "Recycled",
  "Regrind",
  "Retro",
  "Ti",
  "Tournament",
  "VIP",
  "X",
  "XT Pro",
  "Z",
  "Z FLX",
  "Zero",
] as const;


export type DiscPlastic = typeof DiscPlastics[number];
