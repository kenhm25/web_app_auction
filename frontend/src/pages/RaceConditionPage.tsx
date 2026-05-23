import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Section } from "../components/ui/Section";
import { useLanguage } from "../i18n/LanguageContext";

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

function buildBaseUserStates(readyToBid: string): Record<UserSide, UserState> {
  return {
    A: {
      amount: 25000,
      status: readyToBid,
      accent: "neutral",
      loading: false,
    },
    B: {
      amount: 26000,
      status: readyToBid,
      accent: "neutral",
      loading: false,
    },
  };
}

function buildBaseSnapshot(text: {
  simulationReady: string;
  simulationReadyBody: string;
  noActiveTransaction: string;
  rowIdle: string;
}): ScenarioSnapshot {
  return {
    finalBid: null,
    resultTone: "neutral",
    resultTitle: text.simulationReady,
    resultBody: text.simulationReadyBody,
    lockState: text.noActiveTransaction,
    rowState: text.rowIdle,
  };
}

function UserCard({
  label,
  user,
  loadingLabel,
}: {
  label: string;
  user: UserState;
  loadingLabel: string;
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
            {loadingLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function buildScenario(
  mode: Mode,
  baseSnapshot: ScenarioSnapshot,
  zh: boolean,
): ScenarioStep[] {
  const copy = (en: string, Chinese: string) => (zh ? Chinese : en);

  if (mode === "unsafe") {
    return [
      {
        at: 0,
        text: "[12:00:01.201] User A request received",
        update: () => ({
          timeline: { at: 0, text: "[12:00:01.201] User A request received", side: "A" },
          users: {
            A: { status: copy("Processing bid...", "處理 bid 中..."), accent: "active", loading: true },
          },
          snapshot: {
            ...baseSnapshot,
            resultTitle: copy("First request enters the race", "第一個 request 進入競爭"),
            resultBody: copy(
              "User A begins processing, but nothing yet prevents another request from reading the same row at the same time.",
              "User A 開始處理，但此時還沒有機制阻止另一個 request 同時讀取同一列資料。",
            ),
            lockState: copy("No row lock", "沒有 row lock"),
            rowState: copy("Highest bid row exposed to concurrent readers", "Highest bid row 可被 concurrent readers 讀取"),
          },
        }),
      },
      {
        at: STEP_INTERVAL,
        text: "[12:00:01.204] User B request received",
        update: () => ({
          timeline: { at: STEP_INTERVAL, text: "[12:00:01.204] User B request received", side: "B" },
          users: {
            B: { status: copy("Processing bid...", "處理 bid 中..."), accent: "active", loading: true },
          },
          snapshot: {
            ...baseSnapshot,
            resultTitle: copy("Two live requests", "兩個 request 同時存在"),
            resultBody: copy(
              "The second request arrives before the first one commits. Both execution paths can now overlap.",
              "第二個 request 在第一個 commit 前抵達，兩條 execution paths 現在可能重疊。",
            ),
            lockState: copy("No row lock", "沒有 row lock"),
            rowState: copy("Both requests are free to inspect the same row", "兩個 requests 都能讀取同一列資料"),
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
            resultTitle: copy("Stale read captured", "取得 stale read"),
            resultBody: copy(
              "User A caches 24000 in application memory and plans to write 25000.",
              "User A 將 24000 暫存在 application memory，準備寫入 25000。",
            ),
            lockState: copy("No row lock", "沒有 row lock"),
            rowState: copy("User A read snapshot = 24000", "User A read snapshot = 24000"),
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
            resultTitle: copy("Shared stale state", "共享 stale state"),
            resultBody: copy(
              "User B reads the same 24000, so both threads now believe they are updating from the same base row.",
              "User B 也讀到同一個 24000，因此兩個 threads 都以為自己正從相同 base row 更新。",
            ),
            lockState: copy("No row lock", "沒有 row lock"),
            rowState: copy("User A and User B both cached 24000", "User A 與 User B 都 cached 24000"),
          },
        }),
      },
      {
        at: STEP_INTERVAL * 4,
        text: "[12:00:02.104] User B writes 26000",
        update: () => ({
          timeline: { at: STEP_INTERVAL * 4, text: "[12:00:02.104] User B writes 26000", side: "B" },
          users: {
            B: { status: copy("Write committed", "Write 已 commit"), accent: "success", loading: false },
          },
          snapshot: {
            finalBid: 26000,
            resultTone: "neutral",
            resultTitle: copy("Higher bid lands first", "較高 bid 先寫入"),
            resultBody: copy(
              "For a moment the database row is correct, but the race is not over because User A still holds stale state.",
              "此刻 database row 是正確的，但 race 尚未結束，因為 User A 仍持有 stale state。",
            ),
            lockState: copy("No row lock", "沒有 row lock"),
            rowState: copy("Database temporarily stores 26000", "Database 暫時儲存 26000"),
          },
        }),
      },
      {
        at: STEP_INTERVAL * 5,
        text: "[12:00:02.681] User A writes 25000 over stale read",
        update: () => ({
          timeline: { at: STEP_INTERVAL * 5, text: "[12:00:02.681] User A writes 25000 over stale read", side: "A" },
          users: {
            A: { status: copy("Overwrote latest bid", "覆寫 latest bid"), accent: "danger", loading: false },
          },
          snapshot: {
            finalBid: 25000,
            resultTone: "danger",
            resultTitle: copy("Race Condition Detected", "偵測到 Race Condition"),
            resultBody: copy(
              "Both requests read the same old value. The lower bid commits last and overwrites the correct winner.",
              "兩個 requests 讀到相同舊值，較低 bid 最後 commit，覆寫了正確 winner。",
            ),
            lockState: copy("Still no serialization", "仍未 serialization"),
            rowState: copy("Final stored row is incorrect", "Final stored row 不正確"),
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
          A: { status: copy("Acquiring row lock...", "取得 row lock 中..."), accent: "active", loading: true },
        },
        snapshot: {
          ...baseSnapshot,
          resultTitle: copy("Transaction opened", "Transaction 已開啟"),
          resultBody: copy(
            "User A begins inside a transaction boundary before mutating the highest bid row.",
            "User A 在 transaction boundary 內開始，接著才修改 highest bid row。",
          ),
          lockState: copy("Lock requested by User A", "User A 要求 lock"),
          rowState: copy("Row entering protected section", "Row 進入 protected section"),
        },
      }),
    },
    {
      at: STEP_INTERVAL,
      text: "User A requests and acquires row lock (SELECT FOR UPDATE)",
      update: () => ({
        timeline: { at: STEP_INTERVAL, text: "User A requests and acquires row lock (SELECT FOR UPDATE)", side: "A" },
        users: {
          A: { status: copy("Lock acquired", "Lock 已取得"), accent: "active", loading: true },
        },
        snapshot: {
          ...baseSnapshot,
          resultTitle: copy("User A owns the row lock", "User A 持有 row lock"),
          resultBody: copy(
            "Only one writer can proceed now. Any competing request must wait for this transaction to finish.",
            "現在只有一個 writer 能繼續，其他 competing requests 必須等待此 transaction 完成。",
          ),
          lockState: copy("Held by User A", "由 User A 持有"),
          rowState: copy("Serialized write access", "Serialized write access"),
        },
      }),
    },
    {
      at: STEP_INTERVAL * 2,
      text: "[12:00:01.205] User B request received",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 2, text: "[12:00:01.205] User B request received", side: "B" },
        users: {
          B: { status: copy("Waiting for row lock...", "等待 row lock..."), accent: "waiting", loading: true },
        },
        snapshot: {
          ...baseSnapshot,
          resultTitle: copy("Second request arrives", "第二個 request 抵達"),
          resultBody: copy(
            "User B reaches the same row, but it cannot continue until User A releases the lock.",
            "User B 抵達同一列資料，但在 User A 釋放 lock 前無法繼續。",
          ),
          lockState: copy("Held by User A", "由 User A 持有"),
          rowState: copy("User B queued behind lock", "User B 在 lock 後方排隊"),
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
          resultTitle: copy("Write path serialized", "Write path 已 serialized"),
          resultBody: copy(
            "This waiting period is the whole point. User B pauses instead of reading stale state and racing ahead.",
            "這段等待正是重點：User B 會暫停，而不是讀取 stale state 並搶先寫入。",
          ),
          lockState: copy("User B waiting", "User B 等待中"),
          rowState: copy("Protected by transaction boundary", "受 transaction boundary 保護"),
        },
      }),
    },
    {
      at: STEP_INTERVAL * 4,
      text: "[12:00:02.001] Transaction committed by User A",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 4, text: "[12:00:02.001] Transaction committed by User A", side: "A" },
        users: {
          A: { status: copy("Committed 25000", "Committed 25000"), accent: "success", loading: false },
        },
        snapshot: {
          finalBid: 25000,
          resultTone: "neutral",
          resultTitle: copy("Lock released", "Lock 已釋放"),
          resultBody: copy(
            "User A finishes first. Only after commit can the next bidder proceed.",
            "User A 先完成，下一位 bidder 只能在 commit 後繼續。",
          ),
          lockState: copy("Released after commit", "Commit 後釋放"),
          rowState: copy("Highest bid now 25000", "Highest bid 現為 25000"),
        },
      }),
    },
    {
      at: STEP_INTERVAL * 5,
      text: "[12:00:02.002] User B resumed, reads highest bid = 25000",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 5, text: "[12:00:02.002] User B resumed, reads highest bid = 25000", side: "B" },
        users: {
          B: { status: copy("Resumed after lock", "Lock 後恢復執行"), accent: "active", loading: true },
        },
        snapshot: {
          finalBid: 25000,
          resultTone: "neutral",
          resultTitle: copy("Fresh read after wait", "等待後取得 fresh read"),
          resultBody: copy(
            "User B now sees the committed 25000 and can safely decide whether 26000 still wins.",
            "User B 現在看到已 commit 的 25000，可以安全判斷 26000 是否仍會勝出。",
          ),
          lockState: copy("Transferred to User B", "轉移給 User B"),
          rowState: copy("User B reads fresh committed state", "User B 讀取 fresh committed state"),
        },
      }),
    },
    {
      at: STEP_INTERVAL * 6,
      text: "[12:00:02.403] User B commits 26000",
      update: () => ({
        timeline: { at: STEP_INTERVAL * 6, text: "[12:00:02.403] User B commits 26000", side: "B" },
        users: {
          B: { status: copy("Committed 26000", "Committed 26000"), accent: "success", loading: false },
        },
        snapshot: {
          finalBid: 26000,
          resultTone: "success",
          resultTitle: copy("ACID Consistency Preserved", "ACID Consistency 已保留"),
          resultBody: copy(
            "transaction.atomic() and select_for_update() serialize the writes, so the true highest bid survives.",
            "transaction.atomic() 與 select_for_update() 會 serialize writes，因此真正的 highest bid 能保留下來。",
          ),
          lockState: copy("Committed and released", "Committed 並釋放"),
          rowState: copy("Final stored row is 26000", "Final stored row 為 26000"),
        },
      }),
    },
  ];
}

export function RaceConditionPage() {
  const { language, t } = useLanguage();
  const baseUserStates = useMemo(() => buildBaseUserStates(t.race.readyToBid), [t.race.readyToBid]);
  const baseSnapshot = useMemo(
    () =>
      buildBaseSnapshot({
        simulationReady: t.race.simulationReady,
        simulationReadyBody: t.race.simulationReadyBody,
        noActiveTransaction: t.race.noActiveTransaction,
        rowIdle: t.race.rowIdle,
      }),
    [t.race.noActiveTransaction, t.race.rowIdle, t.race.simulationReady, t.race.simulationReadyBody],
  );
  const [mode, setMode] = useState<Mode>("unsafe");
  const [runId, setRunId] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [users, setUsers] = useState(baseUserStates);
  const [snapshot, setSnapshot] = useState(baseSnapshot);
  const timersRef = useRef<number[]>([]);

  const scenario = useMemo(() => buildScenario(mode, baseSnapshot, language === "zh"), [baseSnapshot, language, mode]);

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
  }, [baseSnapshot, baseUserStates, scenario, runId]);

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
            {t.race.eyebrow}
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-6xl lg:text-7xl">
            {t.race.title}
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
              {t.race.unsafeMode}
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
              {t.race.safeMode}
            </button>
          </div>
          <Button type="button" variant="secondary" className="hover:-translate-y-0.5 hover:shadow-md" onClick={() => setRunId((current) => current + 1)}>
            {t.race.replay}
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <UserCard label={t.race.userA} user={users.A} loadingLabel={t.race.processing} />
          <UserCard label={t.race.userB} user={users.B} loadingLabel={t.race.processing} />
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
                      title={entry.side ? `User ${entry.side}` : t.race.db}
                    >
                      {entry.side ? `User ${entry.side}` : t.race.db}
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
                  <p className="mt-4 text-[10px] leading-5 sm:text-xs lg:mt-6 lg:text-sm lg:leading-7">{t.race.waiting}</p>
                </article>
              ) : null}
            </div>
          </div>
        </div>

        <div className={["rounded-[2rem] border px-6 py-6 shadow-soft sm:px-8 sm:py-7", resultClasses(snapshot.resultTone)].join(" ")}>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">{t.race.finalResult}</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{snapshot.resultTitle}</h3>
              <p className="mt-4 max-w-3xl text-base leading-8">{snapshot.resultBody}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/70 px-5 py-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] opacity-70">{t.race.finalHighestBid}</p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] tabular-nums">
                {snapshot.finalBid ? snapshot.finalBid.toLocaleString() : t.race.pending}
              </p>
            </div>
          </div>

          {mode === "unsafe" && snapshot.overwritten ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-[1.25rem] bg-zinc-950 px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">{t.race.correctWinningBid}</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {snapshot.overwritten.previousWinner.toLocaleString()}
                </p>
              </div>
              <div className="text-center text-sm text-red-500">{t.race.staleWrite}</div>
              <div className="rounded-[1.25rem] bg-red-100 px-4 py-4 text-red-900">
                <p className="text-xs uppercase tracking-[0.24em] text-red-500">{t.race.incorrectFinal}</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {snapshot.overwritten.finalStored.toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}

          {mode === "safe" && snapshot.finalBid ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.25rem] bg-zinc-950 px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">{t.race.committedByA}</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums">25,000</p>
              </div>
              <div className="rounded-[1.25rem] bg-emerald-100 px-4 py-4 text-emerald-900">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">{t.race.committedByB}</p>
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
