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

function timelineCardClasses(side?: UserSide) {
  if (side === "A") {
    return "border-blue-100 bg-blue-50/80 text-blue-950 shadow-[0_18px_45px_rgba(37,99,235,0.12)]";
  }

  if (side === "B") {
    return "border-emerald-100 bg-emerald-50/80 text-emerald-950 shadow-[0_18px_45px_rgba(5,150,105,0.12)]";
  }

  return "border-zinc-200/70 bg-white text-zinc-950 shadow-soft";
}

function compactTimelineText(text: string) {
  return text.replace(/^\[[^\]]+\]\s*/, "");
}

function UserCard({
  label,
  user,
}: {
  label: string;
  user: UserState;
}) {
  return (
    <article
      className={[
        "rounded-[2rem] border p-6 shadow-soft transition-transform duration-300 ease-soft hover:-translate-y-0.5",
        label.includes("A") ? "border-blue-100 bg-blue-50/70" : "border-emerald-100 bg-emerald-50/70",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-400">{label}</p>
      <p className="mt-6 text-3xl font-semibold tracking-[-0.04em] tabular-nums text-zinc-950">
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
      text: "User A requests and acquires row lock (SELECT FOR UPDATE)",
      update: () => ({
        timeline: { at: STEP_INTERVAL, text: "User A requests and acquires row lock (SELECT FOR UPDATE)", side: "A" },
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
      at: STEP_INTERVAL * 2,
      text: "[12:00:01.205] User B request received",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 2, text: "[12:00:01.205] User B request received", side: "B" },
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
      at: STEP_INTERVAL * 3,
      text: "[12:00:01.206] User B blocked until commit",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 3, text: "[12:00:01.206] User B blocked until commit", side: "B" },
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
      at: STEP_INTERVAL * 4,
      text: "[12:00:02.001] Transaction committed by User A",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 4, text: "[12:00:02.001] Transaction committed by User A", side: "A" },
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
      at: STEP_INTERVAL * 5,
      text: "[12:00:02.002] User B resumed, reads highest bid = 25000",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 5, text: "[12:00:02.002] User B resumed, reads highest bid = 25000", side: "B" },
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
      at: STEP_INTERVAL * 6,
      text: "[12:00:02.403] User B commits 26000",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 6, text: "[12:00:02.403] User B commits 26000", side: "B" },
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
    <Section className="pt-16 sm:pt-20 bg-zinc-50/70">
      <style>
        {`
          @keyframes race-card-enter {
            0% {
              opacity: 0;
              transform: translateY(18px) scale(0.97);
              filter: blur(4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          .race-timeline-card {
            animation: race-card-enter 620ms cubic-bezier(0.2, 0, 0, 1) both;
            will-change: transform, opacity, filter;
          }

          @media (prefers-reduced-motion: reduce) {
            .race-timeline-card {
              animation: none;
              opacity: 1;
              transform: none;
              filter: none;
            }
          }
        `}
      </style>
      <div className="mx-auto space-y-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-600">
            Race Condition Visual Demo
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-6xl lg:text-7xl">
            Watch two bids compete for the same row.
          </h1>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
          <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setMode("unsafe");
                setRunId((current) => current + 1);
              }}
              className={[
                "rounded-full px-5 py-3 text-sm font-medium transition-colors transition-transform duration-300 ease-in-out active:scale-[0.96]",
                mode === "unsafe" ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
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
                "rounded-full px-5 py-3 text-sm font-medium transition-colors transition-transform duration-300 ease-in-out active:scale-[0.96]",
                mode === "safe" ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
              ].join(" ")}
            >
              SAFE MODE
            </button>
          </div>
          <Button type="button" variant="secondary" className="hover:-translate-y-0.5 hover:shadow-md" onClick={() => setRunId((current) => current + 1)}>
            Replay Simulation
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <UserCard label="User A" user={users.A} />
          <UserCard label="User B" user={users.B} />
        </div>

        <div className="mx-auto max-w-[calc(100vw-2rem)] rounded-[2rem] border border-zinc-200/70 bg-white p-3 shadow-soft sm:p-5 lg:p-6">
          <div className="relative">
            <div className="absolute left-4 right-4 top-8 h-px bg-gradient-to-r from-blue-100 via-zinc-200 to-emerald-100" />
            <div className="flex flex-row flex-nowrap gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4">
              {timeline.map((entry, index) => (
                <article
                  key={`${entry.at}-${index}`}
                  className={[
                    "race-timeline-card relative min-h-[8rem] min-w-0 flex-1 basis-0 rounded-[1.1rem] border p-2.5 opacity-0 transition-transform duration-300 ease-soft hover:-translate-y-1 hover:shadow-soft sm:min-h-[8.75rem] sm:p-3 lg:min-w-[120px] lg:rounded-[1.35rem] lg:p-4 xl:min-w-[140px] 2xl:min-w-[160px]",
                    timelineCardClasses(entry.side),
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-semibold tabular-nums text-white shadow-sm sm:h-8 sm:w-8 sm:text-xs lg:h-9 lg:w-9">
                      {index + 1}
                    </span>
                    <span
                      className="min-w-[3.25rem] shrink-0 rounded-full bg-white/75 px-1.5 py-1 text-center text-[8px] font-semibold uppercase tracking-[0.04em] text-zinc-500 shadow-sm sm:text-[9px] lg:px-2 lg:text-[10px] xl:min-w-[3.75rem] xl:text-xs"
                      title={entry.side ? `User ${entry.side}` : "DB"}
                    >
                      {entry.side ? `User ${entry.side}` : "DB"}
                    </span>
                  </div>
                  <p className="mt-3 text-[9px] font-semibold leading-4 tracking-[-0.02em] text-current sm:text-[10px] sm:leading-5 lg:mt-5 lg:text-xs xl:text-sm xl:leading-6">
                    {compactTimelineText(entry.text)}
                  </p>
                </article>
              ))}

              {!timeline.length ? (
                <article className="min-h-[8rem] min-w-0 flex-1 basis-0 rounded-[1.1rem] border border-dashed border-zinc-200 bg-zinc-50/80 p-2.5 text-zinc-500 sm:min-h-[8.75rem] sm:p-3 lg:min-w-[120px] lg:rounded-[1.35rem] lg:p-4 xl:min-w-[140px] 2xl:min-w-[160px]">
                  <div className="h-7 w-7 rounded-full bg-zinc-200/70 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                  <p className="mt-4 text-[10px] leading-5 sm:text-xs lg:mt-6 lg:text-sm lg:leading-7">Waiting...</p>
                </article>
              ) : null}
            </div>
          </div>
        </div>

        <div className={["rounded-[2rem] border px-6 py-6 shadow-soft sm:px-8 sm:py-7", resultClasses(snapshot.resultTone)].join(" ")}>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">Final Result</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{snapshot.resultTitle}</h3>
              <p className="mt-4 max-w-3xl text-base leading-8">{snapshot.resultBody}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/70 px-5 py-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] opacity-70">Final highest bid</p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] tabular-nums">
                {snapshot.finalBid ? snapshot.finalBid.toLocaleString() : "Pending"}
              </p>
            </div>
          </div>

          {mode === "unsafe" && snapshot.overwritten ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-[1.25rem] bg-zinc-950 px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Correct winning bid before overwrite</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {snapshot.overwritten.previousWinner.toLocaleString()}
                </p>
              </div>
              <div className="text-center text-sm text-red-500">stale write lands last</div>
              <div className="rounded-[1.25rem] bg-red-100 px-4 py-4 text-red-900">
                <p className="text-xs uppercase tracking-[0.24em] text-red-500">Incorrect final stored value</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {snapshot.overwritten.finalStored.toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}

          {mode === "safe" && snapshot.finalBid ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.25rem] bg-zinc-950 px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Committed by User A</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">25,000</p>
              </div>
              <div className="rounded-[1.25rem] bg-emerald-100 px-4 py-4 text-emerald-900">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">Committed by User B</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {snapshot.finalBid.toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
