'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import type { ProgrammingLanguage } from '@/lib/api'
import { Copy, Play, Send } from 'lucide-react'

// Debounce utility for code change events
function useDebounce<T>(value: T, delay: number = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

interface CodeEditorProps {
  initialCode?: string
  language?: ProgrammingLanguage
  onCodeChange?: (code: string) => void
  onRun?: (code: string) => void
  onSubmit?: (code: string) => void
  isRunning?: boolean
  isSubmitting?: boolean
}

function CodeEditorComponent({
  initialCode = '// Write your solution here\n',
  language = 'javascript',
  onCodeChange,
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
}: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(language)
  const [code, setCode] = useState(initialCode)
  const debouncedCode = useDebounce(code, 500)
  const [copied, setCopied] = useState(false)

  // Debounced callback for code changes
  useEffect(() => {
    onCodeChange?.(debouncedCode)
  }, [debouncedCode, onCodeChange])

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as ProgrammingLanguage
    setSelectedLanguage(newLanguage)
  }, [])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleRun = useCallback(() => {
    onRun?.(code)
  }, [code, onRun])

  const handleSubmit = useCallback(() => {
    onSubmit?.(code)
  }, [code, onSubmit])

  return (
    <div className="flex flex-col h-full bg-surface-card border-l border-border">
      {/* Toolbar */}
      <div className="h-16 border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <label htmlFor="language" className="text-sm text-neutral-400">
            Language:
          </label>
          <select
            id="language"
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="px-3 py-1 bg-surface-base border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1 text-sm rounded bg-surface-base border border-border text-neutral-400 hover:text-neutral-200 hover:border-primary-500 transition-colors"
            title="Copy code"
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1 text-sm rounded bg-secondary border border-border text-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            title="Run tests"
          >
            <Play size={16} />
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-1 text-sm rounded bg-primary-500 border border-primary-600 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors font-medium"
            title="Submit solution"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 p-4 font-mono text-sm bg-surface-base text-foreground border-none focus:outline-none resize-none"
        spellCheck="false"
        placeholder="// Write your solution here..."
      />
    </div>
  )
}

export const CodeEditor = memo(CodeEditorComponent)
