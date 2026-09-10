import {
  ArrowDown,
  Boxes,
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  GitBranch,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";

const runtimeSteps = [
  {
    title: "Next.js + Agent Elements",
    description: "Engineer asks a planning or incident question and sees specialist activity, evidence and approval state.",
    icon: Code2,
    badge: "UI",
  },
  {
    title: "Cloudflare Worker",
    description: "Owns the investigation API boundary, CORS, workflow creation, durable reads and approval events.",
    icon: Cloud,
    badge: "Workers",
  },
  {
    title: "Investigation Workflow",
    description: "Coordinates deterministic resolution, specialist execution, model synthesis and approval pause/resume.",
    icon: Workflow,
    badge: "Workflows",
  },
  {
    title: "Deterministic Orchestrator",
    description: "Selects at most three relevant specialists and resolves explicit graph relationships before model reasoning.",
    icon: GitBranch,
    badge: "Programmatic",
  },
  {
    title: "Workers AI",
    description: "Llama 3.3 synthesizes already-grounded specialist findings through AI Gateway with deterministic fallback.",
    icon: BrainCircuit,
    badge: "Workers AI",
  },
  {
    title: "Durable approval",
    description: "RCA actions pause with waitForEvent and resume only after an explicit human decision is sent back to the workflow.",
    icon: ShieldCheck,
    badge: "Durable Objects",
  },
];

const specialists = [
  ["Work", "Work-item impact, conflicts and related services"],
  ["Observability", "Trace, logs, metrics and runtime bottleneck localization"],
  ["Change", "Deployments, commits, source snapshots and change correlation"],
  ["Dependency", "Explicit upstream/downstream traversal and blast radius"],
  ["Knowledge", "ADRs and architecture constraints"],
] as const;

const providerRows = [
  ["Work items", "Mock Azure DevOps adapter", "replaceable"],
  ["Repositories", "Mock GitHub adapter", "replaceable"],
  ["Observability", "Seeded trace/log/metric provider", "replaceable"],
  ["Deployments", "Seeded deployment provider", "replaceable"],
  ["Architecture", "Seeded ADR provider", "replaceable"],
] as const;

export default function ArchitecturePage() {
  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="System design"
        title="How Org Brain reasons"
        description="Explicit engineering relationships first, bounded specialist analysis second, model synthesis third, human approval before any action boundary."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-8 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Production investigation path">
            Cloudflare execution
          </SectionLabel>
          <div className="grid gap-3 xl:grid-cols-6">
            {runtimeSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="contents">
                  <Card className="portal-card-hover border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm xl:min-h-[220px]">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl border bg-muted/35">
                          <Icon className="size-4" />
                        </span>
                        <Badge variant="outline" className="font-normal">
                          {step.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm leading-5">
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </CardContent>
                  </Card>
                  {index < runtimeSteps.length - 1 ? (
                    <div className="flex items-center justify-center xl:hidden">
                      <ArrowDown className="size-4 text-muted-foreground" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="space-y-3">
            <SectionLabel aside="No uncontrolled agent loop">
              Specialist boundaries
            </SectionLabel>
            <Card className="border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm">
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
                {specialists.map(([name, description], index) => (
                  <div
                    key={name}
                    className="portal-card-hover flex gap-3 rounded-xl border bg-background/45 p-3"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name} Agent</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <SectionLabel aside="Adapters, not hard-coded data access">
              Provider boundary
            </SectionLabel>
            <Card className="border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm">
              <CardContent className="space-y-3 p-4">
                {providerRows.map(([label, implementation, state]) => (
                  <div
                    key={label}
                    className="grid gap-2 rounded-xl border bg-background/45 p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {implementation}
                    </span>
                    <Badge variant="secondary" className="w-fit font-normal">
                      {state}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="The distinction matters">
            Deterministic vs model-driven
          </SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="size-4" /> Programmatic first
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Incident → trace → service → deployment → commit → work item.</p>
                <p>Dependencies come from explicit service edges.</p>
                <p>ADRs are resolved from explicit relationships.</p>
                <p>Scenario hidden truth is never provided to runtime agents.</p>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="size-4" /> AI where reasoning helps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Rank and explain evidence already gathered by specialists.</p>
                <p>Synthesize a concise RCA from runtime and change findings.</p>
                <p>Generate mitigation and remediation recommendations.</p>
                <p>Fall back to deterministic output when model inference fails.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="Submission honesty">
            What is real today
          </SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-emerald-500/20 bg-emerald-500/[0.035] shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="size-4" /> Implemented
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Workers, Workers AI, Workflows, Durable Objects and AI Gateway integration.</p>
                <p>Five specialist boundaries and deterministic context builders.</p>
                <p>Three coherent incident fixtures with hidden evaluation contracts.</p>
                <p>Human approval pause/resume and provider-handoff boundary.</p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/[0.035] shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Boxes className="size-4" /> Intentionally mocked
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Azure DevOps, GitHub, Elastic/ClickHouse and deployment mutations.</p>
                <p>Production adapters can replace mocks behind the existing provider contracts.</p>
                <p>No real rollback or external work-item creation occurs during the demo.</p>
                <p>Approval is a safety boundary, not permission for silent autonomous execution.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
