// ─────────────────────────────────────────────────────────────────────────
// Onboarding options.
// ─────────────────────────────────────────────────────────────────────────

/** Onboarding "why are you here?" — tunes tone/content later; primary target
 *  is the zero-exposure beginner, so options are welcoming to a blank slate. */
export const MOTIVATIONS: { id: string; emoji: string; label: string; blurb: string }[] = [
  { id: "family", emoji: "👨‍👩‍👧", label: "Talk to family", blurb: "Chat with relatives who speak Gujarati." },
  { id: "partner", emoji: "💍", label: "Marrying in", blurb: "Connect with your partner's family & culture." },
  { id: "kids", emoji: "🧒", label: "For my kids", blurb: "Pass the language on to the next generation." },
  { id: "roots", emoji: "🪔", label: "Roots & devotion", blurb: "Festivals, bhajans, and heritage." },
  { id: "travel", emoji: "✈️", label: "Travel & business", blurb: "Get around Gujarat with confidence." },
  { id: "curious", emoji: "✨", label: "Just curious", blurb: "A beautiful language — why not!" },
];

/** Suggested starter goals; the learner can also type their own. */
export const GOAL_SUGGESTIONS: string[] = [
  "Hold a 2-minute chat with Ba",
  "Order a full thali in Gujarati",
  "Greet my partner's family at dinner",
  "Read my first Gujarati word",
  "Send a voice note to the family group",
];
