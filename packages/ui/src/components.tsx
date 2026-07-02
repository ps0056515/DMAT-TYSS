import type { CSSProperties, ReactNode } from 'react';
import { tokens, type SemanticTone } from './tokens';

export { tokens, type SemanticTone } from './tokens';

const toneColors: Record<SemanticTone, { text: string; bg: string }> = {
  success: tokens.success,
  warning: tokens.warning,
  danger: tokens.danger,
  neutral: { text: tokens.text.secondary, bg: tokens.surface1 },
  accent: { text: tokens.accent, bg: tokens.accentLight },
};

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = 'primary',
  disabled,
  onClick,
  type = 'button',
  fullWidth,
  style,
}: ButtonProps) {
  const base: CSSProperties = {
    padding: '10px 16px',
    borderRadius: tokens.radius.sm,
    fontWeight: 500,
    fontSize: tokens.font.body.size,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    fontFamily: 'inherit',
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
    primary: { backgroundColor: tokens.accent, color: '#fff', border: 'none' },
    secondary: {
      backgroundColor: tokens.surface2,
      color: tokens.text.primary,
      border: `0.5px solid ${tokens.border}`,
    },
    danger: { backgroundColor: tokens.danger.text, color: '#fff', border: 'none' },
  };

  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Card({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        border: `0.5px solid ${tokens.border}`,
        borderRadius: tokens.radius.card,
        padding: tokens.pad.lg,
        backgroundColor: tokens.surface2,
        ...style,
      }}
    >
      {title && (
        <h2
          style={{
            margin: '0 0 12px',
            fontSize: tokens.font.cardTitle.size,
            fontWeight: tokens.font.cardTitle.weight,
            color: tokens.text.primary,
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, tone = 'neutral' }: { label: string; value: ReactNode; tone?: SemanticTone }) {
  return (
    <div
      style={{
        backgroundColor: tokens.surface1,
        borderRadius: tokens.radius.card,
        padding: tokens.pad.md,
      }}
    >
      <div style={{ fontSize: tokens.font.meta.size, color: tokens.text.muted, marginBottom: 8 }}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: tone === 'neutral' ? tokens.text.primary : toneColors[tone].text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: SemanticTone;
}) {
  const c = toneColors[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: tokens.font.badge.size,
        fontWeight: tokens.font.badge.weight,
        color: c.text,
        backgroundColor: c.bg,
        padding: '4px 8px',
        borderRadius: tokens.radius.sm,
      }}
    >
      {label}
    </span>
  );
}

export function AccentBanner({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: tokens.accentLight,
        borderRadius: tokens.radius.card,
        padding: tokens.pad.lg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: tokens.pad.md,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ fontWeight: 500, fontSize: tokens.font.h2.size, color: tokens.text.primary }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: tokens.font.small.size, color: tokens.text.secondary, marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'accent',
  height = 6,
}: {
  value: number;
  max?: number;
  tone?: 'accent' | 'warning' | 'danger';
  height?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const fill =
    tone === 'warning' ? tokens.warning.text : tone === 'danger' ? tokens.danger.text : tokens.accent;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      style={{ height, backgroundColor: tokens.surface1, borderRadius: height, overflow: 'hidden' }}
    >
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: fill, transition: 'width 0.2s' }} />
    </div>
  );
}

export function ChecklistRow({
  label,
  done,
  href,
}: {
  label: string;
  done: boolean;
  href?: string;
}) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <span aria-hidden style={{ fontSize: 16 }}>{done ? '✓' : '○'}</span>
      <span
        style={{
          fontSize: tokens.font.body.size,
          color: done ? tokens.success.text : tokens.text.primary,
          textDecoration: !done && href ? 'underline' : undefined,
        }}
      >
        {label}
      </span>
    </div>
  );
  if (!done && href) {
    return <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{content}</a>;
  }
  return content;
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: tokens.surface1,
        borderRadius: tokens.radius.sm,
        padding: tokens.pad.md,
        fontSize: tokens.font.small.size,
        color: tokens.text.secondary,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <span aria-hidden>ℹ</span>
      <span>{children}</span>
    </div>
  );
}

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: tokens.pad.xl, flexWrap: 'wrap' }}>
      {steps.map((step, i) => {
        const active = i <= current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: active ? tokens.accent : tokens.surface1,
                color: active ? '#fff' : tokens.text.muted,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: tokens.font.small.size,
                color: active ? tokens.accent : tokens.text.muted,
                fontWeight: active ? 500 : 400,
              }}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span style={{ color: tokens.text.muted, margin: '0 4px' }}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header style={{ marginBottom: tokens.pad.lg }}>
      <h1
        style={{
          margin: 0,
          fontSize: tokens.font.h1.size,
          fontWeight: tokens.font.h1.weight,
          color: tokens.text.primary,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: '8px 0 0', fontSize: tokens.font.small.size, color: tokens.text.secondary }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}

export function CandidateNav({ name = 'Alex' }: { name?: string }) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: tokens.surface2,
        borderBottom: `0.5px solid ${tokens.border}`,
      }}
    >
      <strong style={{ color: tokens.accent, fontSize: 16 }}>dMAT Platform</strong>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          aria-label="Notifications"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
        >
          🔔
        </button>
        <div
          aria-label={`Account menu for ${name}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: tokens.accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

export function StaffNav({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header
      style={{
        padding: '16px 24px',
        backgroundColor: tokens.surface2,
        borderBottom: `0.5px solid ${tokens.border}`,
        marginBottom: tokens.pad.lg,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{title}</h1>
      {subtitle && (
        <p style={{ margin: '4px 0 0', fontSize: tokens.font.small.size, color: tokens.text.secondary }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}

export function NeedsAttentionRow({ label, tone = 'warning' }: { label: string; tone?: 'warning' | 'neutral' }) {
  return (
    <button
      type="button"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        border: `0.5px solid ${tokens.border}`,
        borderRadius: tokens.radius.sm,
        backgroundColor: tone === 'warning' ? tokens.warning.bg : tokens.surface1,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: tokens.font.body.size,
        color: tokens.text.primary,
        marginBottom: 8,
      }}
    >
      <span>{label}</span>
      <span aria-hidden>›</span>
    </button>
  );
}
