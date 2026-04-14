import React from 'react'

// ── Tactile Paper Variants ──────────────────
const variants = {
  // Clean paper card
  default: `
    bg-paper border-2 border-paper-300
    shadow-paper
  `,
  // Bold Forest - for high contrast
  elevated: `
    bg-forest-900 text-paper
    border-2 border-forest-950
    shadow-paper
  `,
  // Pressed Inward - for subtle sections
  solid: `
    bg-forest-50 border-2 border-forest-200
  `,
  // The "Signature" - brutalist hard shadow
  primary: `
    bg-paper border-2 border-forest-700
    shadow-paper
  `,
  // Ghost - just the baseline
  ghost: `
    bg-transparent border-b-2 border-paper-300 rounded-none
  `,
}

// ── Main Card Component ─────────────────────
const Card = React.forwardRef(({
  children,
  className    = '',
  variant      = 'default',
  hover        = false,
  padding      = true,
  onClick,
  ...props
}, ref) => {

  const hoverClasses = hover
    ? `cursor-pointer transition-all duration-300 
       hover:-translate-x-1 hover:-translate-y-1 
       hover:shadow-[12px_12px_0px_0px_#1A2C26]
       active:translate-x-0 active:translate-y-0 active:shadow-paper`
    : 'transition-all duration-300'

  const clickable = onClick ? 'cursor-pointer select-none' : ''

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-none
        ${variants[variant]}
        ${hoverClasses}
        ${clickable}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      <div className={`${padding ? 'p-8' : ''}`}>
        {children}
      </div>
    </div>
  )
})

Card.displayName = 'Card'

// ── Sub-Components ──────────────────────────

export const CardHeader = ({
  children,
  className = '',
  border    = false,
  action,
  tag,
}) => (
  <div className={`
    mb-6 flex flex-col gap-2
    ${border ? 'border-b-2 border-paper-300 pb-6' : ''}
    ${className}
  `}>
    {tag && (
      <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink-500">
        {tag}
      </p>
    )}
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 font-serif italic font-bold text-2xl text-ink-900">
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  </div>
)

export const CardBody = ({ children, className = '' }) => (
  <div className={`text-ink-700 font-sans leading-relaxed ${className}`}>
    {children}
  </div>
)

export const CardFooter = ({
  children,
  className = '',
  justify   = 'between',
}) => {
  const justifyMap = {
    between: 'justify-between',
    end:     'justify-end',
    center:  'justify-center',
    start:   'justify-start',
  }
  return (
    <div className={`
      mt-8 pt-6
      border-t-2 border-dashed border-paper-300
      flex items-center gap-4
      ${justifyMap[justify]}
      ${className}
    `}>
      {children}
    </div>
  )
}

// ── Stat Card (Redesigned for Paper) ────────
export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  variant = 'default',
  onClick,
  className = '',
}) => (
  <Card
    variant={variant}
    hover={!!onClick}
    onClick={onClick}
    className={`group ${className}`}
  >
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-ink-500">
          {title}
        </p>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-none border-2 ${
            trend.up ? 'border-forest-700 text-forest-700 bg-forest-50' : 'border-paper-300 text-ink-400'
          }`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div className="text-4xl font-serif italic text-ink-900">
        {value}
      </div>

      {subtitle && (
        <p className="text-[10px] uppercase tracking-widest font-black text-ink-400 border-l-2 border-forest-700 pl-3">
          {subtitle}
        </p>
      )}
    </div>
  </Card>
)

// ── Info Row (The "Receipt" Look) ───────────
export const InfoRow = ({
  label,
  value,
  className = '',
}) => (
  <div className={`flex justify-between items-baseline gap-4 py-3 border-b-2 border-dashed border-paper-300 ${className}`}>
    <span className="text-[10px] uppercase tracking-widest text-ink-500 font-black whitespace-nowrap">
      {label}
    </span>
    {/* Leader dots for that menu/catalog feel */}
    <div className="flex-1 border-b-2 border-dotted border-paper-300 h-0" />
    <span className="text-sm font-sans font-bold text-ink-900">
      {value || '—'}
    </span>
  </div>
)

// ── Section Header ──────────────────────────
export const SectionHeader = ({
  title,
  subtitle,
  tag,
  action,
  className = '',
}) => (
  <div className={`flex items-end justify-between gap-6 mb-12 pb-6 border-b-2 border-forest-700 ${className}`}>
    <div className="space-y-2">
      {tag && (
        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-ink-500">
          {tag}
        </p>
      )}
      <h2 className="text-4xl font-serif italic text-ink-900 tracking-tight font-bold">{title}</h2>
      {subtitle && (
        <p className="text-[11px] uppercase tracking-widest font-black text-ink-400">{subtitle}</p>
      )}
    </div>
    {action && <div className="pb-1">{action}</div>}
  </div>
)

// ── Empty State (Minimalist) ────────────────
export const EmptyState = ({
  title    = 'Archive Empty',
  message  = '',
  action,
}) => (
  <div className="py-20 text-center border-2 border-dashed border-paper-300 bg-paper">
    <div className="inline-block px-4 py-1.5 border-2 border-forest-700 text-[9px] font-black uppercase tracking-widest mb-6 text-forest-700 bg-forest-50 select-none">
      Status: Nil
    </div>
    <h3 className="font-serif italic font-bold text-3xl text-ink-900 mb-3">{title}</h3>
    {message && (
      <p className="text-ink-500 font-sans text-sm max-w-xs mx-auto mb-8">
        {message}
      </p>
    )}
    {action}
  </div>
)

export default Card