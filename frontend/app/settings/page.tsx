'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, Check, Code2, Loader2, Palette, User as UserIcon } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Switch } from '@/components/ui/switch'
import { API, type User } from '@/lib/api'

/**
 * Settings.
 *
 * Editor preferences are genuinely persisted (localStorage — they are
 * client-side display concerns and need no backend). Anything requiring a
 * server endpoint that does not exist yet is rendered visibly disabled with the
 * reason, rather than as a live control that silently does nothing. A button
 * that looks operational and isn't is worse than an honest disabled one.
 */

const STORAGE_KEY = 'sodak.preferences'

interface Preferences {
  language: string
  fontSize: number
  tabSize: number
  wordWrap: boolean
  autoIndent: boolean
  showLineNumbers: boolean
  notifyVerdicts: boolean
  notifyContests: boolean
  emailDigest: boolean
}

const DEFAULTS: Preferences = {
  language: 'python',
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  autoIndent: true,
  showLineNumbers: true,
  notifyVerdicts: true,
  notifyContests: true,
  emailDigest: false,
}

// Only Python is judged today (backend/apps/judging/local_judge.py). The rest
// are listed but disabled, so the roadmap stays visible without offering a
// choice that would fail on submit.
const LANGUAGES = [
  { id: 'python', name: 'Python 3.13', available: true },
  { id: 'cpp', name: 'C++ 20', available: false },
  { id: 'java', name: 'Java 21', available: false },
  { id: 'javascript', name: 'JavaScript (Node 22)', available: false },
]

const SECTIONS = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
] as const

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS)
  const [saved, setSaved] = useState<Preferences>(DEFAULTS)
  const [user, setUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('account')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const merged = { ...DEFAULTS, ...JSON.parse(stored) }
        setPrefs(merged)
        setSaved(merged)
      }
    } catch {
      /* corrupt storage falls back to defaults */
    }
    API.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  // The save bar appears only when something actually changed, so it never sits
  // there inviting a no-op click.
  const isDirty = useMemo(() => JSON.stringify(prefs) !== JSON.stringify(saved), [prefs, saved])

  const set = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(() => {
    setIsSaving(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    setSaved(prefs)
    setIsSaving(false)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2200)
  }, [prefs])

  const handleReset = useCallback(() => setPrefs(saved), [saved])

  // Scroll-spy for the section rail.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { root, rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <AppLayout>
      <div ref={contentRef} className="h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
          <header className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1.5 text-sm text-neutral-400">
              Preferences apply to this browser. Account changes affect everywhere you sign in.
            </p>
          </header>

          <div className="flex gap-10">
            {/* Section rail */}
            <nav className="hidden lg:block w-44 shrink-0" aria-label="Settings sections">
              <ul className="sticky top-6 space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      aria-current={activeSection === id ? 'true' : undefined}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 h-8 text-[13px]
                        font-medium transition-colors ${
                          activeSection === id
                            ? 'bg-surface-raised text-foreground'
                            : 'text-neutral-500 hover:text-neutral-200 hover:bg-surface-raised/60'
                        }`}
                    >
                      <Icon
                        size={15}
                        className={
                          id === 'danger' && activeSection === id ? 'text-danger' : undefined
                        }
                      />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0 flex-1 space-y-6 pb-28">
              <Section id="account" title="Account" description="Your identity across the platform.">
                {user ? (
                  <dl className="divide-y divide-border">
                    <Row label="Display name" value={user.displayName || user.username} />
                    <Row label="Username" value={user.username} mono />
                    <Row label="Email" value={user.email} mono />
                    <Row label="Rating" value={String(user.rating)} mono />
                  </dl>
                ) : (
                  <p className="py-3 text-sm text-neutral-500">
                    Not signed in.{' '}
                    <a href="/login" className="text-primary-300 underline hover:text-primary-200">
                      Sign in
                    </a>{' '}
                    to manage your account.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  <DisabledAction
                    label="Change password"
                    reason="Needs a backend endpoint that isn't built yet"
                  />
                  <DisabledAction
                    label="Enable two-factor auth"
                    reason="Required for admin roles before launch (design doc §8.3)"
                  />
                </div>
              </Section>

              <Section
                id="editor"
                title="Editor"
                description="Applies to the code editor on problem pages."
              >
                <Field label="Default language" htmlFor="language">
                  <select
                    id="language"
                    value={prefs.language}
                    onChange={(e) => set('language', e.target.value)}
                    className="input max-w-xs"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id} disabled={!l.available}>
                        {l.name}
                        {l.available ? '' : ' — coming soon'}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Font size" htmlFor="fontSize" hint={`${prefs.fontSize}px`}>
                  <input
                    id="fontSize"
                    type="range"
                    min={11}
                    max={20}
                    step={1}
                    value={prefs.fontSize}
                    onChange={(e) => set('fontSize', Number(e.target.value))}
                    className="w-full max-w-xs accent-primary-400"
                  />
                </Field>

                <Field label="Tab size" htmlFor="tabSize">
                  <div className="flex gap-1.5" role="radiogroup" aria-label="Tab size">
                    {[2, 4, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={prefs.tabSize === n}
                        onClick={() => set('tabSize', n)}
                        className={`tnum h-8 w-12 rounded-md text-[13px] font-medium
                          transition-colors ${
                            prefs.tabSize === n
                              ? 'bg-primary-200 text-primary-900'
                              : 'bg-surface-raised text-neutral-400 hover:text-neutral-100'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="mt-2 divide-y divide-border border-t border-border">
                  <Switch
                    id="wordWrap"
                    label="Word wrap"
                    description="Wrap long lines instead of scrolling horizontally."
                    checked={prefs.wordWrap}
                    onChange={(v) => set('wordWrap', v)}
                  />
                  <Switch
                    id="autoIndent"
                    label="Auto-indent"
                    description="Maintain indentation on new lines."
                    checked={prefs.autoIndent}
                    onChange={(v) => set('autoIndent', v)}
                  />
                  <Switch
                    id="showLineNumbers"
                    label="Line numbers"
                    checked={prefs.showLineNumbers}
                    onChange={(v) => set('showLineNumbers', v)}
                  />
                </div>
              </Section>

              <Section id="appearance" title="Appearance" description="How the interface looks.">
                {/* The previous version offered a Light theme and then admitted
                    in small print that it did nothing. Saying so plainly is more
                    useful than a control that lies. */}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised/40 px-4 py-3.5">
                  <Palette size={18} className="shrink-0 text-primary-300" />
                  <div>
                    <p className="text-sm font-medium">Dark theme</p>
                    <p className="text-[13px] text-neutral-500">
                      The only theme right now. Light mode isn&apos;t built yet.
                    </p>
                  </div>
                </div>
              </Section>

              <Section
                id="notifications"
                title="Notifications"
                description="What you get told about, and where."
              >
                <div className="divide-y divide-border">
                  <Switch
                    id="notifyVerdicts"
                    label="Submission verdicts"
                    description="Notify me when a submission finishes judging."
                    checked={prefs.notifyVerdicts}
                    onChange={(v) => set('notifyVerdicts', v)}
                  />
                  <Switch
                    id="notifyContests"
                    label="Contest reminders"
                    description="Remind me before a contest I've registered for starts."
                    checked={prefs.notifyContests}
                    onChange={(v) => set('notifyContests', v)}
                  />
                  <Switch
                    id="emailDigest"
                    label="Weekly email digest"
                    checked={prefs.emailDigest}
                    onChange={(v) => set('emailDigest', v)}
                    disabled
                    disabledReason="No email delivery is configured on the backend yet."
                  />
                </div>
              </Section>

              <section
                id="danger"
                className="scroll-mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] p-6"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={17} className="text-danger" />
                  <h2 className="font-display text-base font-semibold text-danger">Danger zone</h2>
                </div>
                <p className="mt-1 text-[13px] text-neutral-400">These actions are permanent.</p>

                <div className="mt-4 flex items-center justify-between gap-6 border-t border-danger/20 pt-4">
                  <div>
                    <p className="text-sm font-medium">Delete account</p>
                    <p className="text-[13px] text-neutral-500">
                      Submissions are retained for contest integrity; your profile is removed.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Needs a backend endpoint, a re-authentication step, and an audit entry"
                    className="btn shrink-0 border border-danger/40 text-danger hover:bg-danger/10
                      disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Save bar. Appears only when dirty, so it is never dead chrome, and
            stays reachable without scrolling to the bottom. */}
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-6 pb-6
            transition-all duration-200 ${
              isDirty || justSaved ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          aria-live="polite"
        >
          <div
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border
              bg-surface-overlay/95 px-3 py-2.5 shadow-lg backdrop-blur-xl"
          >
            {justSaved ? (
              <span className="flex items-center gap-2 px-2 text-sm font-medium text-success">
                <Check size={16} />
                Preferences saved
              </span>
            ) : (
              <>
                <span className="px-2 text-[13px] text-neutral-400">Unsaved changes</span>
                <button onClick={handleReset} className="btn btn-secondary h-8 text-[13px]">
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary h-8 text-[13px]"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  Save changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

/* ---------------------------------------------------------------------- */

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="panel scroll-mt-6 p-6">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="tnum text-[13px] text-neutral-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <dt className="text-sm text-neutral-400">{label}</dt>
      <dd className={`truncate text-sm ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</dd>
    </div>
  )
}

function DisabledAction({ label, reason }: { label: string; reason: string }) {
  return (
    <button
      type="button"
      disabled
      title={reason}
      className="btn btn-secondary h-8 text-[13px] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {label}
    </button>
  )
}
