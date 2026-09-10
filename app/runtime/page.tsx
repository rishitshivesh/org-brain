"use client";

import {
  Activity,
  BrainCircuit,
  Cloud,
  Database,
  RefreshCw,
  Route,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";

interface RuntimeHealth {
  status: string;
  runtime: string;
  ai: string;
  gateway: string;
  workflow: string;
  durableState: string;
  persistence: string;
  organizationProviders: string;
  memory: string;
}

type RuntimeState =
  | { state: "loading"; health: null; error: null }
  | { state: "connected"; health: RuntimeHealth; error: null }
  | { state: "local"; health: null; error: null }
  | { state: "error"; health: null; error: string };

const runtimeUrl = process.env.NEXT_PUBLIC_ORG_BRAIN_API_URL?.replace(/\/$/, "");

export default function RuntimePage() {
  const [runtime, setRuntime] = useState<RuntimeState>({
    state: runtimeUrl ? "loading" : "local",
    health: null,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    if (!runtimeUrl) {
      setRuntime({ state: "local", health: null, error: null });
      return;
    }

    setRuntime({ state: "loading", health: null, error: null });
    try {
      const response = await fetch(`${runtimeUrl}/health`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Worker responded with HTTP ${response.status}`);
      }
      const health = (await response.json()) as RuntimeHealth;
      setRuntime({ state: "connected", health, error: null });
    } catch (error) {
      setRuntime({
        state: "error",
        health: null,
        error: error instanceof Error ? error.message : "Runtime check failed",
      });
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const connected = runtime.state === "connected";
  const health = connected ? runtime.health : null;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Cloudflare runtime"
        title="Execution health"
        description="Verify the deployed investigation boundary from inside the portal, including model routing, persistent providers, durable state and organizational memory."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void checkHealth()}
            disabled={runtime.state === "loading"}
          >
            <RefreshCw
              className={runtime.state === "loading" ? "animate-spin" : ""}
            />
            Recheck
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-7 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Live portal-to-worker check">
            Runtime pulse
          </SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Cloud}
              label="Worker"
              value={
                runtime.state === "loading"
                  ? "Checking"
                  : connected
                    ? "Online"
                    : runtime.state === "local"
                      ? "Local"
                      : "Offline"
              }
              hint={runtimeUrl ?? "No remote runtime configured"}
            />
            <MetricCard
              icon={BrainCircuit}
              label="Model"
              value={connected ? "Llama 3.3" : "—"}
              hint={health?.ai ?? "Available when Worker is connected"}
            />
            <MetricCard
              icon={Database}
              label="Providers"
              value={
                connected
                  ? health?.organizationProviders === "d1"
                    ? "D1"
                    : "Seed"
                  : "—"
              }
              hint={health?.organizationProviders ?? "Organization context"}
            />
            <MetricCard
              icon={BrainCircuit}
              label="Memory"
              value={
                connected
                  ? health?.memory === "vectorize"
                    ? "Vectorize"
                    : "D1 fallback"
                  : "—"
              }
              hint={health?.memory ?? "Historical RCA retrieval"}
            />
          </div>
        </div>

        {runtime.state === "local" ? (
          <Card className="border-amber-500/20 bg-amber-500/[0.035] shadow-none">
            <CardContent className="flex gap-3 p-4 text-sm leading-6">
              <Activity className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">Running in local orchestration mode</p>
                <p className="text-muted-foreground">
                  Configure NEXT_PUBLIC_ORG_BRAIN_API_URL to point at the Worker.
                  Ask continues to function locally, but the D1-backed provider,
                  Workflow, memory and Workers AI execution path are not active
                  in this browser.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {runtime.state === "error" ? (
          <Card className="border-destructive/25 bg-destructive/[0.035] shadow-none">
            <CardContent className="flex gap-3 p-4 text-sm leading-6">
              <Activity className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Worker health check failed</p>
                <p className="text-muted-foreground">{runtime.error}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check deployment state, CORS and NEXT_PUBLIC_ORG_BRAIN_API_URL.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {connected ? (
          <div className="space-y-3">
            <SectionLabel aside="Safe metadata returned by GET /health">
              Connected services
            </SectionLabel>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="portal-card-hover border-emerald-500/20 bg-card/82 shadow-none backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      Cloudflare investigation runtime
                    </CardTitle>
                    <Badge variant="secondary">healthy</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ["Runtime", health.runtime],
                    ["Workers AI", health.ai],
                    ["AI Gateway", health.gateway],
                    ["Workflow", health.workflow],
                    ["Durable state", health.durableState],
                    ["Organization provider", health.organizationProviders],
                    ["History persistence", health.persistence],
                    ["Organization memory", health.memory],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="max-w-[65%] truncate text-right font-mono text-xs">
                        {value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="portal-card-hover border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Route className="size-4" /> Investigation API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 font-mono text-xs">
                  {[
                    "POST /v1/investigations",
                    "GET /v1/investigations/:id",
                    "PATCH /v1/investigations/:id/remediation",
                    "POST /v1/investigations/:id/approval",
                    "GET /v1/history",
                    "GET /v1/memory/search?q=...",
                    "GET /v1/handoffs",
                  ].map((endpoint) => (
                    <div
                      key={endpoint}
                      className="rounded-lg border bg-background/45 px-3 py-2.5"
                    >
                      {endpoint}
                    </div>
                  ))}
                  <p className="pt-2 font-sans text-xs leading-5 text-muted-foreground">
                    Investigations continue inside a durable Workflow, run their
                    specialists against D1-backed provider data, archive results,
                    retrieve prior engineering memory and preserve human approval
                    before provider handoff.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
