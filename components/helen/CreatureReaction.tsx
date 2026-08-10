"use client";

export interface Reaction {
  key: number;
  emoji: string;
  message?: string;
}

export function CreatureReaction({ reaction }: { reaction: Reaction | null }) {
  if (!reaction) return null;
  return (
    <div
      key={reaction.key}
      className="pointer-events-none absolute inset-x-0 top-1 flex flex-col items-center animate-helen-float-up"
    >
      {reaction.message && (
        <div className="mb-1 max-w-[220px] rounded-2xl bg-helen-paper px-3 py-1.5 text-center text-[11px] font-semibold leading-snug text-helen-ink shadow-lg">
          {reaction.message}
        </div>
      )}
      <div className="text-[26px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">{reaction.emoji}</div>
    </div>
  );
}
