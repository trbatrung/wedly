import { Be_Vietnam_Pro } from "next/font/google";

// Guest-facing invitations: a legible sans-serif drawn for Vietnamese diacritics.
export const inviteFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});
