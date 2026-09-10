"use client";

import { Brain, FilePenLine, History, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRemoteHistory,
  isCloudflareRuntimeConfigured,
  searchRemoteMemory,
  type RemoteHistoryItem,
  type RemoteMemoryMatch,
} from "@/lib/cloudflare-runtime";
import { PageHeader } from "@/modules/common/page-header";

const memoryLabel = {
  "incident-rca": "Incident RCA",
  "architecture-decision": "ADR",
  "work-item": "Work item",
} as const;

export default function HistoryPage() {
  const configured = isCloudflareRuntimeConfigured();
  const [history, setHistory] = useState<RemoteHistoryItem[]>([]);
  const [memory, setMemory] = useState<RemoteMemoryMatch[]>([]);
  const [query, setQuery] = useState(
    "Have we seen a similar claims latency incident before?",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      setHistory(await getRemoteHistory());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load history",
      );
    } finally {
      setLoading(false);
    }
  }

  async function searchMemory() {
    if (!configured || !query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setMemory(await searchRemoteMemory(query.trim()));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to search memory",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Closed-loop engineering memory"
        title="Investigation History"
        description="Cloudflare persists investigations in D1 and upgrades retrieval to semantic organization memory when Vectorize is bound. ADRs, work items and prior RCAs remain context, never fabricated current-incident evidence."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadHistory()}
            disabled={!configured || loading}
          >
            <History className="size-4" /> Refresh
          </Button>
        }
      />

      <div className="mx-auto grid w-full max-w-[1680px] gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card className="border-foreground/10 bg-card/85 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Durable investigations</CardTitle>
              <Badge variant="outline">
                {configured ? `${history.length} loaded` : "runtime offline"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="portal-scroll max-h-[68svh] space-y-3 overflow-y-auto">
            {!configured ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Configure NEXT_PUBLIC_ORG_BRAIN_API_URL to read Cloudflare
                history.
              </p>
            ) : history.length ? (
              history.map((item) => (
                <div
                  key={item.id}
                  className="portal-card-hover rounded-xl border bg-background/55 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.incidentId ?? item.id}
                      </span>
                      <Badge variant="secondary" className="font-normal">
                        {item.status}
                      </Badge>
                    </div>
                    {item.confidence != null ? (
                      <Badge variant="outline">{item.confidence}% RCA</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium">{item.query}</p>
                  {item.rootCause ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.rootCause}
                    </p>
                  ) : null}
                  {item.remediationTitle ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-xs">
                      <p>
                        <span className="text-muted-foreground">
                          Remediation ·{" "}
                        </span>
                        {item.remediationTitle}
                      </p>
                      {item.status === "waiting-approval" ? (
                        <Button
                          render={
                            <Link
                              href={`/remediation/${encodeURIComponent(item.id)}`}
                            />
                          }
                          variant="ghost"
                          size="sm"
                        >
                          <FilePenLine className="size-3.5" /> Review
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Loading investigation history…"
                  : "No D1-backed investigations yet."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-foreground/10 bg-card/85 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="size-4" /> Organization memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-24 w-full resize-none rounded-xl border bg-background/60 p-3 text-sm outline-none transition focus:border-foreground/30"
                placeholder="Search prior RCAs, ADRs and work items…"
              />
              <Button
                className="w-full"
                onClick={() => void searchMemory()}
                disabled={!configured || loading || !query.trim()}
              >
                <Search className="size-4" /> Search organization memory
              </Button>
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <div className="portal-scroll max-h-[48svh] space-y-2 overflow-y-auto pr-1">
              {memory.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl border bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                          {match.kind ? memoryLabel[match.kind] : "Memory"}
                        </Badge>
                        <Badge variant="outline" className="font-normal">
                          {match.source}
                        </Badge>
                      </div>
                      <p className="mt-2 truncate text-xs font-medium">
                        {match.title ?? match.incidentId ?? match.id}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {Math.round(match.score * 100)}%
                    </Badge>
                  </div>
                  {match.summary || match.rootCause ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {match.summary ?? match.rootCause}
                    </p>
                  ) : null}
                  {match.mitigation ? (
                    <p className="mt-2 border-t pt-2 text-xs leading-5 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Prior mitigation: 
                      </span>
                      {match.mitigation}
                    </p>
                  ) : null}
                </div>
              ))}
              {configured && !memory.length ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  Search results use Vectorize when MEMORY is bound, with a D1
                  investigation-history fallback when it is not.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
