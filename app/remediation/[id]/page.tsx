"use client";

import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRemoteInvestigation,
  isCloudflareRuntimeConfigured,
  updateRemoteRemediation,
} from "@/lib/cloudflare-runtime";
import { PageHeader } from "@/modules/common/page-header";
import type { WorkItemDraft } from "@/types/org-brain";
import type { InvestigationState } from "@/types/investigation";

export default function RemediationPage({ params }: { params: Promise<{ id: string }> }) {
  const configured = isCloudflareRuntimeConfigured();
  const [investigationId, setInvestigationId] = useState("");
  const [investigation, setInvestigation] = useState<InvestigationState | null>(null);
  const [draft, setDraft] = useState<WorkItemDraft | null>(null);
  const [criteria, setCriteria] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then(({ id }) => setInvestigationId(id));
  }, [params]);

  useEffect(() => {
    if (!configured || !investigationId) return;
    let active = true;
    void getRemoteInvestigation(investigationId)
      .then((value) => {
        if (!active) return;
        setInvestigation(value);
        const nextDraft = value.result?.rca?.remediationDraft ?? null;
        setDraft(nextDraft);
        setCriteria((nextDraft?.acceptanceCriteria ?? []).join("\n"));
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load remediation");
      });
    return () => {
      active = false;
    };
  }, [configured, investigationId]);

  const editable = investigation?.status === "waiting-approval";
  const criteriaItems = useMemo(
    () => criteria.split("\n").map((item) => item.trim()).filter(Boolean),
    [criteria],
  );

  async function save() {
    if (!draft || !investigationId || !editable) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updatedDraft: WorkItemDraft = {
        ...draft,
        acceptanceCriteria: criteriaItems,
      };
      const updated = await updateRemoteRemediation(investigationId, updatedDraft);
      setDraft(updated.result?.rca?.remediationDraft ?? updatedDraft);
      setInvestigation(updated);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save remediation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Human-reviewed provider handoff"
        title="Remediation Draft"
        description="Edit the generated work item before approval. The durable Workflow reads the latest draft when remediation handoff is approved."
        actions={
          <Button render={<Link href="/history" />} variant="outline" size="sm">
            <ArrowLeft className="size-4" /> History
          </Button>
        }
      />

      <div className="mx-auto grid w-full max-w-[1400px] gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="border-foreground/10 bg-card/88 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Generated work item</CardTitle>
              <Badge variant={editable ? "secondary" : "outline"}>{editable ? "editable" : investigation?.status ?? "loading"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!configured ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Configure NEXT_PUBLIC_ORG_BRAIN_API_URL to edit a durable investigation.</p>
            ) : draft ? (
              <>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Title</span>
                  <input
                    value={draft.title}
                    disabled={!editable}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    className="w-full rounded-xl border bg-background/60 px-3 py-2.5 outline-none transition focus:border-foreground/30 disabled:opacity-60"
                  />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Description</span>
                  <textarea
                    value={draft.description}
                    disabled={!editable}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    className="min-h-40 w-full resize-y rounded-xl border bg-background/60 p-3 outline-none transition focus:border-foreground/30 disabled:opacity-60"
                  />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Acceptance criteria</span>
                  <textarea
                    value={criteria}
                    disabled={!editable}
                    onChange={(event) => setCriteria(event.target.value)}
                    className="min-h-40 w-full resize-y rounded-xl border bg-background/60 p-3 font-mono text-xs outline-none transition focus:border-foreground/30 disabled:opacity-60"
                    placeholder="One criterion per line"
                  />
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {(draft.tags ?? []).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>

                {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
                <div className="flex items-center gap-3">
                  <Button onClick={() => void save()} disabled={!editable || saving || !draft.title.trim()}>
                    <Save className="size-4" /> {saving ? "Saving…" : "Save durable draft"}
                  </Button>
                  {saved ? <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle2 className="size-4" /> Saved before approval</span> : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading remediation draft…</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-foreground/10 bg-card/80 shadow-none">
            <CardHeader><CardTitle className="text-sm">Investigation</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p className="break-all font-mono">{investigationId}</p>
              {investigation?.result?.rca ? (
                <>
                  <p><span className="text-foreground">Incident:</span> {investigation.result.rca.incidentId}</p>
                  <p><span className="text-foreground">RCA confidence:</span> {investigation.result.rca.confidence}%</p>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-dashed bg-card/45 shadow-none">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              Saving updates only the remediation draft. It does not approve mitigation, resume the Workflow, create an external work item, or execute production changes.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
