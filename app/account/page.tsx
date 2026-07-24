"use client";

// Account & sync.
//
// Deliberately not a gate. Nothing in the app is behind this page — you can
// learn Gujarati for a month without ever opening it. It exists for one
// concrete promise: the same progress on your phone and your iPad, and a way
// back if you lose a device.
//
// Magic link rather than a password, because a password is one more thing to
// forget in an app whose whole point is not making you feel bad.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/client/useProgress";
import { masteredCount } from "@/lib/core/progress";

export default function AccountPage() {
  const { progress, hydrated, sync } = useProgress();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // A failed link exchange comes back as ?error=... or #error=... and otherwise
  // just dumps you on the sign-in form with no explanation of why.
  useEffect(() => {
    const from = (s: string) => new URLSearchParams(s.replace(/^[?#]/, ""));
    const params = from(window.location.search);
    const hash = from(window.location.hash);
    const description = params.get("error_description") ?? hash.get("error_description");
    const code_ = params.get("error") ?? hash.get("error");
    if (description || code_) {
      setNotice({
        ok: false,
        message: `${description ?? code_}. If that link was requested on another device, ask for a fresh one right here instead — a link only works where it was requested.`,
      });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    const result = await sync.sendMagicLink(email.trim());
    setNotice(result);

    setSending(false);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || verifying) return;
    setVerifying(true);
    setNotice(await sync.verifyCode(email.trim(), code));
    setVerifying(false);
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="text-2xl">Your progress</h1>
      </div>

      {/* What there is to protect — concrete, not abstract. */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">On this device</span>
          <span className="text-xs text-ink-soft">
            {progress.streak.count > 0 && `🔥 ${progress.streak.count} · `}⭐ {progress.xp} XP
          </span>
        </div>
        <p className="mt-1 text-lg text-ink">
          <span className="font-semibold text-marigold">{masteredCount(progress)}</span> things you
          know · <span className="font-semibold">{progress.completedLessons.length}</span> lessons
          done
        </p>
      </div>

      {sync.status === "off" ? (
        <p className="text-sm text-ink-soft">
          Cloud sync isn&apos;t configured for this build. Everything still works — your progress
          lives on this device.
        </p>
      ) : sync.email ? (
        <>
          <div className="rounded-2xl border border-good/40 bg-good/10 p-4">
            <p className="text-sm font-semibold text-ink">Synced to {sync.email}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {sync.status === "syncing"
                ? "Syncing…"
                : sync.status === "error"
                  ? `Couldn't sync: ${sync.error}`
                  : sync.lastSyncedAt
                    ? `Last synced ${sync.lastSyncedAt.toLocaleTimeString()}. Open VaatChat on another device and sign in with the same email — your progress follows.`
                    : "Ready."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void sync.syncNow()}
              disabled={sync.status === "syncing"}
              className="flex-1 rounded-full border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink disabled:opacity-50"
            >
              Sync now
            </button>
            <button
              type="button"
              onClick={() => void sync.signOut()}
              className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-medium text-ink-soft"
            >
              Sign out
            </button>
          </div>
          <p className="text-xs text-ink-soft">
            Signing out leaves your progress on this device — it doesn&apos;t delete anything.
          </p>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-base">Keep it across devices</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Practise on your phone, write on your iPad, and pick up where you left off. We send a
              link — no password to remember.
            </p>
            <p className="mt-2 rounded-xl border border-peacock/40 bg-peacock/10 px-3 py-2 text-xs text-ink">
              Ask for the link <span className="font-semibold">on the device you want to sign in
              on</span>, and open the email there. A link only works on the device that requested
              it — do this once per device and they all stay in step.
            </p>
            <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
              <input
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-ink"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent disabled:opacity-50 active:scale-[.99]"
              >
                {sending ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
            {notice && (
              <p className={`mt-2 text-sm ${notice.ok ? "text-good" : "text-bad"}`}>
                {notice.message}
              </p>
            )}

            {/* Only useful once the Magic Link email template includes
                {{ .Token }}, which Supabase gates behind custom SMTP. Tucked
                away rather than removed, so it's here the day that's set up. */}
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className="mt-3 text-xs text-ink-soft underline underline-offset-2"
            >
              {showCode ? "Hide code entry" : "My email has a 6-digit code"}
            </button>

            {showCode && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-xs text-ink-soft">
                  If the email includes a code, it works from any device — no need to request a
                  fresh link here.
                </p>
                <form onSubmit={submitCode} className="mt-2 flex gap-2">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-32 rounded-xl border border-line bg-surface-2 px-4 py-3 text-center text-base tracking-[0.3em] text-ink"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 rounded-full border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink disabled:opacity-50"
                  >
                    {verifying ? "Checking…" : "Sign in with code"}
                  </button>
                </form>
              </div>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            Nothing in VaatChat is locked behind an account. This is only so your progress survives
            a lost phone.
          </p>
        </>
      )}
    </div>
  );
}
