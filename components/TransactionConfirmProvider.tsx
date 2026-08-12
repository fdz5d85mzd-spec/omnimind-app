"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type TransactionConfirmation = {
  title: string;
  description?: string;
  amount: string;
  method: "stripe" | "credits";
  recurring?: boolean;
};

type PendingConfirmation = TransactionConfirmation & {
  resolve: (confirmed: boolean) => void;
};

type TransactionConfirmContextValue = {
  confirmTransaction: (details: TransactionConfirmation) => Promise<boolean>;
};

const TransactionConfirmContext =
  createContext<TransactionConfirmContextValue | null>(null);

export function TransactionConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  const confirmTransaction = useCallback(
    (details: TransactionConfirmation) =>
      new Promise<boolean>((resolve) => setPending({ ...details, resolve })),
    [],
  );

  const close = useCallback(
    (confirmed: boolean) => {
      const current = pending;
      setPending(null);
      current?.resolve(confirmed);
    },
    [pending],
  );

  useEffect(() => {
    function onExternalConfirmation(event: Event) {
      const customEvent = event as CustomEvent<
        TransactionConfirmation & { resolve?: (confirmed: boolean) => void }
      >;
      if (!customEvent.detail?.title || !customEvent.detail.resolve) return;
      setPending({
        ...customEvent.detail,
        resolve: customEvent.detail.resolve,
      });
    }
    window.addEventListener(
      "omnimind:confirm-transaction",
      onExternalConfirmation,
    );
    return () =>
      window.removeEventListener(
        "omnimind:confirm-transaction",
        onExternalConfirmation,
      );
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, close]);

  return (
    <TransactionConfirmContext.Provider value={{ confirmTransaction }}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[1000] grid place-items-end bg-[#01030c]/75 p-0 backdrop-blur-md sm:place-items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="transaction-confirm-title"
            aria-describedby="transaction-confirm-description"
            className="relative w-full max-w-md overflow-hidden rounded-t-[2rem] border border-white/12 bg-[#0b102c] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_30px_100px_rgba(0,0,0,.65)] sm:rounded-[2rem]"
          >
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan/15 blur-3xl" />
            <button
              type="button"
              onClick={() => close(false)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[.05] text-muted hover:text-white"
              aria-label="Cancel transaction"
            >
              ×
            </button>

            <div className="relative flex items-center gap-4 pr-9">
              <div className="relative h-20 w-20 shrink-0 rounded-2xl border border-cyan/25 bg-gradient-to-br from-accent/20 to-cyan/10 p-1">
                <Image
                  src="/mascot/omni.png"
                  alt="Omni"
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-amber text-xs text-bg shadow-lg">
                  !
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan">
                  Omni payment check
                </p>
                <h2
                  id="transaction-confirm-title"
                  className="mt-1 font-head text-xl font-bold text-white"
                >
                  Confirm before you continue
                </h2>
              </div>
            </div>

            <p
              id="transaction-confirm-description"
              className="mt-5 text-sm leading-relaxed text-muted"
            >
              {pending.description ||
                "This action will create a real transaction. Check the details before continuing."}
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted">{pending.title}</span>
                <strong className="font-head text-lg text-white">
                  {pending.amount}
                </strong>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
                <span className="text-mutedDark">Payment method</span>
                <span
                  className={
                    pending.method === "stripe" ? "text-cyan" : "text-amber"
                  }
                >
                  {pending.method === "stripe"
                    ? "Stripe secure checkout"
                    : "OmniMind credits"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-mutedDark">Billing</span>
                <span className="text-white">
                  {pending.recurring ? "Recurring" : "One-time"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[.8fr_1.2fr] gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-2xl border border-white/12 px-4 py-3.5 text-sm font-bold text-muted hover:bg-white/[.05]"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className="rounded-2xl bg-gradient-to-r from-accent to-cyan px-4 py-3.5 text-sm font-bold text-white shadow-glow"
              >
                {pending.method === "stripe"
                  ? "Continue to Stripe"
                  : "Confirm credit charge"}
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-mutedDark">
              Nothing is charged until you confirm.
            </p>
          </section>
        </div>
      ) : null}
    </TransactionConfirmContext.Provider>
  );
}

export function useTransactionConfirm() {
  const context = useContext(TransactionConfirmContext);
  if (!context)
    throw new Error(
      "useTransactionConfirm must be used within TransactionConfirmProvider",
    );
  return context.confirmTransaction;
}
