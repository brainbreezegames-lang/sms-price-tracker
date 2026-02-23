import React from 'react';
import { Tooltip } from './Tooltip';

export type BadgeVariant =
  | 'cheapest'
  | 'outbound'
  | 'inbound'
  | 'verify-available'
  | 'no-coverage'
  | 'sms'
  | 'mms'
  | 'verify';

interface BadgeDef {
  label: string;
  cls: string;
  tooltip: string;
}

export const BADGE_DEFS: Record<BadgeVariant, BadgeDef> = {
  cheapest: {
    label: 'Cheapest',
    cls: 'bg-brand-400/15 text-brand-400 border-brand-400/30',
    tooltip: 'Lowest price for this country',
  },
  outbound: {
    label: 'Outbound',
    cls: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
    tooltip: 'Message sent from your app to user',
  },
  inbound: {
    label: 'Inbound',
    cls: 'bg-violet-400/15 text-violet-400 border-violet-400/30',
    tooltip: 'Message received from user to your number',
  },
  'verify-available': {
    label: 'Verify API',
    cls: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
    tooltip: 'Provider offers a bundled Verify/OTP API',
  },
  'no-coverage': {
    label: 'No Coverage',
    cls: 'bg-red-400/15 text-red-400 border-red-400/30',
    tooltip: 'Provider does not cover this country',
  },
  sms: {
    label: 'SMS',
    cls: 'bg-slate-400/15 text-slate-400 border-slate-400/30',
    tooltip: 'Standard text message',
  },
  mms: {
    label: 'MMS',
    cls: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
    tooltip: 'Multimedia message (images, video)',
  },
  verify: {
    label: 'OTP',
    cls: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
    tooltip: 'One-time password / verification',
  },
};

interface BadgeProps {
  variant: BadgeVariant;
  size?: 'xs' | 'sm';
}

export const Badge: React.FC<BadgeProps> = ({ variant, size = 'xs' }) => {
  const def = BADGE_DEFS[variant];
  if (!def) return null;

  const sizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-[11px] px-2 py-0.5';

  return (
    <Tooltip content={def.tooltip}>
      <span
        className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sizeClass} ${def.cls}`}
      >
        {def.label}
      </span>
    </Tooltip>
  );
};
