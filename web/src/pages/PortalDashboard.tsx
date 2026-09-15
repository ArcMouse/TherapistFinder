import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { extractApiError, portalApi, type TherapistSession } from "../lib/api";
import { usePortalAuth } from "../lib/auth";
import { formatDateTimeIST, formatDuration, formatPriceINR, initials } from "../lib/format";
import { Logo } from "../components/Chrome";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PortalDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clear = usePortalAuth((s) => s.clear);

  const meQuery = useQuery({ queryKey: ["portal", "me"], queryFn: portalApi.me });
  const sessionsQuery = useQuery({ queryKey: ["portal", "sessions"], queryFn: portalApi.sessions });
  const availabilityQuery = useQuery({
    queryKey: ["portal", "availability"],
    queryFn: portalApi.availability,
  });

  const [weekday, setWeekday] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [formError, setFormError] = useState<string | null>(null);

  const createAvailability = useMutation({
    mutationFn: () =>
      portalApi.createAvailability({ weekday, start_time: startTime, end_time: endTime }),
    onSuccess: () => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["portal", "availability"] });
    },
    onError: (err) => setFormError(extractApiError(err, "Could not add that slot.")),
  });

  const deleteAvailability = useMutation({
    mutationFn: (id: number) => portalApi.deleteAvailability(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal", "availability"] }),
  });

  function handleLogout() {
    clear();
    queryClient.clear();
    navigate("/portal/login", { replace: true });
  }

  const therapist = meQuery.data;
  const sessions = sessionsQuery.data ?? [];
  const upcoming = sessions.filter((s) => s.is_upcoming);
  const past = sessions.filter((s) => !s.is_upcoming);

  return (
    <div className="min-h-screen bg-ink-50" data-testid="portal-dashboard">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600 sm:inline-flex" data-testid="ist-badge">
              🕒 All times in IST
            </span>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                {initials(therapist?.name ?? "T")}
              </span>
              <span className="hidden text-sm font-medium text-ink-800 sm:block">
                {therapist?.name ?? "Therapist"}
              </span>
            </div>
            <button
              type="button"
              data-testid="portal-logout"
              onClick={handleLogout}
              className="rounded-xl2 border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-danger-500 hover:text-danger-600"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-900">
              Welcome back{therapist ? `, ${therapist.name.split(" ").slice(-1)[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-ink-400">
              {therapist ? `${therapist.degree} · ${therapist.experience_years} yrs experience` : "Loading…"}
            </p>
          </div>
          <Link to="/" className="text-sm font-medium text-primary-600 hover:underline">
            View public site →
          </Link>
        </div>

        {meQuery.isError ? (
          <ErrorBox message={extractApiError(meQuery.error, "Could not load your profile.")} />
        ) : null}

        {/* stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Upcoming sessions" value={String(upcoming.length)} accent="primary" testid="stat-upcoming" />
          <StatCard label="Completed / past" value={String(past.length)} accent="ink" testid="stat-past" />
          <StatCard
            label="Practice credits"
            value={therapist ? String(therapist.credits) : "—"}
            accent="accent"
            testid="stat-credits"
            hint="Demo balance"
          />
          <StatCard
            label="Session price"
            value={therapist ? formatPriceINR(therapist.session_price_inr) : "—"}
            accent="ink"
            testid="stat-price"
            hint={therapist ? `${formatDuration(therapist.session_duration_min)} session` : undefined}
          />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          {/* Sessions */}
          <section className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink-900">Your sessions</h2>
              <span className="chip">IST</span>
            </div>

            {sessionsQuery.isLoading ? (
              <div className="card p-8 text-center text-sm text-ink-400">Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className="card p-8 text-center text-sm text-ink-400" data-testid="no-sessions">
                No sessions booked yet. Publish availability so clients can book you.
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </section>

          {/* Availability */}
          <section className="lg:col-span-2" data-testid="availability-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink-900">Weekly availability</h2>
              <span className="chip">IST</span>
            </div>

            <div className="card p-6">
              <div className="space-y-2" data-testid="availability-list">
                {(availabilityQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-ink-400">No availability published yet.</p>
                ) : (
                  (availabilityQuery.data ?? []).map((rule) => (
                    <div
                      key={rule.id}
                      data-testid={`availability-rule-${rule.id}`}
                      className="flex items-center justify-between rounded-xl2 border border-ink-100 bg-ink-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{rule.weekday_label}</p>
                        <p className="text-xs text-ink-400">
                          {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)} IST
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${rule.weekday_label} slot`}
                        data-testid={`remove-availability-${rule.id}`}
                        onClick={() => deleteAvailability.mutate(rule.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-danger-600 transition hover:bg-danger-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form
                className="mt-6 border-t border-ink-100 pt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (startTime >= endTime) {
                    setFormError("End time must be after start time.");
                    return;
                  }
                  createAvailability.mutate();
                }}
              >
                <p className="mb-3 text-sm font-semibold text-ink-900">Add a slot</p>
                {formError ? (
                  <p className="mb-3 text-xs font-medium text-danger-600" data-testid="availability-error">
                    {formError}
                  </p>
                ) : null}
                <div className="space-y-3">
                  <select
                    data-testid="weekday-select"
                    className="field"
                    value={weekday}
                    onChange={(e) => setWeekday(Number(e.target.value))}
                  >
                    {WEEKDAYS.map((label, index) => (
                      <option key={label} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-ink-400">
                      Start (IST)
                      <input
                        data-testid="start-time"
                        type="time"
                        className="field mt-1"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </label>
                    <label className="text-xs text-ink-400">
                      End (IST)
                      <input
                        data-testid="end-time"
                        type="time"
                        className="field mt-1"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    data-testid="add-availability"
                    disabled={createAvailability.isPending}
                    className="btn-primary w-full py-3 disabled:opacity-50"
                  >
                    {createAvailability.isPending ? "Adding…" : "Add availability"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SessionCard({ session }: { session: TherapistSession }) {
  const cancelled = session.status === "cancelled";
  return (
    <article
      data-testid={`session-${session.id}`}
      className={`card p-5 ${cancelled ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
            {initials(session.client_name)}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">{session.client_name}</p>
            <p className="text-xs text-ink-400">{session.client_email}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            cancelled ? "bg-ink-100 text-ink-400" : "bg-success-50 text-success-500"
          }`}
        >
          {session.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="Starts" value={session.start_dt_ist || formatDateTimeIST(session.start_dt)} />
        <Info label="Duration" value={formatDuration(session.duration_min)} />
        <Info
          label="Zoom link"
          value={
            session.zoom_link ? (
              <a
                data-testid={`zoom-link-${session.id}`}
                href={session.zoom_link}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary-600 hover:underline"
              >
                {session.zoom_link}
              </a>
            ) : (
              <span className="text-ink-400">—</span>
            )
          }
        />
        <Info
          label="Client reminder"
          value={
            session.reminder_sent_at
              ? "Email sent ✓"
              : session.reminder_at_ist
              ? `Scheduled ${session.reminder_at_ist}`
              : "—"
          }
        />
      </div>

      {session.zoom_link && !cancelled ? (
        <a
          href={session.zoom_link}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-4 w-full py-2.5 sm:w-auto"
        >
          Join Zoom session
        </a>
      ) : null}
    </article>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl2 bg-ink-50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  testid,
  hint,
}: {
  label: string;
  value: string;
  accent: "primary" | "accent" | "ink";
  testid: string;
  hint?: string;
}) {
  const accents: Record<string, string> = {
    primary: "from-primary-500 to-primary-600",
    accent: "from-accent-500 to-accent-600",
    ink: "from-ink-800 to-ink-900",
  };
  return (
    <div className="card overflow-hidden p-5" data-testid={testid}>
      <div className={`mb-3 h-1.5 w-10 rounded-full bg-gradient-to-r ${accents[accent]}`} />
      <p className="text-3xl font-extrabold text-ink-900" data-testid={`${testid}-value`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-400">{label}</p>
      {hint ? <p className="mt-2 text-[11px] font-medium text-accent-600">{hint}</p> : null}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-xl2 border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
      {message}
    </div>
  );
}