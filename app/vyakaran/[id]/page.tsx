import Link from "next/link";
import { conceptById } from "@/lib/content";
import GrammarRunner from "@/components/GrammarRunner";

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const concept = conceptById(id);

  if (!concept) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl" aria-hidden="true">
          🤷
        </div>
        <h1 className="text-2xl">Concept not found</h1>
        <p className="text-ink-soft">This grammar concept doesn&apos;t exist (yet).</p>
        <Link href="/vyakaran" className="rounded-full bg-peacock px-6 py-3 font-semibold text-on-accent">
          Back to grammar
        </Link>
      </div>
    );
  }

  return <GrammarRunner concept={concept} />;
}
