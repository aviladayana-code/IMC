"use client";

import { signOut, useSession } from "next-auth/react";
import {
  Activity,
  LayoutDashboard,
  PlusCircle,
  Users,
  History,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAppStore, type ViewKey } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const NAV: { key: ViewKey; label: string; icon: any; desc: string }[] = [
  { key: "dashboard", label: "Panel", icon: LayoutDashboard, desc: "Indicadores y resumen" },
  { key: "new-eval", label: "Nueva Evaluación", icon: PlusCircle, desc: "Registro antropométrico" },
  { key: "subjects", label: "Evaluados", icon: Users, desc: "Buscar y administrar" },
  { key: "history", label: "Historial", icon: History, desc: "Evolución longitudinal" },
  { key: "report", label: "Informe PDF", icon: FileText, desc: "Generar documento" },
];

function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50">
        { }
        <img src="/logo.svg" alt="Kinemetrix" className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-base tracking-tight text-foreground">
          Kinemetrix
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {subtitle ?? "Antropometría · IMC"}
        </span>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              setView(item.key);
              onNavigate?.();
            }}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
            <div className="flex flex-col items-start min-w-0">
              <span className="truncate">{item.label}</span>
              <span className="text-[10px] text-muted-foreground/80 truncate">{item.desc}</span>
            </div>
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Profesional";
  const email = session?.user?.email ?? "";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg bg-card border border-border/60 p-3">
      <Avatar className="h-9 w-9 border border-border/50">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-foreground">{name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{email}</p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Cerrar sesión</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const view = useAppStore((s) => s.view);
  const selectedSubjectId = useAppStore((s) => s.selectedSubjectId);

  const currentNav = NAV.find((n) => n.key === view);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-sidebar/50 backdrop-blur-sm z-30">
          <div className="flex flex-col h-full p-4">
            <div className="px-1 py-3">
              <BrandHeader />
            </div>
            <div className="mt-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/10">
              <p className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Protocolo OMS · Quetelet
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Criterios adultos ≥ 20 a · Z-score pediátrico &lt; 20 a
              </p>
            </div>
            <div className="mt-4 flex-1">
              <NavList />
            </div>
            <UserCard />
          </div>
        </aside>

        {/* Top bar + content */}
        <div className="flex-1 md:ml-72 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile menu */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                      </svg>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-4">
                    <div className="flex flex-col h-full">
                      <BrandHeader />
                      <div className="mt-4 flex-1">
                        <NavList onNavigate={() => setMobileOpen(false)} />
                      </div>
                      <UserCard />
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                  <span className="hidden sm:inline text-muted-foreground/60">Kinemetrix</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 hidden sm:inline" />
                  <span className="font-medium text-foreground truncate">{currentNav?.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedSubjectId && view !== "dashboard" && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Sujeto seleccionado
                  </span>
                )}
                <span className="hidden md:inline-flex text-[11px] items-center gap-1.5 text-muted-foreground bg-emerald-500/10 text-emerald-700 px-2 py-1 rounded-md font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  En línea
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
            {children}
          </main>
          <footer className="border-t border-border bg-background/80 backdrop-blur-sm">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                © {new Date().getFullYear()} Kinemetrix · Herramienta de evaluación antropométrica. El IMC no constituye una medición directa de composición corporal.
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Criterios OMS · ISAK-aligned · v1.0
              </p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
