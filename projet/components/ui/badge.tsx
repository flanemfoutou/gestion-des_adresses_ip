import * as React from 'react';
import { cn } from '@/lib/utils';

const tones = {
  green: 'bg-[#e8f4ed] text-[#26754a]',
  amber: 'bg-[#fff2dc] text-[#926118]',
  red: 'bg-[#fbe9e6] text-[#a53e31]',
  gray: 'bg-[#edf0ee] text-[#64716b]',
  blue: 'bg-[#e9f0f5] text-[#53788e]',
} as const;

export function Badge({
  className,
  tone = 'gray',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold', tones[tone], className)} {...props} />;
}
