import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ChevronRight, LockKeyhole, ShieldCheck, Zap } from "lucide-react";
import tradingRoom from "../assets/trading-control-room.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HeroesMarkets | Trade Global Markets" },
      { name: "description", content: "Trade forex, crypto, commodities, stocks and indexes with fast execution and transparent pricing." },
      { property: "og:title", content: "HeroesMarkets | Trade Global Markets" },
      { property: "og:description", content: "A precise, powerful trading experience across the world's markets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const quotes = [
  ["EUR/USD", "1.0842", "+0.31%"],
  ["BTC/USD", "$67,204", "+1.88%"],
  ["GOLD", "$2,331", "+0.42%"],
  ["S&P 500", "5,212", "+0.24%"],
  ["US10Y", "4.28%", "-0.06%"],
  ["WTI", "$78.40", "+0.19%"],
];

const markets = [
  ["FX", "Forex", "72 majors & minors"],
  ["₿", "Crypto", "240 spot & futures pairs"],
  ["AU", "Commodities", "Metals, energy & agriculture"],
  ["SP", "Stocks & Indexes", "9,000+ global instruments"],
];

const stats = [
  ["12ms", "Average execution", "Order fills across 40+ liquidity pools."],
  ["12,400", "Active instruments", "Five global asset classes in one account."],
  ["$4.2B", "Client assets held", "Segregated, ring-fenced and audited."],
];

function Brand() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="HeroesMarkets home">
      <span className="grid size-7 rotate-45 place-items-center rounded-md border border-signal bg-signal-soft">
        <span className="size-2.5 border-r-2 border-t-2 border-signal" />
      </span>
      <span className="font-head text-lg font-semibold">Heroes<span className="text-signal">Markets</span></span>
    </a>
  );
}

function Index() {
  return (
    <div id="top" className="min-h-screen overflow-hidden bg-background font-body text-foreground antialiased">
      <div className="border-b border-border bg-card/60">
        <div className="ticker flex w-max items-center gap-9 py-2 text-[10px] font-medium uppercase tracking-[0.18em]">
          {[...quotes, ...quotes].map(([name = "", value = "", change = ""], index) => (
            <span key={`${name}-${index}`} className="flex gap-2 text-muted-foreground">
              {name} <b className="text-foreground">{value}</b>
              <em className={change.startsWith("+") ? "not-italic text-positive" : "not-italic text-signal"}>{change}</em>
            </span>
          ))}
        </div>
      </div>

      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
          <a className="transition-colors hover:text-foreground" href="#markets">Markets</a>
          <a className="transition-colors hover:text-foreground" href="#platform">Platform</a>
          <a className="transition-colors hover:text-foreground" href="#insights">Insights</a>
          <a className="transition-colors hover:text-foreground" href="#trust">Why Heroes</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link className="hidden h-9 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex" to="/auth">Log in</Link>
          <Link className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85" to="/auth">Open account <ArrowRight className="size-3.5" /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-12 gap-3">
          <section className="col-span-12 flex min-h-[340px] flex-col justify-between rounded-2xl border border-border bg-card p-6 lg:col-span-5 lg:p-8">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-signal"><span className="pulse-dot size-1.5 rounded-full bg-signal" /> Live execution</span>
              <h1 className="mt-5 max-w-[18ch] font-head text-4xl font-semibold leading-[1.02] text-balance sm:text-5xl">Trade the world&apos;s markets with terminal-grade precision.</h1>
              <p className="mt-5 max-w-[46ch] text-sm leading-6 text-muted-foreground">Forex, crypto, commodities, stocks and indexes — one disciplined workspace built for serious trading.</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-8">
              <Link className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85" to="/auth">Open account <ArrowRight className="size-4" /></Link>
              <Link className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-accent" to="/auth">Log in to trade</Link>
            </div>
          </section>

          <section id="platform" className="col-span-12 flex min-h-[340px] flex-col rounded-2xl border border-border bg-card p-5 lg:col-span-7 lg:p-6">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground"><span>BTC/USD · 1H</span><span>Last <b className="ml-2 text-foreground">$67,204.20</b></span></div>
            <div className="chart-grid relative mt-4 flex-1 overflow-hidden rounded-xl border border-border/60 bg-background/45">
              <div className="absolute left-5 top-5"><p className="font-head text-2xl font-semibold">$67,204.20</p><p className="mt-1 text-xs text-positive">+$1,241.62 today</p></div>
              <svg viewBox="0 0 700 240" className="absolute inset-x-0 bottom-0 h-[72%] w-full" preserveAspectRatio="none" aria-label="Bitcoin price chart rising over one hour">
                <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--signal)" stopOpacity=".28"/><stop offset="1" stopColor="var(--signal)" stopOpacity="0"/></linearGradient></defs>
                <path d="M0 205 L55 176 L110 188 L165 138 L220 151 L275 104 L330 124 L385 83 L440 91 L495 43 L550 73 L610 30 L665 47 L700 19 L700 240 L0 240Z" fill="url(#area)" />
                <polyline className="chart-trace" points="0,205 55,176 110,188 165,138 220,151 275,104 330,124 385,83 440,91 495,43 550,73 610,30 665,47 700,19" fill="none" stroke="var(--signal)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-muted-foreground"><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
            </div>
          </section>

          {stats.map(([value, label, copy]) => (
            <article key={label} className="col-span-12 rounded-2xl border border-border bg-card p-6 md:col-span-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
              <p className="mt-2 font-head text-4xl font-semibold">{value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
            </article>
          ))}

          <section id="markets" className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {markets.map(([code, name, detail]) => (
            <Link key={name} to="/auth" className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-signal/50">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-signal-soft font-head text-xs font-semibold text-signal">{code}</span>
                <span className="min-w-0 flex-1"><b className="block font-head text-sm font-semibold">{name}</b><small className="mt-1 block text-xs text-muted-foreground">{detail}</small></span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-signal" />
            </Link>
            ))}
          </section>

          <section id="insights" className="col-span-12 overflow-hidden rounded-2xl border border-border bg-card md:col-span-7">
            <div className="p-6">
              <span className="text-[11px] uppercase tracking-[0.2em] text-signal">Market insight</span>
              <h2 className="mt-3 max-w-[27ch] font-head text-2xl font-semibold text-balance">Read the tape before it moves the market.</h2>
              <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted-foreground">Analyst briefings, correlation maps and session openers — filtered to what could change your position.</p>
            </div>
            <img src={tradingRoom} alt="Professional trading desk with market charts" loading="lazy" width={1600} height={700} className="h-52 w-full object-cover" />
          </section>

          <section id="trust" className="col-span-12 rounded-2xl border border-border bg-card p-6 md:col-span-5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Why clients choose Heroes</span>
            <h2 className="mt-3 font-head text-2xl font-semibold">Control without compromise.</h2>
            <div className="mt-6 space-y-5">
              {[[Zap, "Fast execution", "Low-latency routing built for volatile markets."], [ShieldCheck, "Protected funds", "Client assets are kept separate and safeguarded."], [LockKeyhole, "Serious security", "Layered account protection around the clock."]].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof Zap;
                return <div key={title as string} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal"><FeatureIcon className="size-4" /></span><div><h3 className="font-head text-sm font-semibold">{title as string}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy as string}</p></div></div>;
              })}
            </div>
          </section>

          <section className="col-span-12 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4"><div><span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">From the trading floor</span><h2 className="mt-2 font-head text-2xl font-semibold">Built for decisive traders.</h2></div><BarChart3 className="hidden size-7 text-signal sm:block" /></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <blockquote className="rounded-xl border border-border bg-background/40 p-5"><p className="text-sm leading-6 text-foreground/80">“The execution is genuinely institutional. I moved my active book here and never looked back.”</p><footer className="mt-4 text-xs text-muted-foreground">M. Adeyemi · FX trader</footer></blockquote>
              <blockquote className="rounded-xl border border-border bg-background/40 p-5"><p className="text-sm leading-6 text-foreground/80">“The market view gives me the signal I need without burying it under unnecessary noise.”</p><footer className="mt-4 text-xs text-muted-foreground">L. Vasquez · Portfolio manager</footer></blockquote>
            </div>
          </section>

          <section className="col-span-12 flex flex-col items-start justify-between gap-5 rounded-2xl bg-primary p-7 text-primary-foreground sm:flex-row sm:items-center lg:p-9">
            <div><h2 className="max-w-[26ch] font-head text-2xl font-semibold text-balance">Your next market move starts here.</h2><p className="mt-2 text-sm text-primary-foreground/75">Open an account and step into the control room.</p></div>
            <Link className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5" to="/auth">Open account <ArrowRight className="size-4" /></Link>
          </section>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between"><Brand /><p className="max-w-2xl leading-5">Trading leveraged products carries a high level of risk and may not be suitable for all investors. Consider your objectives and experience before trading.</p><span>© 2026 HeroesMarkets</span></div>
      </footer>
    </div>
  );
}