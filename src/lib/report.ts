import type { Decision, Conflict } from "@/types";

export interface MvpReport {
  title: string;
  productSummary: string;
  mvpScope: string[];
  userFlow: string[];
  architecture: string;
  dbSchema: string[];
  apiEndpoints: string[];
  backlog: string[];
  implementationPlan: string[];
  risks: string[];
}

export function generateReport(
  _decisions: Decision[],
  _conflicts: Conflict[],
): MvpReport {
  return {
    title: "Product Strategy Session — MVP Report",

    productSummary:
      "The council has aligned on a focused MVP that prioritizes the core user workflow above all else. " +
      "Authentication will use a mock implementation to keep scope minimal, with a clear upgrade path " +
      "to real auth in v2. Onboarding, the primary workflow, and basic account management define the " +
      "initial release boundary.",

    mvpScope: [
      "User onboarding (sign-up, preference setup, guided first action)",
      "Core workflow — single primary user action end-to-end",
      "Account management (profile, settings placeholder)",
      "Mock authentication with JWT stub (real auth deferred to v2)",
      "Empty state handling for all major views",
      "Error recovery and user-facing error messages",
    ],

    userFlow: [
      "1. Landing page → 'Get Started' CTA",
      "2. Sign up (email + password via mock auth)",
      "3. Onboarding wizard — 3 steps: profile, preferences, first action preview",
      "4. Dashboard — core workflow execution",
      "5. Success state + next-step prompt",
      "6. Account management accessible via nav",
    ],

    architecture:
      "Frontend: Next.js (App Router) + Tailwind CSS v4\n" +
      "Auth: Mock JWT stub — upgrade to NextAuth or Clerk in v2\n" +
      "State: React Context (global) + local component state\n" +
      "Persistence: Browser localStorage for MVP (migrate to DB in v2)\n" +
      "Deployment: Vercel (zero-config)\n" +
      "No dedicated backend for MVP — API routes via Next.js if needed",

    dbSchema: [
      "users          — id, email, name, created_at",
      "sessions       — id, user_id, token, expires_at",
      "preferences    — id, user_id, key, value",
      "workflow_runs  — id, user_id, status, result, created_at",
    ],

    apiEndpoints: [
      "POST   /api/auth/signup        — Create account",
      "POST   /api/auth/login         — Authenticate user",
      "GET    /api/me                 — Current user profile",
      "PUT    /api/me                 — Update profile",
      "GET    /api/preferences        — Fetch user preferences",
      "PUT    /api/preferences        — Update preferences",
      "POST   /api/workflow/run       — Execute core workflow",
      "GET    /api/workflow/:id       — Get run result",
    ],

    backlog: [
      "[ ] Project scaffold + Tailwind setup",
      "[ ] Mock auth flow (sign-up, login, session)",
      "[ ] Onboarding wizard (3-step)",
      "[ ] Core workflow UI + execution logic",
      "[ ] Dashboard layout + empty state",
      "[ ] Error boundary + error recovery screens",
      "[ ] Account management page",
      "[ ] Responsive design audit",
      "[ ] QA pass — edge cases per QA agent review",
      "[ ] Deploy to Vercel + smoke test",
    ],

    implementationPlan: [
      "Week 1 — Foundation: scaffold, mock auth, sign-up + login screens",
      "Week 2 — Core: onboarding wizard, dashboard, workflow execution",
      "Week 3 — Polish: empty states, error handling, account management",
      "Week 4 — QA + Launch: edge case testing, responsive audit, deployment",
    ],

    risks: [
      "Mock auth must never reach production — add environment gate before v2",
      "Core workflow scope creep: council decision limits to one primary action",
      "Empty state coverage may be underestimated — QA flagged as top risk",
      "localStorage has no cross-device sync — communicate limitation clearly in UI",
      "Onboarding drop-off: keep wizard to ≤3 steps per designer recommendation",
    ],
  };
}

export function reportToMarkdown(report: MvpReport): string {
  const lines: string[] = [];

  lines.push(`# ${report.title}`, "");

  lines.push("## Product Summary", "", report.productSummary, "");

  lines.push("## MVP Scope", "");
  report.mvpScope.forEach((item) => lines.push(`- ${item}`));
  lines.push("");

  lines.push("## User Flow", "");
  report.userFlow.forEach((step) => lines.push(step));
  lines.push("");

  lines.push("## Architecture", "");
  lines.push("```");
  lines.push(report.architecture);
  lines.push("```");
  lines.push("");

  lines.push("## Database Schema", "");
  report.dbSchema.forEach((row) => lines.push(`- \`${row}\``));
  lines.push("");

  lines.push("## API Endpoints", "");
  report.apiEndpoints.forEach((ep) => lines.push(`- \`${ep}\``));
  lines.push("");

  lines.push("## Backlog", "");
  report.backlog.forEach((item) => lines.push(item));
  lines.push("");

  lines.push("## Implementation Plan", "");
  report.implementationPlan.forEach((phase) => lines.push(`- ${phase}`));
  lines.push("");

  lines.push("## Risks & Open Questions", "");
  report.risks.forEach((risk) => lines.push(`- ${risk}`));
  lines.push("");

  lines.push("---");
  lines.push("*Generated by AgentForge — AI Product Council*");

  return lines.join("\n");
}

export function exportMarkdown(report: MvpReport, filename = "agentforge-report.md"): void {
  const md = reportToMarkdown(report);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
