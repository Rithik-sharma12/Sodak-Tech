'use client'

import { useEffect, useState, useCallback, use } from 'react'
import type { Problem, ExecutionResult, ProgrammingLanguage } from '@/lib/api'
import { API } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { SplitPane } from '@/components/layout/split-pane'
import { CodeEditor } from '@/components/editor/code-editor'
import { ResultsPanel } from '@/components/editor/results-panel'
import { ProblemDescription } from '@/components/problem/problem-description'
import { ProblemEditorial } from '@/components/problem/problem-editorial'
import { ProblemSubmissions } from '@/components/problem/problem-submissions'
import { SkeletonLines } from '@/components/ui/skeleton-loader'

interface ProblemDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

const TABS = [
  { id: 'description' as const, label: 'Description' },
  { id: 'editorial' as const, label: 'Editorial' },
  { id: 'submissions' as const, label: 'Submissions' },
]

export default function ProblemDetailPage({ params: paramsPromise }: ProblemDetailPageProps) {
  const params = use(paramsPromise)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description')
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [code, setCode] = useState('')
  // The local demo judge only runs Python; see backend/apps/judging/local_judge.py.
  const [language] = useState<ProgrammingLanguage>('python')
  // Bumped after a submit so the Submissions tab refetches.
  const [refreshSubmissions, setRefreshSubmissions] = useState(0)

  useEffect(() => {
    const loadProblem = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await API.getProblem(params.slug)
        if (!data) {
          throw new Error('Problem not found')
        }
        setProblem(data)
        // Python comment syntax — the demo judge only runs Python, and a `//`
        // header would be a syntax error on the user's first Run.
        setCode(`# ${data.title}\n# Read from stdin, print to stdout.\n\n`)
      } catch (err) {
        console.error('[v0] Failed to load problem:', err)
        setError(err instanceof Error ? err.message : 'Failed to load problem')
      } finally {
        setIsLoading(false)
      }
    }

    loadProblem()
  }, [params.slug])

  // Run executes sample groups only; Submit executes every group. The server
  // decides which — the client only says which kind it wants.
  const handleRun = useCallback(
    async (code: string) => {
      if (!problem) return
      setIsRunning(true)
      setResult({
        verdict: 'running',
        runtime: 0,
        memory: 0,
        output: 'Running sample tests…',
        testCases: [],
      })
      try {
        setResult(await API.runTests(problem.slug, code, language))
      } catch (err) {
        setResult({
          verdict: 'internal_error',
          runtime: 0,
          memory: 0,
          output: err instanceof Error ? err.message : 'Run failed.',
          testCases: [],
        })
      } finally {
        setIsRunning(false)
      }
    },
    [problem, language],
  )

  const handleSubmit = useCallback(
    async (code: string) => {
      if (!problem) return
      setIsSubmitting(true)
      // Show the queued state immediately rather than waiting on the network.
      // The stack doc (§3.2) asks for optimistic UI on submit specifically so
      // the interface never appears to hang.
      setResult({
        verdict: 'queued',
        runtime: 0,
        memory: 0,
        output: 'Submission queued…',
        testCases: [],
      })
      try {
        const { result } = await API.submitSolution(problem.slug, code, language)
        setResult(result)
        setRefreshSubmissions((n) => n + 1)
      } catch (err) {
        setResult({
          verdict: 'internal_error',
          runtime: 0,
          memory: 0,
          output: err instanceof Error ? err.message : 'Submission failed.',
          testCases: [],
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [problem, language],
  )

  if (error) {
    return (
      <AppLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
          <p className="text-neutral-400">{error}</p>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <SkeletonLines count={8} />
        </div>
      </AppLayout>
    )
  }

  if (!problem) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-neutral-400">Problem not found</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden">
        {/* Left pane - Problem details */}
        <div className="flex-1 flex flex-col lg:w-1/2 border-r border-border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border bg-surface-card sticky top-0 z-10 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-500 text-foreground'
                    : 'text-neutral-400 hover:text-neutral-300 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'description' && <ProblemDescription problem={problem} />}
            {activeTab === 'editorial' && <ProblemEditorial problemId={problem.id} />}
            {activeTab === 'submissions' && <ProblemSubmissions problemId={problem.id} />}
          </div>
        </div>

        {/* Right pane - Editor and results */}
        <div className="flex-1 flex flex-col lg:w-1/2 overflow-hidden">
          <SplitPane
            left={
              <CodeEditor
                initialCode={code}
                onCodeChange={setCode}
                onRun={handleRun}
                onSubmit={handleSubmit}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
              />
            }
            right={<ResultsPanel result={result} isLoading={isRunning || isSubmitting} />}
            initialRatio={0.6}
          />
        </div>
      </div>
    </AppLayout>
  )
}
