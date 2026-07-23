import Link from "next/link";
import { SCENARIOS_BY_ID } from "@/lib/content";
import VaatPlayer from "@/components/VaatPlayer";

export default async function VaatScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = SCENARIOS_BY_ID[id];

  if (!scenario) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl" aria-hidden="true">
          🤷
        </div>
        <h1 className="text-2xl">Conversation not found</h1>
        <Link href="/vaat" className="rounded-full bg-marigold px-6 py-3 font-semibold text-on-accent">
          Back to Vaat Mode
        </Link>
      </div>
    );
  }

  return <VaatPlayer scenario={scenario} />;
}
