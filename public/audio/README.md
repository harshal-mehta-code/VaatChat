# Audio assets

Native-recorded `.mp3` files go here, matching the paths referenced in
`lib/content/*`. Until a file exists at its expected path, the app falls back to
browser text-to-speech automatically (see `lib/client/speech.ts`).

- Word/phrase audio: `public/audio/<id>.mp3` (e.g. `kem-cho.mp3`)
- Letters: `public/audio/akshar/<roman>.mp3` (e.g. `aa.mp3`)
- Vaat Mode lines: `public/audio/vaat/<node-or-choice-id>.mp3`

See [`docs/AUDIO_CHECKLIST.md`](../../docs/AUDIO_CHECKLIST.md) for the full list
to record.
