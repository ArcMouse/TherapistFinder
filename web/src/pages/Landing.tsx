import { Link } from "react-router-dom";

import { Footer, Navbar, SectionHeading } from "../components/Chrome";
import { PhoneMock } from "../components/PhoneMock";

const FEATURES = [
  {
    icon: "🧠",
    title: "Search the way you talk",
    body: "Describe what you need — “anxiety in teens, available Sunday evening” — and our semantic search finds the right specialists, not just keyword matches.",
  },
  {
    icon: "🕒",
    title: "Your timezone, always",
    body: "Every slot is shown in the timezone you choose. Book from anywhere; the app handles the conversion for you.",
  },
  {
    icon: "🎥",
    title: "One-tap secure Zoom",
    body: "Confirm a slot and get your Zoom link instantly. We email it again 30 minutes before your session, so you never miss it.",
  },
  {
    icon: "🪪",
    title: "Verified clinicians",
    body: "Every therapist is credentialed and reviewed — degrees, specialities and experience are shown up front.",
  },
  {
    icon: "🔒",
    title: "Private by design",
    body: "Your data is encrypted in transit and at rest. Sessions are confidential and never recorded.",
  },
  {
    icon: "💬",
    title: "Flexible sessions",
    body: "50-minute focused sessions with the option to rebook the same clinician in a couple of taps.",
  },
];

const STEPS = [
  { n: "01", title: "Tell us what you need", body: "Answer two quick onboarding questions and describe your situation in plain language." },
  { n: "02", title: "Pick the right therapist", body: "Compare specialities, experience, price and real availability — in your own timezone." },
  { n: "03", title: "Book and join", body: "Choose a slot, confirm, and join your private Zoom session from any device." },
];

const THERAPIST_BENEFITS = [
  "See all upcoming and past sessions in one dashboard",
  "Zoom links for every session, ready to join",
  "Publish and edit your weekly availability",
  "Automatic Zoom-link reminders to clients",
  "Practice credits and activity at a glance",
  "Every time shown in IST, unambiguously",
];


const FAQS = [
  {
    q: "Is MindEase available outside India?",
    a: "Our client app is available worldwide and always shows times in your chosen timezone. Our clinicians are licensed to practise in India.",
  },
  {
    q: "How do sessions happen?",
    a: "Every session runs over a secure Zoom meeting. Your link is created at booking and emailed to you again 30 minutes before the session starts.",
  },
  {
    q: "What does a session cost?",
    a: "Clinicians set their own fees, typically between ₹900 and ₹3,000 for a 40–60 minute session. You always see the exact price before booking.",
  },
  {
    q: "I’m a therapist. How do I join?",
    a: "Sign in to the therapist portal with the credentials we issue after credential verification. You can manage sessions, availability and Zoom links there.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="chip">🌍 Available worldwide · Clinicians licensed in India</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Therapy that fits
              <span className="block bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                your life and timezone.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-600">
              MindEase pairs natural-language therapist search with real availability and
              instant Zoom booking. Find someone who truly fits — in minutes, not weeks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#download" className="btn-primary px-7 py-3.5 text-base">
                Download the app
              </a>
              <Link to="/portal/login" className="btn-ghost px-7 py-3.5 text-base">
                Therapist portal →
              </Link>
            </div>
  
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <PhoneMock />
          </div>
        </div>

        {/* trust strip */}
        <div className="border-y border-ink-100 bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-xs font-semibold uppercase tracking-widest text-ink-400">
            <span>RCI-verified clinicians</span>
            <span>Secure Zoom sessions</span>
            <span>End-to-end encryption</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
        <SectionHeading
          center
          eyebrow="Why MindEase"
          title="Everything you need to start therapy with confidence"
          subtitle="Built for real life: find the right specialist, see genuine availability, and join your session without friction."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card p-6 transition hover:-translate-y-1 hover:shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-2xl">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to your first session"
          />
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="relative rounded-xl3 border border-ink-100 p-7">
                <span className="text-4xl font-extrabold text-primary-100">{step.n}</span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For therapists */}
      <section id="therapists" className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
        <div className="card grid items-center gap-12 overflow-hidden p-0 lg:grid-cols-2">
          <div className="p-10 lg:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
              For therapists
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              A practice dashboard that just works
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-600">
              Manage your sessions, publish availability and grab your Zoom links — with every
              time shown in IST so there is never any ambiguity.
            </p>
            <ul className="mt-7 space-y-3">
              {THERAPIST_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-ink-800">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-50 text-xs text-accent-600">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <Link to="/portal/login" className="btn-primary mt-9 px-7 py-3.5 text-base" data-testid="therapist-portal-cta">
              Open the therapist portal
            </Link>
          </div>
          <div className="h-full bg-gradient-to-br from-primary-500 to-accent-500 p-10 lg:p-14">
            <div className="rounded-xl3 bg-white/95 p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                This week
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Upcoming" value="4" />
                <Metric label="Practice credits" value="18" />
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { t: "Sun, 20 Sep · 5:00 PM IST", c: "Aarav S." },
                  { t: "Mon, 21 Sep · 10:00 AM IST", c: "Neha K." },
                  { t: "Wed, 23 Sep · 6:00 PM IST", c: "Vikram R." },
                ].map((row) => (
                  <div
                    key={row.t}
                    className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-ink-900">{row.c}</p>
                      <p className="text-[10px] text-ink-400">{row.t}</p>
                    </div>
                    <span className="rounded-full bg-success-50 px-2.5 py-1 text-[10px] font-semibold text-success-500">
                      Join
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* FAQ */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeading center eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-12 divide-y divide-ink-100 rounded-xl3 border border-ink-100">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-ink-900">
                  {faq.q}
                  <span className="text-ink-400 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-ink-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="download" className="mx-auto max-w-6xl px-5 py-20">
        <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-br from-primary-500 to-accent-500 px-8 py-16 text-center shadow-soft sm:px-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your first session is closer than you think
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
            Download MindEase, tell us what you need, and book a verified therapist today.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a href="#" className="btn bg-white px-7 py-3.5 text-base text-primary-600 hover:bg-ink-50">
               App Store
            </a>
            <a href="#" className="btn border border-white/60 px-7 py-3.5 text-base text-white hover:bg-white/10">
              ▶ Google Play
            </a>
            <Link to="/portal/login" className="btn border border-white/60 px-7 py-3.5 text-base text-white hover:bg-white/10">
              Therapist portal
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-4">
      <p className="text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="text-[11px] text-ink-400">{label}</p>
    </div>
  );
}