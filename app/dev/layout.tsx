import type { Metadata } from "next";

// Internal authoring tools. Unlisted, never indexed — but deliberately NOT
// gated on NODE_ENV, because the whole point is to open them on an iPad from
// the deployed branch URL and author with a Pencil.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
