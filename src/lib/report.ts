import type { Decision, Conflict } from "@/types";

export interface MvpReport {
  projectName: string;
  productSummary: string;
  mvpScope: {
    inMvp: string[];
    postMvp: string[];
  };
  userFlow: string[];
  architecture: string;
  dataAndIntegrations: string[];
  implementationRoadmap: string[];
  risksAndOpenQuestions: string[];
  decisionLog: Array<{ stage: string; decision: string }>;
}

export function generateReport(
  _decisions: Decision[],
  _conflicts: Conflict[],
): MvpReport {
  return {
    projectName: "MVP Package",
    productSummary: "",
    mvpScope: { inMvp: [], postMvp: [] },
    userFlow: [],
    architecture: "",
    dataAndIntegrations: [],
    implementationRoadmap: [],
    risksAndOpenQuestions: [],
    decisionLog: [],
  };
}

export function reportToMarkdown(report: MvpReport): string {
  const lines: string[] = [];

  lines.push(`# ${report.projectName}`, "", "---", "");

  lines.push("## Product Summary", "", report.productSummary, "");

  lines.push("## MVP Scope", "");
  lines.push("### W MVP");
  report.mvpScope.inMvp.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("### Post-MVP / Poza zakresem");
  report.mvpScope.postMvp.forEach((item) => lines.push(`- ${item}`));
  lines.push("");

  lines.push("## User Flow", "");
  report.userFlow.forEach((step, i) => lines.push(`${i + 1}. ${step.replace(/^\d+\.\s*/, "")}`));
  lines.push("");

  lines.push("## Architecture", "");
  lines.push("```");
  lines.push(report.architecture);
  lines.push("```");
  lines.push("");

  lines.push("## Data & Integrations", "");
  report.dataAndIntegrations.forEach((item) => lines.push(`- ${item}`));
  lines.push("");

  lines.push("## Implementation Roadmap", "");
  report.implementationRoadmap.forEach((phase, i) => lines.push(`${i + 1}. ${phase.replace(/^(Faza \d+ — |Phase \d+ — )/, "")}`));
  lines.push("");

  lines.push("## Risks & Open Questions", "");
  report.risksAndOpenQuestions.forEach((item) => lines.push(`- ${item}`));
  lines.push("");

  lines.push("## Decision Log", "");
  report.decisionLog.forEach(({ stage, decision }) => {
    lines.push(`**${stage}:** ${decision}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("*Wygenerowane przez AgentForge — AI Product Council*");

  return lines.join("\n");
}

export function exportMarkdown(report: MvpReport, filename = "agentforge-mvp-package.md"): void {
  const md = reportToMarkdown(report);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
