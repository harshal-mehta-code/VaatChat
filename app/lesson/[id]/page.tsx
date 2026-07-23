import Link from "next/link";
import { lessonById } from "@/lib/content";
import LessonRunner from "@/components/LessonRunner";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = lessonById(id);

  if (!lesson) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl" aria-hidden="true">
          🤷
        </div>
        <h1 className="text-2xl">Lesson not found</h1>
        <p className="text-ink-soft">This lesson doesn&apos;t exist (yet).</p>
        <Link href="/" className="rounded-full bg-marigold px-6 py-3 font-semibold text-on-accent">
          Back home
        </Link>
      </div>
    );
  }

  return <LessonRunner lesson={lesson} />;
}
