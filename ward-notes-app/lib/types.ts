export const ICON_NAMES = [
  "clipboard",
  "pill",
  "stethoscope",
  "checklist",
  "heart",
  "syringe",
  "bed",
  "book",
  "users",
  "activity",
  "shield",
  "droplets",
  "bandage",
  "clock",
  "alert",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const TAG_COLOR_NAMES = [
  "sky",
  "teal",
  "emerald",
  "amber",
  "rose",
  "violet",
  "indigo",
  "slate",
] as const;

export type TagColor = (typeof TAG_COLOR_NAMES)[number];

export type CalloutKind = "warning" | "tip";

export type NoteImage = {
  id: string;
  url: string;
  storagePath: string;
  caption: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Callout = {
  id: string;
  kind: CalloutKind;
  text: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  callouts: Callout[];
  images: NoteImage[];
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  icon: IconName;
  color: TagColor;
  notes: Note[];
};

export type Ward = {
  id: string;
  name: string;
  description: string;
  categories: Category[];
};

export type WardNotesState = {
  wards: Ward[];
  activeWardId: string;
};
