import {
  Activity,
  Bandage,
  BedDouble,
  BookOpen,
  ClipboardList,
  Clock,
  Droplets,
  HeartPulse,
  ListChecks,
  Pill,
  Shield,
  Stethoscope,
  Syringe,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { IconName, TagColor } from "@/lib/types";

export const CATEGORY_ICONS: Record<IconName, { label: string; Icon: LucideIcon }> = {
  clipboard: { label: "Clipboard", Icon: ClipboardList },
  pill: { label: "Medication", Icon: Pill },
  stethoscope: { label: "Clinician", Icon: Stethoscope },
  checklist: { label: "Checklist", Icon: ListChecks },
  heart: { label: "Monitoring", Icon: HeartPulse },
  syringe: { label: "Injection", Icon: Syringe },
  bed: { label: "Bed", Icon: BedDouble },
  book: { label: "Reference", Icon: BookOpen },
  users: { label: "Team", Icon: Users },
  activity: { label: "Equipment", Icon: Activity },
  shield: { label: "Safety", Icon: Shield },
  droplets: { label: "Fluids", Icon: Droplets },
  bandage: { label: "Wound", Icon: Bandage },
  clock: { label: "Timing", Icon: Clock },
  alert: { label: "Alert", Icon: TriangleAlert },
};

type ColorStyle = {
  label: string;
  iconBg: string;
  iconText: string;
  bar: string;
  chip: string;
  swatch: string;
};

export const COLOR_STYLES: Record<TagColor, ColorStyle> = {
  sky: {
    label: "Sky",
    iconBg: "bg-sky-100",
    iconText: "text-sky-700",
    bar: "bg-sky-500",
    chip: "bg-sky-50 text-sky-800 ring-sky-200",
    swatch: "bg-sky-500",
  },
  teal: {
    label: "Teal",
    iconBg: "bg-teal-100",
    iconText: "text-teal-700",
    bar: "bg-teal-500",
    chip: "bg-teal-50 text-teal-800 ring-teal-200",
    swatch: "bg-teal-500",
  },
  emerald: {
    label: "Emerald",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    swatch: "bg-emerald-500",
  },
  amber: {
    label: "Amber",
    iconBg: "bg-amber-100",
    iconText: "text-amber-800",
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900 ring-amber-200",
    swatch: "bg-amber-500",
  },
  rose: {
    label: "Rose",
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-800 ring-rose-200",
    swatch: "bg-rose-500",
  },
  violet: {
    label: "Violet",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
    bar: "bg-violet-500",
    chip: "bg-violet-50 text-violet-800 ring-violet-200",
    swatch: "bg-violet-500",
  },
  indigo: {
    label: "Indigo",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
    bar: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    swatch: "bg-indigo-500",
  },
  slate: {
    label: "Slate",
    iconBg: "bg-slate-200",
    iconText: "text-slate-700",
    bar: "bg-slate-500",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    swatch: "bg-slate-500",
  },
};

export function colorStyle(color: string) {
  if (color in COLOR_STYLES) return COLOR_STYLES[color as TagColor];
  return COLOR_STYLES.sky;
}

export function iconStyle(icon: string) {
  if (icon in CATEGORY_ICONS) return CATEGORY_ICONS[icon as IconName];
  return CATEGORY_ICONS.book;
}

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string;
  color: string;
  className?: string;
}) {
  const palette = colorStyle(color);
  const { Icon } = iconStyle(icon);
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl",
        palette.iconBg,
        palette.iconText,
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}
