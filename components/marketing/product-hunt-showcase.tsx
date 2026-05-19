"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  Inbox,
  LayoutDashboard,
  Search,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                              Brand Logo                                      */
/* -------------------------------------------------------------------------- */

function RequoLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("text-primary", className)}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="m18.762 27.812c7.4922 0.94531 13.793-5.3555 12.848-12.848-0.64453-5.1055-4.7656-9.2266-9.8711-9.8711-7.4922-0.94531-13.793 5.3555-12.848 12.848 0.64453 5.1055 4.7656 9.2266 9.8711 9.8711z" />
      <path d="m71.438 24.273c3.1484 3.3516 8.2305 4.8633 13.543 2.457 2.2383-1.0117 4.0625-2.8281 5.0664-5.0703 3.7852-8.457-2.2969-16.66-10.301-16.66-4.8711 0-8.9922 3.0586-10.648 7.3516-0.058594 0.15625-0.20703 0.26172-0.375 0.26172h-23.945c-0.95312 0-1.875 0.43359-2.4219 1.2148-2.1875 3.1211-0.011719 6.4688 2.9531 6.4688h13.195c0.22656 0 0.26953 0.3125 0.058594 0.38672-10.301 3.6211-17.023 8.7188-20.945 12.262-17.57 15.891-22.605 40.23-22.621 40.305 0 0.003906-0.007813 0.042969-0.027344 0.089844-0.035156 0.082031-0.097656 0.14844-0.17578 0.19141-4.9258 2.6836-7.7109 8.8008-4.8516 15.207 1.0039 2.25 2.8164 4.082 5.0625 5.0938 8.4688 3.8203 16.695-2.2734 16.695-10.285 0-4.3555-2.457-8.1055-6.0391-10.039-0.16016-0.085937-0.25-0.26562-0.21094-0.44531 4.8281-23.574 22.625-42.469 45.582-48.902 0.14453-0.039062 0.30078 0.003906 0.40234 0.11328z" />
      <path d="m83.59 71.867v-29.711c0-2.0078-1.4688-3.7969-3.4648-3.9883-2.293-0.21875-4.2188 1.5781-4.2188 3.8242v29.867c0 0.53906-0.30469 1.0391-0.79688 1.2578-4.1836 1.8594-7.0586 6.1133-6.7969 11.047 0.29297 5.543 5.4062 10.594 10.953 10.824 6.5469 0.26953 11.938-4.957 11.938-11.445 0-4.668-2.8086-8.6445-6.8164-10.426-0.49219-0.21875-0.79688-0.71484-0.79688-1.25z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                  Full App Preview (sidebar + content)                        */
/* -------------------------------------------------------------------------- */

const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: Inbox, label: "Inquiries", active: false },
  { icon: FileText, label: "Quotes", active: false },
  { icon: BellRing, label: "Follow-ups", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
];

function AppShell({ children, activeNav }: { children: React.ReactNode; activeNav: string }) {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Sidebar */}
      <div className="flex w-[172px] shrink-0 flex-col border-r border-border/50 bg-[#f8faf8]">
        {/* Business */}
        <div className="flex items-center gap-2.5 border-b border-border/40 px-3.5 py-3">
          <RequoLogo className="size-5" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">BrightSide</p>
            <p className="truncate text-[8px] text-muted-foreground">Print & Reno studio</p>
          </div>
        </div>
        {/* Nav */}
        <div className="flex flex-col gap-0.5 px-2 py-2">
          {sidebarNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.label.toLowerCase() === activeNav;
            return (
              <div key={item.label} className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground",
              )}>
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
        {/* Bottom */}
        <div className="mt-auto border-t border-border/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">JS</span>
            <span className="text-[10px] text-muted-foreground">Jordan S.</span>
          </div>
        </div>
      </div>
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Preview: Dashboard                                  */
/* -------------------------------------------------------------------------- */

function DashboardApp() {
  return (
    <AppShell activeNav="dashboard">
      <div className="border-b border-border/40 px-5 py-3">
        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Overview</p>
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Dashboard</h3>
      </div>
      <div className="flex-1 overflow-hidden px-5 py-3.5">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: "New inquiries", value: "4", delta: "+2 today", up: true },
            { label: "Quotes sent", value: "8", delta: "+3 this week", up: true },
            { label: "View rate", value: "75%", delta: "+6 pts", up: true },
            { label: "Won this week", value: "$12.4k", delta: "3 jobs", up: true },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-card px-2.5 py-2.5">
              <p className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-[16px] font-bold text-foreground">{s.value}</p>
              <p className="flex items-center gap-0.5 text-[9px] font-medium text-primary">
                <TrendingUp className="size-2.5" /> {s.delta}
              </p>
            </div>
          ))}
        </div>
        {/* Needs attention */}
        <p className="mb-1.5 mt-4 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Needs attention</p>
        {[
          { text: "Q-1042 viewed 2 days ago — no reply", tag: "Follow up", color: "bg-destructive/10 text-destructive" },
          { text: "New inquiry from Leo Park — tile repair", tag: "New", color: "bg-primary/10 text-primary" },
          { text: "Follow-up due today — Maya Fields", tag: "Due", color: "bg-primary/10 text-primary" },
        ].map((a, i) => (
          <div key={i} className="mb-1.5 flex items-center justify-between rounded-lg border border-border/30 bg-card px-3 py-2">
            <p className="text-[10px] text-foreground">{a.text}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[8px] font-semibold", a.color)}>{a.tag}</span>
          </div>
        ))}
        {/* Live event */}
        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" /><span className="relative inline-flex size-1.5 rounded-full bg-primary" /></span>
          <p className="text-[10px] font-medium text-primary">Sarah Jenkins is viewing Q-1042 right now</p>
          <Eye className="ml-auto size-3 text-primary/60" />
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Preview: Inquiries                                  */
/* -------------------------------------------------------------------------- */

function InquiriesApp() {
  return (
    <AppShell activeNav="inquiries">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Inquiries</p>
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">All inquiries</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1 text-[9px] text-muted-foreground"><Search className="size-3" />Search...</span>
          <span className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground">+ New inquiry</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-5 py-2">
        {/* Table header */}
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_auto] gap-3 border-b border-border/40 py-2 text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Customer</span><span>Service</span><span>Received</span><span>Status</span>
        </div>
        {[
          { name: "Sarah Jenkins", email: "sarah@jenkins.co", service: "Kitchen remodel", time: "10:24 AM", badge: "New", style: "bg-primary/10 text-primary" },
          { name: "Leo Park", email: "leo@parkdesign.co", service: "Tile repair", time: "Yesterday", badge: "Quoted", style: "bg-muted text-muted-foreground" },
          { name: "Maya Fields", email: "maya@fields.io", service: "Studio fit-out", time: "Mon", badge: "Viewed", style: "bg-accent text-accent-foreground" },
          { name: "James Chen", email: "james@chen.com", service: "Bathroom reno", time: "Mon", badge: "Won", style: "bg-primary/10 text-primary" },
          { name: "Anna Kowalski", email: "anna@kowalski.co", service: "Outdoor deck", time: "Last week", badge: "New", style: "bg-primary/10 text-primary" },
        ].map((r, i) => (
          <div key={i} className={cn(
            "grid grid-cols-[1.5fr_1fr_0.8fr_auto] items-center gap-3 border-b border-border/20 py-2.5",
            i === 0 && "bg-primary/[0.02]",
          )}>
            <div>
              <p className="text-[11px] font-medium text-foreground">{r.name}</p>
              <p className="text-[9px] text-muted-foreground">{r.email}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{r.service}</p>
            <p className="text-[9px] text-muted-foreground">{r.time}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[8px] font-semibold", r.style)}>{r.badge}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Preview: Quote Detail                                */
/* -------------------------------------------------------------------------- */

function QuoteApp() {
  return (
    <AppShell activeNav="quotes">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Quote</p>
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Q-1042 — Sarah Jenkins</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1 text-[10px] text-muted-foreground"><Copy className="size-3" />Copy link</span>
          <span className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground"><Send className="size-3" />Send quote</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-5 py-3.5">
        {/* Status bar */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-medium text-primary"><Eye className="size-3" />Viewed by customer</span>
          <span className="text-[9px] text-muted-foreground">Kitchen remodel · Expires Jun 2</span>
        </div>
        {/* Line items table */}
        <div className="mt-3 rounded-lg border border-border/40 bg-card">
          <div className="border-b border-border/30 px-4 py-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Line items</div>
          {[
            { item: "Design consultation (2 hrs)", price: "$150" },
            { item: "Cabinet supply + installation", price: "$2,400" },
            { item: "Countertop & backsplash", price: "$1,800" },
            { item: "Project coordination", price: "$350" },
          ].map((l, i) => (
            <div key={i} className="flex justify-between border-b border-border/15 px-4 py-2 text-[11px] last:border-0">
              <span className="text-foreground">{l.item}</span>
              <span className="font-medium tabular-nums text-foreground">{l.price}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border/40 bg-muted/30 px-4 py-2.5">
            <span className="text-[12px] font-semibold text-foreground">Total</span>
            <span className="text-[16px] font-bold text-primary">$4,700</span>
          </div>
        </div>
        {/* Note */}
        <div className="mt-3 rounded-lg border border-border/30 bg-card px-4 py-2.5">
          <p className="text-[9px] font-medium text-muted-foreground">Note to customer</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-foreground">Includes materials and labor. Payment 50% upfront, 50% on completion. Happy to walk through any questions.</p>
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Preview: Follow-ups                                 */
/* -------------------------------------------------------------------------- */

function FollowUpsApp() {
  return (
    <AppShell activeNav="follow-ups">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Follow-ups</p>
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">This week</h3>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[9px] font-semibold text-primary">4 pending</span>
      </div>
      <div className="flex-1 overflow-hidden px-5 py-3.5">
        {[
          { name: "Sarah Jenkins", quote: "Q-1042", note: "Viewed 2 days ago, no reply yet", tone: "overdue" as const },
          { name: "Maya Fields", quote: "Q-1038", note: "Follow-up due today", tone: "due" as const },
          { name: "Leo Park", quote: "Q-1035", note: "Tomorrow at 9:00 AM", tone: "upcoming" as const },
          { name: "James Chen", quote: "Q-1033", note: "Completed — accepted the quote", tone: "done" as const },
        ].map((t, i) => (
          <div key={i} className="mb-2 flex items-center gap-3 rounded-lg border border-border/40 bg-card px-3.5 py-2.5 transition-colors hover:bg-accent/30">
            <span className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              t.tone === "overdue" && "bg-destructive/10 text-destructive",
              t.tone === "due" && "bg-primary/10 text-primary",
              t.tone === "upcoming" && "bg-muted text-muted-foreground",
              t.tone === "done" && "bg-primary/10 text-primary",
            )}>
              {t.tone === "done" ? <CheckCircle2 className="size-3.5" /> : <BellRing className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground">{t.name} <span className="font-normal text-muted-foreground">· {t.quote}</span></p>
              <p className="text-[9px] text-muted-foreground">{t.note}</p>
            </div>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/40" />
          </div>
        ))}
        {/* AI suggestion */}
        <div className="mt-2.5 rounded-lg border border-primary/20 bg-primary/[0.04] px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-[9px] font-semibold text-primary"><Sparkles className="size-3" />AI-suggested message for Sarah</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">&ldquo;Hi Sarah — just checking in on the kitchen quote. Happy to answer any questions or adjust the scope.&rdquo;</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">Send</span>
            <span className="rounded-md border border-border/50 px-2 py-0.5 text-[9px] text-muted-foreground">Edit</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Preview: AI Assistant                                */
/* -------------------------------------------------------------------------- */

function AiApp() {
  return (
    <AppShell activeNav="dashboard">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="size-3 text-primary" />
          </span>
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">AI Assistant</h3>
        </div>
        <span className="text-[9px] text-muted-foreground">Based on your pricing history</span>
      </div>
      <div className="flex-1 overflow-hidden px-5 py-3.5">
        {/* User message */}
        <div className="mb-3 flex gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground">JS</span>
          <div className="max-w-[80%] rounded-xl rounded-tl-sm border border-border/40 bg-card px-3.5 py-2.5 text-[11px] text-foreground">
            Draft a quote for Sarah&apos;s kitchen remodel — cabinets, countertop, backsplash, and a consultation.
          </div>
        </div>
        {/* AI response */}
        <div className="mb-3 flex gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><Sparkles className="size-3 text-primary" /></span>
          <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-primary/20 bg-primary/[0.03] px-3.5 py-2.5 text-[11px]">
            <p className="mb-2 font-medium text-foreground">Here&apos;s a draft based on your last 3 kitchen jobs:</p>
            <div className="rounded-lg border border-border/30 bg-card px-3 py-2 text-[10px]">
              <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Design consultation</span><span className="font-medium tabular-nums text-foreground">$150</span></div>
              <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Cabinet supply + install</span><span className="font-medium tabular-nums text-foreground">$2,400</span></div>
              <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Countertop + backsplash</span><span className="font-medium tabular-nums text-foreground">$1,800</span></div>
              <div className="mt-1.5 flex justify-between border-t border-border/30 pt-1.5"><span className="font-semibold text-foreground">Total</span><span className="font-bold text-primary">$4,350</span></div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Pulled from your pricing history. Want to add a coordination fee?</p>
          </div>
        </div>
        {/* User reply */}
        <div className="flex gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground">JS</span>
          <div className="max-w-[80%] rounded-xl rounded-tl-sm border border-border/40 bg-card px-3.5 py-2.5 text-[11px] text-foreground">
            Add $350 for coordination and send it to Sarah.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Preview: Public Quote Page                           */
/* -------------------------------------------------------------------------- */

function PublicQuoteApp() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2.5 border-b border-border/50 bg-[#f5f5f5] px-3.5 py-2">
        <div className="flex gap-1.5">
          <span className="size-[8px] rounded-full bg-[#ff5f56]" />
          <span className="size-[8px] rounded-full bg-[#ffbd2e]" />
          <span className="size-[8px] rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 rounded-md border border-border/40 bg-white px-3 py-1 text-[9px] text-muted-foreground">
          <span className="text-primary/60">🔒</span> requo.com/q/brightside/Q-1042
        </div>
      </div>
      {/* Page content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-5">
        <RequoLogo className="mb-1 size-7" />
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">BrightSide Renovations</p>
        <h3 className="mt-2 text-[16px] font-bold tracking-tight text-foreground">Kitchen Remodel</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Prepared for Sarah Jenkins · Valid until Jun 2, 2025</p>

        <div className="mt-4 w-full max-w-[280px] rounded-xl border border-border/40 bg-card p-4 shadow-sm">
          {[
            { item: "Design consultation", price: "$150" },
            { item: "Cabinet supply + install", price: "$2,400" },
            { item: "Countertop + backsplash", price: "$1,800" },
            { item: "Project coordination", price: "$350" },
          ].map((l, i) => (
            <div key={i} className="flex justify-between border-b border-border/15 py-1.5 text-[10px] last:border-0">
              <span className="text-muted-foreground">{l.item}</span>
              <span className="font-medium tabular-nums text-foreground">{l.price}</span>
            </div>
          ))}
          <div className="mt-2.5 flex justify-between border-t border-border/40 pt-2.5">
            <span className="text-[12px] font-semibold">Total</span>
            <span className="text-[16px] font-bold text-primary">$4,700</span>
          </div>
          <div className="mt-4 flex gap-2.5">
            <button className="flex-1 rounded-lg bg-primary py-2 text-[11px] font-semibold text-primary-foreground shadow-sm">Accept quote</button>
            <button className="flex-1 rounded-lg border border-border/60 py-2 text-[11px] text-muted-foreground">Decline</button>
          </div>
        </div>
        <p className="mt-3 text-[9px] text-muted-foreground">No account needed · Open, review, decide</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Slide Definitions                                   */
/* -------------------------------------------------------------------------- */

type Slide = {
  id: string;
  eyebrow: string;
  headline: string;
  sub: string;
  layout: "hero" | "app-full" | "app-center" | "cta";
  preview?: () => React.ReactNode;
};

const slides: Slide[] = [
  {
    id: "hero",
    eyebrow: "",
    headline: "Quotes that close.\nFollow-ups that land.",
    sub: "Requo helps service businesses turn inquiries into accepted quotes — no spreadsheets, no forgotten leads.",
    layout: "hero",
  },
  {
    id: "dashboard",
    eyebrow: "See what matters right now",
    headline: "New leads, viewed quotes,\nwhat needs a nudge.",
    sub: "Everything your business needs to act on — one screen, no digging.",
    layout: "app-full",
    preview: () => <DashboardApp />,
  },
  {
    id: "inquiries",
    eyebrow: "Every lead, one place",
    headline: "Forms, calls, DMs,\nreferrals — all here.",
    sub: "Whether someone filled your form or texted you at 11pm — it ends up in the same list.",
    layout: "app-full",
    preview: () => <InquiriesApp />,
  },
  {
    id: "quotes",
    eyebrow: "Build and send in seconds",
    headline: "Line items, total,\nshare link, done.",
    sub: "Reuse pricing from past jobs. Send the link on WhatsApp, text, email — wherever they are.",
    layout: "app-full",
    preview: () => <QuoteApp />,
  },
  {
    id: "public-quote",
    eyebrow: "What your customer sees",
    headline: "Open. Review.\nAccept or decline.",
    sub: "No app to download. No account to create. They tap the link, see the quote, and decide.",
    layout: "app-center",
    preview: () => <PublicQuoteApp />,
  },
  {
    id: "follow-ups",
    eyebrow: "Deals don't go quiet",
    headline: "Know who viewed.\nKnow who went silent.",
    sub: "Scheduled reminders with suggested messages. One tap to send, reschedule, or skip.",
    layout: "app-full",
    preview: () => <FollowUpsApp />,
  },
  {
    id: "ai",
    eyebrow: "AI handles the tedious parts",
    headline: "Draft quotes and\nfollow-ups in seconds.",
    sub: "It knows your pricing history. Tell it the job and it writes the quote. You review and send.",
    layout: "app-full",
    preview: () => <AiApp />,
  },
  {
    id: "cta",
    eyebrow: "",
    headline: "Try it free.\nTakes 2 minutes.",
    sub: "No credit card. Works on your phone and laptop. Set up a business and send your first quote today.",
    layout: "cta",
  },
];

/* -------------------------------------------------------------------------- */
/*                         Slide Renderer                                       */
/* -------------------------------------------------------------------------- */

function SlideView({ slide }: { slide: Slide }) {
  if (slide.layout === "hero") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 flex items-center gap-3">
          <RequoLogo className="size-11 sm:size-14" />
          <BrandWordmark className="text-[2.4rem] sm:text-[3.2rem]" />
        </div>
        <h1 className="max-w-[620px] whitespace-pre-line font-heading text-[2.2rem] font-bold leading-[1.06] tracking-tight text-foreground sm:text-[3rem]">
          {slide.headline}
        </h1>
        <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]">
          {slide.sub}
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg" className="gap-2 rounded-xl px-6 text-[15px] shadow-sm">
            <Link href="/signup">Start free <ArrowRight className="size-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl px-6 text-[15px]">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
        <p className="mt-5 text-[13px] text-muted-foreground">Free plan available · No credit card required</p>
      </div>
    );
  }

  if (slide.layout === "cta") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex items-center gap-2.5">
          <RequoLogo className="size-10" />
          <BrandWordmark className="text-[2rem]" />
        </div>
        <h2 className="mt-3 whitespace-pre-line font-heading text-[2.2rem] font-bold leading-[1.06] tracking-tight text-foreground sm:text-[2.8rem]">
          {slide.headline}
        </h2>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          {slide.sub}
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg" className="gap-2 rounded-xl px-6 text-[15px] shadow-sm">
            <Link href="/signup">Get started <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        <div className="mt-6 flex items-center gap-5 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />Free plan</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />No credit card</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />Any device</span>
        </div>
      </div>
    );
  }

  if (slide.layout === "app-center") {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 sm:px-10">
        <div className="flex w-full max-w-[920px] flex-col items-center gap-6 lg:flex-row lg:gap-10">
          {/* Text */}
          <div className="flex shrink-0 flex-col text-center lg:w-[280px] lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{slide.eyebrow}</p>
            <h2 className="mt-2 whitespace-pre-line font-heading text-[1.6rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2rem]">
              {slide.headline}
            </h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{slide.sub}</p>
          </div>
          {/* Preview */}
          <div className="h-[340px] w-full min-w-0 flex-1 sm:h-[380px]">
            {slide.preview?.()}
          </div>
        </div>
      </div>
    );
  }

  // app-full
  return (
    <div className="flex h-full w-full items-center justify-center px-6 sm:px-10">
      <div className="flex w-full max-w-[980px] flex-col items-center gap-5 lg:flex-row lg:gap-10">
        {/* Text */}
        <div className="flex shrink-0 flex-col text-center lg:w-[260px] lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{slide.eyebrow}</p>
          <h2 className="mt-2 whitespace-pre-line font-heading text-[1.6rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2rem]">
            {slide.headline}
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{slide.sub}</p>
        </div>
        {/* Preview */}
        <div className="h-[340px] w-full min-w-0 flex-1 sm:h-[380px]">
          {slide.preview?.()}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Export: Slide Deck                                   */
/* -------------------------------------------------------------------------- */

export function ProductHuntShowcase() {
  const [current, setCurrent] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setCurrent((p) => Math.min(p + 1, slides.length - 1)), []);
  const prev = useCallback(() => setCurrent((p) => Math.max(p - 1, 0)), []);

  const downloadPng = useCallback(async () => {
    if (!slideRef.current) return;
    try {
      const node = slideRef.current;
      const url = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#f7f9f7",
      });
      const a = document.createElement("a");
      a.download = `requo-${slides[current]?.id ?? "slide"}.png`;
      a.href = url;
      a.click();
    } catch (e) {
      console.error("Export failed", e);
    }
  }, [current]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    },
    [next, prev],
  );

  const slide = slides[current]!;

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#f7f9f7] outline-none"
      onKeyDown={onKey}
      tabIndex={0}
    >
      {/* Slide area */}
      <div
        ref={slideRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden"
      >
        {/* Branded background accents */}
        <div className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-[300px] rounded-full bg-primary/[0.03] blur-[80px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 size-[200px] rounded-full bg-primary/[0.02] blur-[60px]" />

        {/* Subtle grid pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,128,96,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,128,96,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Content */}
        <SlideView slide={slide} />

        {/* Brand watermark — bottom left */}
        <div className="absolute bottom-4 left-5 flex items-center gap-2 opacity-60 sm:bottom-5 sm:left-8">
          <RequoLogo className="size-4" />
          <BrandWordmark className="text-[0.85rem]" />
        </div>

        {/* Slide number — bottom right */}
        <div className="absolute bottom-4 right-5 text-[11px] font-medium tabular-nums text-muted-foreground/60 sm:bottom-5 sm:right-8">
          {current + 1} / {slides.length}
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-border/40 bg-white/80 px-4 py-2.5 backdrop-blur-md sm:px-6">
        {/* Navigation arrows */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={prev} disabled={current === 0} className="size-8 rounded-lg p-0">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={next} disabled={current === slides.length - 1} className="size-8 rounded-lg p-0">
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-2 text-[11px] text-muted-foreground">← → to navigate</span>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === current ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
              aria-label={`Slide ${i + 1}: ${s.id}`}
            />
          ))}
        </div>

        {/* Download */}
        <Button size="sm" onClick={downloadPng} className="gap-1.5 rounded-lg text-xs">
          <Download className="size-3.5" /> Export PNG
        </Button>
      </div>
    </div>
  );
}
