"use client";

import { useSession } from "next-auth/react";
import { useAppStore } from "@/store/app-store";
import { AppShell } from "@/components/app/app-shell";
import { LoginView } from "@/components/views/login-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { NewEvaluationView } from "@/components/views/new-evaluation-view";
import { SubjectsView } from "@/components/views/subjects-view";
import { HistoryView } from "@/components/views/history-view";
import { ReportView } from "@/components/views/report-view";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const view = useAppStore((s) => s.view);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "new-eval" && <NewEvaluationView />}
      {view === "subjects" && <SubjectsView />}
      {view === "history" && <HistoryView />}
      {view === "report" && <ReportView />}
    </AppShell>
  );
}
