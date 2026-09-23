import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BanknoteArrowUp, ChevronRight, LockKeyhole, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import tradingRoom from "../assets/trading-control-room.jpg";
import tradingFloorAsset from "../assets/heroes-trading-floor.jpg.asset.json";
import { Button } from "@/components/ui/button";

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

const withdrawalNotices = [
  ["Michael", "$40,000"],
  ["Jessica", "$12,500"],
  ["Christopher", "$28,750"],
  ["Ashley", "$8,200"],
  ["Daniel", "$55,000"],
];

const markets = [
  ["FX", "Forex", "72 majors & minors"],
  ["₿", "Crypto", "240 spot & futures pairs"],
  ["AU", "Commodities", "Metals, energy & agriculture"],
  ["SP", "Stocks & Indexes", "9,000+ global instruments"],
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
  const [noticeIndex, setNoticeIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNoticeIndex((current) => (current + 1) % withdrawalNotices.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  const notice = withdrawalNotices[noticeIndex] ?? withdrawalNotices[0];

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

      <aside className="notice-pill fixed right-3 top-1/2 z-40 w-[min(80vw,15rem)] -translate-y-1/2 rounded-xl border border-notice/40 bg-notice-soft/95 p-3.5 text-notice shadow-lg backdrop-blur-sm sm:right-5" aria-live="polite">
        <div className="flex items-center gap-2 border-b border-notice/25 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
          <BanknoteArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
          Withdrawal
        </div>
        <div className="notice-face mt-2.5">
          <p key={noticeIndex} className="notice-msg text-sm leading-5">
            <span className="font-semibold text-foreground">{notice?.[0]}</span>
            <br />
            just made a withdrawal of{" "}
            <span className="font-semibold text-foreground">{notice?.[1]}</span>
          </p>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          {withdrawalNotices.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i === noticeIndex ? "bg-notice" : "bg-notice/30"}`} />
          ))}
        </div>
      </aside>

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
          <section id="platform" className="col-span-12 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-[260px] sm:h-[360px] lg:h-[430px]">
              <img src={tradingFloorAsset.url} alt="Professional traders monitoring global markets" width={1320} height={640} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-md border border-border bg-background/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-signal backdrop-blur-sm">
                <span className="pulse-dot size-1.5 rounded-full bg-signal" /> Live market access
              </div>
            </div>

            <div className="grid gap-10 px-5 pb-8 pt-2 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:px-12 lg:pb-12">
              <div>
                <h1 className="max-w-[15ch] font-head text-5xl font-semibold leading-[1.05] text-balance sm:text-6xl lg:text-7xl">Get more <span className="text-signal">freedom</span> in the markets.</h1>
                <p className="mt-6 max-w-[52ch] text-base leading-7 text-muted-foreground sm:text-lg">Trade cryptocurrencies, stock indexes, commodities and Forex with a wide spread. Experience seamless trading with low commissions.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-12 px-7 text-base"><Link to="/auth">Login Account <ArrowRight /></Link></Button>
                  <Button asChild size="lg" variant="secondary" className="h-12 px-7 text-base"><Link to="/auth">Open Account</Link></Button>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-border pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                {[["50K+", "Active traders"], ["$2B+", "Daily volume"], ["99.9%", "Uptime"]].map(([value, label]) => (
                  <div key={label} className="min-w-0 border-r border-border px-3 first:pl-0 last:border-r-0 last:pr-0">
                    <p className="font-head text-2xl font-semibold sm:text-3xl">{value}</p>
                    <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

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