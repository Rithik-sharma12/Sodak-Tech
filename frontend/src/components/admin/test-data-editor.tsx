import { useState } from "react";
import { AlertTriangle, GripVertical, Info, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { VersionWrite } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

const COMPARISON_LABELS: Record<string, string> = {
  exact: "Exact match after whitespace normalisation",
  float: "Floating point (within tolerance)",
  checker: "Custom checker",
};

const SIGNATURE_LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
];

interface DraftCase {
  key: string;
  input: string;
  expected_output: string;
}

interface DraftGroup {
  key: string;
  name: string;
  description: string;
  weight: number;
  is_sample: boolean;
  cases: DraftCase[];
}

let keyCounter = 0;
const nextKey = (prefix: string) => `${prefix}-${++keyCounter}`;

function emptyGroup(): DraftGroup {
  return {
    key: nextKey("group"),
    name: "",
    description: "",
    weight: 1,
    is_sample: false,
    cases: [{ key: nextKey("case"), input: "", expected_output: "" }],
  };
}

export function TestDataEditor({
  submitting,
  submitLabel = "Create version",
  onSubmit,
}: {
  submitting: boolean;
  submitLabel?: string;
  onSubmit: (payload: VersionWrite, publish: boolean) => void;
}) {
  const [timeLimitMs, setTimeLimitMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [comparisonMode, setComparisonMode] = useState<"exact" | "float" | "checker">("exact");
  const [floatTolerance, setFloatTolerance] = useState("1e-6");
  const [judgeMode, setJudgeMode] = useState<"io" | "signature">("io");
  const [changeNote, setChangeNote] = useState("");
  const [signatureTemplates, setSignatureTemplates] = useState<
    Record<string, { starter: string; driver: string }>
  >({});
  const [groups, setGroups] = useState<DraftGroup[]>([emptyGroup()]);
  const [error, setError] = useState<string | null>(null);

  const updateGroup = (key: string, patch: Partial<DraftGroup>) =>
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));

  const updateCase = (groupKey: string, caseKey: string, patch: Partial<DraftCase>) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key === groupKey
          ? {
              ...g,
              cases: g.cases.map((c) => (c.key === caseKey ? { ...c, ...patch } : c)),
            }
          : g,
      ),
    );

  const totalCases = groups.reduce((n, g) => n + g.cases.length, 0);
  const totalWeight = groups.reduce((n, g) => n + (g.weight || 0), 0);
  const sampleGroups = groups.filter((g) => g.is_sample).length;

  const handleSubmit = (publish: boolean) => {
    const named = groups.filter((g) => g.name.trim());
    if (named.length === 0) {
      setError("Name at least one test group.");
      return;
    }
    if (!named.some((g) => g.is_sample)) {
      setError("At least one sample group is required — Run has nothing to execute without one.");
      return;
    }
    if (named.some((g) => g.cases.length === 0)) {
      setError("Every test group needs at least one case.");
      return;
    }
    setError(null);
    onSubmit(
      {
        time_limit_ms: timeLimitMs,
        memory_limit_mb: memoryLimitMb,
        comparison_mode: comparisonMode,
        float_tolerance: comparisonMode === "float" ? Number.parseFloat(floatTolerance) : null,
        judge_mode: judgeMode,
        signature_templates: judgeMode === "signature" ? signatureTemplates : {},
        change_note: changeNote,
        publish,
        test_groups: named.map((g) => ({
          name: g.name,
          description: g.description,
          weight: g.weight || 1,
          is_sample: g.is_sample,
          cases: g.cases.map((c) => ({ input: c.input, expected_output: c.expected_output })),
        })),
      },
      publish,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border-l-4 border-primary bg-primary-muted px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-foreground">
          Publishing makes this version immutable. Correcting a test case later requires creating a
          new version — existing submissions stay pinned to the version they were judged against.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 rounded-lg border border-border bg-card px-5 py-4 font-mono text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Groups</p>
          <p className="font-semibold tabular-nums">{groups.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cases</p>
          <p className="font-semibold tabular-nums">{totalCases}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total weight</p>
          <p className="font-semibold tabular-nums">{totalWeight}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sample groups</p>
          <p className="font-semibold tabular-nums">{sampleGroups}</p>
        </div>
      </div>

      {sampleGroups === 0 ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
          <AlertTriangle className="h-3.5 w-3.5" />
          At least one sample group is required — the Run button has nothing to execute without one.
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Limits</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="time-limit">Time limit</Label>
            <div className="relative">
              <Input
                id="time-limit"
                type="number"
                min={100}
                step={100}
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                className="pr-12 font-mono"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                ms
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memory-limit">Memory limit</Label>
            <div className="relative">
              <Input
                id="memory-limit"
                type="number"
                min={16}
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                className="pr-12 font-mono"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                MB
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comparison">Comparison</Label>
            <Select
              value={comparisonMode}
              onValueChange={(v) => setComparisonMode(v as typeof comparisonMode)}
            >
              <SelectTrigger id="comparison">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COMPARISON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {comparisonMode === "float" ? (
            <div className="space-y-1.5">
              <Label htmlFor="float-tolerance">Tolerance</Label>
              <Input
                id="float-tolerance"
                value={floatTolerance}
                onChange={(e) => setFloatTolerance(e.target.value)}
                className="font-mono"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="judge-mode">Judge mode</Label>
            <Select value={judgeMode} onValueChange={(v) => setJudgeMode(v as "io" | "signature")}>
              <SelectTrigger id="judge-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="io">Full program (stdin/stdout)</SelectItem>
                <SelectItem value="signature">Function signature (LeetCode-style)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="change-note">Change note</Label>
            <Input
              id="change-note"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="What changed vs the previous version?"
            />
          </div>
        </div>
      </section>

      {judgeMode === "signature" ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Signature templates</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            The function stub shown to learners and the setter-authored driver the judge merges it
            into. Both are part of the problem's contract and versioned with it.
          </p>
          <div className="mt-4 space-y-4">
            {SIGNATURE_LANGUAGES.map((lang) => {
              const tpl = signatureTemplates[lang.id] ?? { starter: "", driver: "" };
              return (
                <div key={lang.id} className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {lang.label}
                  </p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`starter-${lang.id}`} className="text-xs">
                        Starter (shown to learners)
                      </Label>
                      <Textarea
                        id={`starter-${lang.id}`}
                        rows={7}
                        value={tpl.starter}
                        onChange={(e) =>
                          setSignatureTemplates((t) => ({
                            ...t,
                            [lang.id]: { ...tpl, starter: e.target.value },
                          }))
                        }
                        className="font-mono text-xs"
                        placeholder={`def solution(): # the function signature to implement`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`driver-${lang.id}`} className="text-xs">
                        Driver (judge harness)
                      </Label>
                      <Textarea
                        id={`driver-${lang.id}`}
                        rows={7}
                        value={tpl.driver}
                        onChange={(e) =>
                          setSignatureTemplates((t) => ({
                            ...t,
                            [lang.id]: { ...tpl, driver: e.target.value },
                          }))
                        }
                        className="font-mono text-xs"
                        placeholder={`import sys\n# read input, call the function, print output`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Test groups</h3>
        {groups.map((group) => {
          return (
            <div
              key={group.key}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {group.name || "Unnamed group"}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    group.is_sample
                      ? "bg-success-muted text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {group.is_sample ? "Sample" : "Hidden"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  weight {group.weight}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {group.cases.length} case{group.cases.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => setGroups((gs) => gs.filter((g) => g.key !== group.key))}
                  aria-label="Remove group"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 bg-muted/40 p-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_120px_auto]">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Group name</Label>
                    <Input
                      value={group.name}
                      onChange={(e) => updateGroup(group.key, { name: e.target.value })}
                      placeholder="What behaviour does this group verify?"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Weight</Label>
                    <Input
                      type="number"
                      min={1}
                      value={group.weight}
                      onChange={(e) => updateGroup(group.key, { weight: Number(e.target.value) })}
                      className="bg-background font-mono"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={group.is_sample}
                        onCheckedChange={(v) => updateGroup(group.key, { is_sample: v })}
                      />
                      Sample
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={group.description}
                    onChange={(e) => updateGroup(group.key, { description: e.target.value })}
                    placeholder="What behaviour does this group verify?"
                    className="bg-background"
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Test cases <span className="font-mono">{group.cases.length}</span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {group.cases.map((testCase, index) => (
                      <div
                        key={testCase.key}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                            Case {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateGroup(group.key, {
                                cases: group.cases.filter((c) => c.key !== testCase.key),
                              })
                            }
                            aria-label="Remove case"
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Input</Label>
                            <Textarea
                              rows={3}
                              value={testCase.input}
                              onChange={(e) =>
                                updateCase(group.key, testCase.key, { input: e.target.value })
                              }
                              className="bg-background font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Expected output</Label>
                            <Textarea
                              rows={3}
                              value={testCase.expected_output}
                              onChange={(e) =>
                                updateCase(group.key, testCase.key, {
                                  expected_output: e.target.value,
                                })
                              }
                              className="bg-background font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      updateGroup(group.key, {
                        cases: [
                          ...group.cases,
                          { key: nextKey("case"), input: "", expected_output: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add case
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setGroups((gs) => [...gs, emptyGroup()])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add test group
        </Button>
      </section>

      {error ? (
        <p className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive-muted/40 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => handleSubmit(false)}
        >
          Save draft
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit(true)}
          className="gap-1.5"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish version
        </Button>
      </div>
    </div>
  );
}
