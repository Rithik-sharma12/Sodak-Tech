'use client'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
  label: string
  description?: string
  disabled?: boolean
  disabledReason?: string
}

/**
 * Accessible toggle.
 *
 * Built on a real <button role="switch"> rather than a styled checkbox: it
 * gives correct semantics to screen readers, takes focus natively, and responds
 * to Space/Enter without extra key handling. A native checkbox with a CSS skin
 * is the usual shortcut here and it loses all three.
 */
export function Switch({
  checked,
  onChange,
  id,
  label,
  description,
  disabled = false,
  disabledReason,
}: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${
            disabled ? 'text-neutral-500' : 'text-foreground cursor-pointer'
          }`}
        >
          {label}
        </label>
        {(description || disabledReason) && (
          <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
            {disabled && disabledReason ? disabledReason : description}
          </p>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 h-[22px] w-[38px] rounded-full transition-colors
          duration-200 disabled:opacity-40 disabled:cursor-not-allowed
          ${checked ? 'bg-primary-400' : 'bg-surface-overlay'}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-full bg-white
            shadow-sm transition-transform duration-200
            ${checked ? 'translate-x-4' : 'translate-x-0'}`}
          aria-hidden
        />
      </button>
    </div>
  )
}
