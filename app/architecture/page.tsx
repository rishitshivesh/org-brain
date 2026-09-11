import {
  ArrowDown,
  Boxes,
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  GitBranch,
  History,
  Network,
  Send,
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
    description:
      "Engineer asks a planning or incident question, sees specialist activity and reviews any proposed action.",
    icon: Code2,
    badge: "UI",
  },
  {
    title: "Cloudflare Worker",
    description:
      "Owns the investigation, history, memory, remediation and approval API boundary.",
    icon: Cloud,
    badge: "Workers",
  },
  {
    title: "Investigation Workflow",
    description:
      "Coordinates persistent context, specialists, memory retrieval, model synthesis and human pause/resume.",
    icon: Workflow,
    badge: "Workflows",
  },
  {
    title: "D1 provider layer",
    description:
      "The coherent organization graph is seeded once and read through the same provider contracts used by every specialist.",
    icon: Database,
    badge: "D1",
  },
  {
    title: "Workers AI + memory",
    description:
      "Llama 3.3 synthesizes grounded evidence with prior RCA, ADR and work-item context retrieved from Vectorize or D1 fallback.",
    icon: BrainCircuit,
    badge: "AI + Vectorize",
  },
  {
    title: "Human-approved handoff",
    description:
      "The Workflow waits for an explicit decision, reads the latest editable remediation draft and records the provider handoff without external mutation.",
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
  ["Work items", "D1-backed provider + durable draft handoff", "active"],
  ["Repositories", "D1-backed repository / commit / source provider", "active"],
  ["Observability", "D1-backed trace / log / metric provider", "active"],
  ["Deployments", "D1-backed deployment provider", "active"],
  ["Architecture", "D1-backed ADR provider + Vectorize memory", "active"],
] as const;

export default function ArchitecturePage() {
  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="System design"
        title="How Org Brain reasons"
        description="Persistent engineering relationships first, bounded specialist analysis second, retrieval-aware model synthesis third, human approval before provider handoff."
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
                  <Card className="portal-card-hover border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm xl:min-h-[230px]">
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
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
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
            <SectionLabel aside="Same contracts, persisted implementation">
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
          <SectionLabel aside="Memory is useful only when it closes the loop">
            Investigation lifecycle
          </SectionLabel>
          <div className="grid gap-3 md:grid-cols-5">
            {[
              [GitBranch, "Investigate", "Bounded specialists build evidence"],
              [
                BrainCircuit,
                "Synthesize",
                "Workers AI explains grounded context",
              ],
              [ShieldCheck, "Approve", "Workflow pauses for a human decision"],
              [Send, "Handoff", "Latest remediation draft is recorded in D1"],
              [
                History,
                "Remember",
                "RCA becomes searchable organizational memory",
              ],
            ].map(([Icon, title, description]) => {
              const StepIcon = Icon as typeof GitBranch;
              return (
                <Card
                  key={String(title)}
                  className="portal-card-hover border-foreground/10 bg-card/82 shadow-none"
                >
                  <CardContent className="p-4">
                    <StepIcon className="size-4 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">{String(title)}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {String(description)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
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
                <p>
                  Incident → trace → service → deployment → commit → work item.
                </p>
                <p>Dependencies come from explicit D1-backed service edges.</p>
                <p>ADRs and source snapshots are resolved before inference.</p>
                <p>
                  Scenario hidden truth is never provided to runtime agents.
                </p>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="size-4" /> AI where reasoning helps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Rank and explain evidence already gathered by specialists.
                </p>
                <p>
                  Use retrieved prior RCAs, ADRs and work items as precedent.
                </p>
                <p>Synthesize mitigation and remediation recommendations.</p>
                <p>
                  Fall back to deterministic output when model inference fails.
                </p>
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
                <p>
                  Workers, Workers AI, Workflows, Durable Objects and AI
                  Gateway.
                </p>
                <p>
                  D1-backed organization providers, history and handoff ledger.
                </p>
                <p>
                  Vectorize organizational memory for ADRs, work items and RCAs.
                </p>
                <p>Editable remediation before durable human approval.</p>
                <p>
                  Three coherent incident fixtures plus a hidden-truth
                  evaluation harness.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/[0.035] shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Boxes className="size-4" /> Intentionally externalized
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Live Azure DevOps, GitHub, Elastic/ClickHouse and deployment
                  mutations.
                </p>
                <p>
                  The demo persists provider-shaped data in D1 behind the same
                  interfaces.
                </p>
                <p>
                  No real rollback or third-party work-item creation occurs
                  during review.
                </p>
                <p>
                  Approval permits a provider handoff record, never silent
                  autonomous execution.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
