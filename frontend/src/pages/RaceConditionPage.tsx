import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Section } from "../components/ui/Section";

type Mode = "unsafe" | "safe";
type UserSide = "A" | "B";

type TimelineEntry = {
  at: number;
  text: string;
  side?: UserSide;
};

type UserState = {
  amount: number;
  status: string;
  accent: "neutral" | "active" | "waiting" | "success" | "danger";
  loading: boolean;
};

type ScenarioSnapshot = {
  finalBid: number | null;
  resultTone: "neutral" | "success" | "danger";
  resultTitle: string;
  resultBody: string;
  lockState: string;
  rowState: string;
  overwritten?: {
    previousWinner: number;
    finalStored: number;
  };
};

type ScenarioUpdate = {
  timeline?: TimelineEntry;
  users?: Partial<Record<UserSide, Partial<UserState>>>;
  snapshot?: ScenarioSnapshot;
};

type ScenarioStep = {
  at: number;
  text: string;
  update: () => ScenarioUpdate;
};

const baseUserStates: Record<UserSide, UserState> = {
  A: {
    amount: 25000,
    status: "Ready to bid",
    accent: "neutral",
    loading: false,
  },
  B: {
    amount: 26000,
    status: "Ready to bid",
    accent: "neutral",
    loading: false,
  },
};

const baseSnapshot: ScenarioSnapshot = {
  finalBid: null,
  resultTone: "neutral",
  resultTitle: "Simulation ready",
  resultBody: "Switch between unsafe and safe mode to demonstrate the effect of row-level locking.",
  lockState: "No active transaction",
  rowState: "Highest bid row idle",
};

const STEP_INTERVAL = 1300;

function accentClasses(accent: UserState["accent"]) {
  switch (accent) {
    case "active":
      return "bg-zinc-950 text-white";
    case "waiting":
      return "bg-zinc-100 text-zinc-700";
    case "success":
      return "bg-emerald-50 text-emerald-700";
    case "danger":
      return "bg-red-50 text-red-700";
    default:
      return "bg-zinc-50 text-zinc-700";
  }
}

function resultClasses(tone: ScenarioSnapshot["resultTone"]) {
  if (tone === "success") {
    return "border-emerald-100 bg-emerald-50/70 text-emerald-800";
  }
  if (tone === "danger") {
    return "border-red-100 bg-red-50/70 text-red-800";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function UserCard({
  label,
  user,
}: {
  label: string;
  user: UserState;
}) {
  return (
    <article className="rounded-[2rem] border border-zinc-200/70 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-400">{label}</p>
      <p className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
        {user.amount.toLocaleString()}
      </p>
      <div className="mt-6 flex flex-col items-start gap-3">
        <span className={["inline-flex rounded-full px-3 py-1.5 text-xs font-medium", accentClasses(user.accent)].join(" ")}>
          {user.status}
        </span>
        {user.loading ? (
          <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
            Processing
          </span>
        ) : null}
      </div>
    </article>
  );
}

function buildScenario(mode: Mode): ScenarioStep[] {
  if (mode === "unsafe") {
    return [
      {
        at: 0,
        text: "[12:00:01.201] User A request received",
        update: () => ({
          timeline: { at: 0, text: "[12:00:01.201] User A request received", side: "A" },
          users: {
            A: { status: "Processing bid...", accent: "active", loading: true },
          },
          snapshot: {
            ...baseSnapshot,
            resultTitle: "First request enters the race",
            resultBody: "User A begins processing, but nothing yet prevents another request from reading the same row at the same time.",
            lockState: "No row lock",
            rowState: "Highest bid row exposed to concurrent readers",
          },
        }),
      },
      {
        at: STEP_INTERVAL,
        text: "[12:00:01.204] User B request received",
        update: () => ({
          timeline: { at: STEP_INTERVAL, text: "[12:00:01.204] User B request received", side: "B" },
          users: {
            B: { status: "Processing bid...", accent: "active", loading: true },
          },
          snapshot: {
            ...baseSnapshot,
            resultTitle: "Two live requests",
            resultBody: "The second request arrives before the first one commits. Both execution paths can now overlap.",
            lockState: "No row lock",
            rowState: "Both requests are free to inspect the same row",
          },
        }),
      },
      {
        at: STEP_INTERVAL * 2,
        text: "[12:00:01.612] User A reads highest bid = 24000",
        update: () => ({
          timeline: { at: STEP_INTERVAL * 2, text: "[12:00:01.612] User A reads highest bid = 24000", side: "A" },
          snapshot: {
            ...baseSnapshot,
            resultTitle: "Stale read captured",
            resultBody: "User A caches 24000 in application memory and plans to write 25000.",
            lockState: "No row lock",
            rowState: "User A read snapshot = 24000",
          },
        }),
      },
      {
        at: STEP_INTERVAL * 3,
        text: "[12:00:01.851] User B reads highest bid = 24000",
        update: () => ({
          timeline: { at: STEP_INTERVAL * 3, text: "[12:00:01.851] User B reads highest bid = 24000", side: "B" },
          snapshot: {
            ...baseSnapshot,
            resultTitle: "Shared stale state",
            resultBody: "User B reads the same 24000, so both threads now believe they are updating from the same base row.",
            lockState: "No row lock",
            rowState: "User A and User B both cached 24000",
          },
        }),
      },
      {
        at: STEP_INTERVAL * 4,
        text: "[12:00:02.104] User B writes 26000",
        update: () => ({
          timeline: { at: STEP_INTERVAL * 4, text: "[12:00:02.104] User B writes 26000", side: "B" },
          users: {
            B: { status: "Write committed", accent: "success", loading: false },
          },
          snapshot: {
            finalBid: 26000,
            resultTone: "neutral",
            resultTitle: "Higher bid lands first",
            resultBody: "For a moment the database row is correct, but the race is not over because User A still holds stale state.",
            lockState: "No row lock",
            rowState: "Database temporarily stores 26000",
          },
        }),
      },
      {
        at: STEP_INTERVAL * 5,
        text: "[12:00:02.681] User A writes 25000 over stale read",
        update: () => ({
          timeline: { at: STEP_INTERVAL * 5, text: "[12:00:02.681] User A writes 25000 over stale read", side: "A" },
          users: {
            A: { status: "Overwrote latest bid", accent: "danger", loading: false },
          },
          snapshot: {
            finalBid: 25000,
            resultTone: "danger",
            resultTitle: "Race Condition Detected",
            resultBody: "Both requests read the same old value. The lower bid commits last and overwrites the correct winner.",
            lockState: "Still no serialization",
            rowState: "Final stored row is incorrect",
            overwritten: {
              previousWinner: 26000,
              finalStored: 25000,
            },
          },
        }),
      },
    ];
  }

  return [
    {
      at: 0,
      text: "[12:00:01.201] User A request received",
      update: () => ({
        timeline: { at: 0, text: "[12:00:01.201] User A request received", side: "A" },
        users: {
          A: { status: "Acquiring row lock...", accent: "active", loading: true },
        },
        snapshot: {
          ...baseSnapshot,
          resultTitle: "Transaction opened",
          resultBody: "User A begins inside a transaction boundary before mutating the highest bid row.",
          lockState: "Lock requested by User A",
          rowState: "Row entering protected section",
        },
      }),
    },
    {
      at: STEP_INTERVAL,
      text: "[12:00:01.203] SELECT ... FOR UPDATE",
      update: () => ({
        timeline: { at: STEP_INTERVAL, text: "[12:00:01.203] SELECT ... FOR UPDATE", side: "A" },
        snapshot: {
          ...baseSnapshot,
          resultTitle: "Row-level lock requested",
          resultBody: "PostgreSQL is asked to place an exclusive lock on the highest bid row before reading it.",
          lockState: "SELECT ... FOR UPDATE",
          rowState: "Pending exclusive row lock",
        },
      }),
    },
    {
      at: STEP_INTERVAL * 2,
      text: "[12:00:01.204] Lock acquired by User A",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 2, text: "[12:00:01.204] Lock acquired by User A", side: "A" },
        users: {
          A: { status: "Lock acquired", accent: "active", loading: true },
        },
        snapshot: {
          ...baseSnapshot,
          resultTitle: "User A owns the row lock",
          resultBody: "Only one writer can proceed now. Any competing request must wait for this transaction to finish.",
          lockState: "Held by User A",
          rowState: "Serialized write access",
        },
      }),
    },
    {
      at: STEP_INTERVAL * 3,
      text: "[12:00:01.205] User B request received",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 3, text: "[12:00:01.205] User B request received", side: "B" },
        users: {
          B: { status: "Waiting for row lock...", accent: "waiting", loading: true },
        },
        snapshot: {
          ...baseSnapshot,
          resultTitle: "Second request arrives",
          resultBody: "User B reaches the same row, but it cannot continue until User A releases the lock.",
          lockState: "Held by User A",
          rowState: "User B queued behind lock",
        },
      }),
    },
    {
      at: STEP_INTERVAL * 4,
      text: "[12:00:01.206] User B blocked until commit",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 4, text: "[12:00:01.206] User B blocked until commit", side: "B" },
        snapshot: {
          ...baseSnapshot,
          resultTitle: "Write path serialized",
          resultBody: "This waiting period is the whole point. User B pauses instead of reading stale state and racing ahead.",
          lockState: "User B waiting",
          rowState: "Protected by transaction boundary",
        },
      }),
    },
    {
      at: STEP_INTERVAL * 5,
      text: "[12:00:02.001] Transaction committed by User A",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 5, text: "[12:00:02.001] Transaction committed by User A", side: "A" },
        users: {
          A: { status: "Committed 25000", accent: "success", loading: false },
        },
        snapshot: {
          finalBid: 25000,
          resultTone: "neutral",
          resultTitle: "Lock released",
          resultBody: "User A finishes first. Only after commit can the next bidder proceed.",
          lockState: "Released after commit",
          rowState: "Highest bid now 25000",
        },
      }),
    },
    {
      at: STEP_INTERVAL * 6,
      text: "[12:00:02.002] User B resumed, reads highest bid = 25000",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 6, text: "[12:00:02.002] User B resumed, reads highest bid = 25000", side: "B" },
        users: {
          B: { status: "Resumed after lock", accent: "active", loading: true },
        },
        snapshot: {
          finalBid: 25000,
          resultTone: "neutral",
          resultTitle: "Fresh read after wait",
          resultBody: "User B now sees the committed 25000 and can safely decide whether 26000 still wins.",
          lockState: "Transferred to User B",
          rowState: "User B reads fresh committed state",
        },
      }),
    },
    {
      at: STEP_INTERVAL * 7,
      text: "[12:00:02.403] User B commits 26000",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 7, text: "[12:00:02.403] User B commits 26000", side: "B" },
        users: {
          B: { status: "Committed 26000", accent: "success", loading: false },
        },
        snapshot: {
          finalBid: 26000,
          resultTone: "success",
          resultTitle: "ACID Consistency Preserved",
          resultBody: "transaction.atomic() and select_for_update() serialize the writes, so the true highest bid survives.",
          lockState: "Committed and released",
          rowState: "Final stored row is 26000",
        },
      }),
    },
  ];
}

export function RaceConditionPage() {
  const [mode, setMode] = useState<Mode>("unsafe");
  const [runId, setRunId] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [users, setUsers] = useState(baseUserStates);
  const [snapshot, setSnapshot] = useState(baseSnapshot);
  const timersRef = useRef<number[]>([]);

  const scenario = useMemo(() => buildScenario(mode), [mode]);

  useEffect(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setTimeline([]);
    setUsers(baseUserStates);
    setSnapshot(baseSnapshot);

    scenario.forEach((step) => {
      const timer = window.setTimeout(() => {
        const update = step.update();

        if (update.timeline) {
          const nextTimeline = update.timeline;
          setTimeline((current) => [...current, nextTimeline]);
        }

        if (update.users) {
          setUsers((current) => ({
            A: { ...current.A, ...(update.users?.A ?? {}) },
            B: { ...current.B, ...(update.users?.B ?? {}) },
          }));
        }

        if (update.snapshot) {
          setSnapshot(update.snapshot);
        }
      }, step.at);

      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [scenario, runId]);

  return (
    <Section className="pt-16 sm:pt-20">
      <div className="mx-auto space-y-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">
            Race Condition Visual Demo
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-6xl lg:text-7xl">
            Show the difference between stale reads and row-level locking.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            This is an educational visualization for interviews. It simulates two competing bids, first without locking and then with transaction.atomic() plus select_for_update().
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
          <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("unsafe");
                setRunId((current) => current + 1);
              }}
              className={[
                "rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 ease-in-out",
                mode === "unsafe" ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-white",
              ].join(" ")}
            >
              UNSAFE MODE
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("safe");
                setRunId((current) => current + 1);
              }}
              className={[
                "rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 ease-in-out",
                mode === "safe" ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-white",
              ].join(" ")}
            >
              SAFE MODE
            </button>
          </div>
          <Button type="button" variant="secondary" onClick={() => setRunId((current) => current + 1)}>
            Replay Simulation
          </Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.52fr_1.96fr_0.52fr]">
          <UserCard label="User A" user={users.A} />

          <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-400">
                  Backend Timeline
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
                  {mode === "unsafe" ? "No row lock protection" : "Serialized writes with row-level locking"}
                </h2>
              </div>
              <div className="rounded-full bg-zinc-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                {mode}
              </div>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.36fr_0.84fr]">
              <div className="min-w-0 rounded-[1.75rem] bg-zinc-950 px-4 py-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <p className="ml-2 text-xs uppercase tracking-[0.28em] text-white/40">transaction log</p>
                </div>
                <div className="mt-4 h-[24rem] space-y-2 overflow-y-auto overflow-x-visible font-mono text-[11px] leading-relaxed text-zinc-100">
                  {timeline.map((entry, index) => (
                    <div
                      key={`${entry.at}-${index}`}
                      className={[
                        "animate-[fade-up_0.7s_cubic-bezier(0.4,0,0.2,1)_forwards] rounded-xl px-3 py-2.5 opacity-0 transition-colors duration-500 ease-in-out",
                        index === timeline.length - 1 ? "bg-white/[0.08]" : "bg-white/[0.03]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "block whitespace-nowrap",
                          index === timeline.length - 1 ? "text-white" : "text-white/88",
                        ].join(" ")}
                      >
                        {entry.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className={["rounded-[1.75rem] border px-5 py-5", resultClasses(snapshot.resultTone)].join(" ")}>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">Outcome</p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{snapshot.resultTitle}</h3>
                  <p className="mt-4 text-base leading-8">{snapshot.resultBody}</p>
                  <p className="mt-6 text-sm uppercase tracking-[0.24em]">
                    Final highest bid
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
                    {snapshot.finalBid ? snapshot.finalBid.toLocaleString() : "Pending"}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/70 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">Lock state</p>
                    <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-zinc-950">{snapshot.lockState}</p>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      {mode === "unsafe"
                        ? "No database-enforced serialization exists here, so both requests can continue independently."
                        : "The row-level lock decides which request may mutate the highest bid row at any point in time."}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/70 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">Row state</p>
                    <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-zinc-950">{snapshot.rowState}</p>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      This mirrors what the row effectively looks like inside the database as each step unfolds.
                    </p>
                  </div>
                </div>

                {mode === "unsafe" && snapshot.overwritten ? (
                  <div className="rounded-[1.5rem] border border-red-100 bg-white/70 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Overwritten winner</p>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[1.25rem] bg-zinc-950 px-4 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/50">Correct winning bid before overwrite</p>
                        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                          {snapshot.overwritten.previousWinner.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <span className="h-px flex-1 bg-zinc-200" />
                        stale write lands last
                        <span className="h-px flex-1 bg-zinc-200" />
                      </div>
                      <div className="rounded-[1.25rem] bg-red-50 px-4 py-4 text-red-800">
                        <p className="text-xs uppercase tracking-[0.24em] text-red-500">Incorrect final stored value</p>
                        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                          {snapshot.overwritten.finalStored.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {mode === "safe" && snapshot.finalBid ? (
                  <div className="rounded-[1.5rem] border border-emerald-100 bg-white/70 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Serialized result</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.25rem] bg-zinc-950 px-4 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/50">Committed by User A</p>
                        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">25,000</p>
                      </div>
                      <div className="rounded-[1.25rem] bg-emerald-50 px-4 py-4 text-emerald-800">
                        <p className="text-xs uppercase tracking-[0.24em] text-emerald-500">Committed by User B</p>
                        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                          {snapshot.finalBid.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <UserCard label="User B" user={users.B} />
        </div>
      </div>
    </Section>
  );
}
