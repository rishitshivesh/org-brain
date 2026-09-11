"use client";

import { CheckCircle2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRemoteHandoffs,
  isCloudflareRuntimeConfigured,
  type RemoteHandoff,
} from "@/lib/cloudflare-runtime";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";

export default function HandoffsPage() {
  const configured = isCloudflareRuntimeConfigured();
  const [handoffs, setHandoffs] = useState<RemoteHandoff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      setHandoffs(await getRemoteHandoffs());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load handoffs",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Approved provider boundary"
        title="Handoff Ledger"
        description="Approved remediation work is recorded durably before any external tracker adapter is allowed to execute. This demo stops at the provider boundary by design."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={!configured || loading}
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />{" "}
            Refresh
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-foreground/10 bg-card/80 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Prepared handoffs</p>
              <p className="mt-2 text-2xl font-semibold">{handoffs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-foreground/10 bg-card/80 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                External mutations
              </p>
              <p className="mt-2 text-2xl font-semibold">0</p>
            </CardContent>
          </Card>
          <Card className="border-foreground/10 bg-card/80 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Safety boundary</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4" /> Human-approved only
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="D1-backed provider handoff records">
            Prepared work
          </SectionLabel>
          {!configured ? (
            <Card className="border-dashed bg-card/45 shadow-none">
              <CardContent className="p-4 text-sm text-muted-foreground">
                Configure NEXT_PUBLIC_ORG_BRAIN_API_URL to inspect Cloudflare
                handoffs.
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-destructive/20 bg-destructive/[0.035] shadow-none">
              <CardContent className="p-4 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : handoffs.length ? (
            <div className="portal-grid grid gap-4 lg:grid-cols-2">
              {handoffs.map((handoff) => (
                <Card
                  key={handoff.id}
                  className="portal-card-hover border-foreground/10 bg-card/85 shadow-none"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Send className="size-4" /> {handoff.payload.title}
                      </CardTitle>
                      <Badge variant="secondary">{handoff.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {handoff.payload.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{handoff.payload.type}</Badge>
                      {(handoff.payload.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="rounded-xl border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-medium">
                        Acceptance criteria
                      </p>
                      <div className="space-y-1.5">
                        {(handoff.payload.acceptanceCriteria ?? []).map(
                          (criterion) => (
                            <p
                              key={criterion}
                              className="flex gap-2 text-xs leading-5 text-muted-foreground"
                            >
                              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />{" "}
                              {criterion}
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {handoff.id}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-card/45 shadow-none">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {loading
                  ? "Loading handoffs…"
                  : "Approve remediation on an RCA to populate this ledger."}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
