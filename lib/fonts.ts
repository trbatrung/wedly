import {
  Be_Vietnam_Pro,
  Cormorant_Garamond,
  Lora,
  Montserrat,
  Playfair_Display,
  Quicksand,
} from "next/font/google";

// Invitation typefaces. Every family ships full Vietnamese diacritics; script
// and decorative italic faces are deliberately excluded for legibility.
// Only the default family is preloaded; the others download when chosen.
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-be-vietnam",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-cormorant",
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  preload: false,
  variable: "--font-playfair",
});
const lora = Lora({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  preload: false,
  variable: "--font-lora",
});
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  preload: false,
  variable: "--font-montserrat",
});
const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  preload: false,
  variable: "--font-quicksand",
});
export const inviteFontVariables = [
  beVietnam,
  cormorant,
  playfair,
  lora,
  montserrat,
  quicksand,
]
  .map((font) => font.variable)
  .join(" ");
