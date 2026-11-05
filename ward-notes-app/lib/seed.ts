import { sampleImages } from "@/lib/placeholders";
import type { Category, Note, Ward, WardNotesState } from "@/lib/types";

function note(
  id: string,
  title: string,
  content: string,
  updatedAt: string,
  extras: Partial<Pick<Note, "checklist" | "callouts" | "images">> = {},
): Note {
  return {
    id,
    title,
    content,
    checklist: extras.checklist ?? [],
    callouts: extras.callouts ?? [],
    images: extras.images ?? [],
    updatedAt,
  };
}

const admission: Category = {
  id: "cat-admission",
  name: "Admission SOP",
  icon: "clipboard",
  color: "sky",
  notes: [
    note(
      "note-new-admission",
      "New patient admission",
      "Use this for every arrival on Ward 7A, including transfers from ED after hours. Confirm identity before observations, medicines, or belongings leave the trolley.",
      "2026-10-30T01:15:00.000Z",
      {
        checklist: [
          {
            id: "check-wristband",
            text: "Wristband matches the admission sheet (name, DOB, hospital number)",
            done: true,
          },
          {
            id: "check-allergies",
            text: "Allergies written on the drug chart and the bay board",
            done: true,
          },
          {
            id: "check-news",
            text: "Baseline observations and NEWS2 recorded",
            done: false,
          },
          {
            id: "check-belongings",
            text: "Belongings listed; valuables signed into the book",
            done: false,
          },
          {
            id: "check-nic",
            text: "Nurse in charge told the patient has arrived",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-allergy",
            kind: "warning",
            text: "Do not give a first dose until allergies are written on the chart.",
          },
          {
            id: "call-night",
            kind: "tip",
            text: "Transfers after 20:00 still need the full list. Hand the open jobs to the night nurse by name.",
          },
        ],
      },
    ),
    note(
      "note-valuables",
      "Valuables and property",
      "Patients going to scan or theatre need a second check of property before they leave the bay.",
      "2026-10-28T06:40:00.000Z",
      {
        checklist: [
          {
            id: "check-aids",
            text: "Hearing aids, dentures, and glasses labelled and within reach",
            done: false,
          },
          {
            id: "check-phone",
            text: "Phone and charger noted on the property list",
            done: false,
          },
          {
            id: "check-bag",
            text: "Valuables bag number written in the admission booklet",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-family",
            kind: "tip",
            text: "If family takes valuables home, record their name and the time.",
          },
        ],
      },
    ),
  ],
};

const medication: Category = {
  id: "cat-medication",
  name: "Medication / IV",
  icon: "pill",
  color: "rose",
  notes: [
    note(
      "note-high-alert",
      "High-alert medicines",
      "Insulin, anticoagulants, opioids, and concentrated electrolytes need a second nurse at the bedside. Read the prescription, the preparation, and the pump rate aloud.",
      "2026-10-30T08:05:00.000Z",
      {
        checklist: [
          {
            id: "check-two-nurses",
            text: "Two nurses check the drug, dose, route, and time",
            done: false,
          },
          {
            id: "check-identity",
            text: "Name, date of birth, and hospital number confirmed with the patient or wristband",
            done: false,
          },
          {
            id: "check-rate",
            text: "Pump rate and volume checked against the chart before starting",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-unlabelled",
            kind: "warning",
            text: "Do not draw these up early and leave them unlabelled on the trolley.",
          },
          {
            id: "call-cupboard",
            kind: "tip",
            text: "On 7A the high-alert stock is in the red-lid cupboard, second shelf.",
          },
        ],
        images: [
          {
            id: "img-cupboard",
            url: sampleImages.cupboard,
            storagePath: "",
            caption: "Red-lid cupboard, second shelf",
          },
        ],
      },
    ),
    note(
      "note-iv-pump",
      "IV pump setup",
      "Set the pump before you leave the bedside. A second nurse checks any medicine infusion.",
      "2026-10-27T11:20:00.000Z",
      {
        checklist: [
          {
            id: "check-vtbi",
            text: "Rate and volume to be infused programmed",
            done: true,
          },
          {
            id: "check-label",
            text: "Line labelled with drug, rate, and start time",
            done: false,
          },
          {
            id: "check-alarms",
            text: "Occlusion and air alarms left on",
            done: false,
          },
          {
            id: "check-site",
            text: "Cannula site checked and the call bell in reach",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-occlusion",
            kind: "warning",
            text: "If the pump alarms for occlusion, check the site before silencing it.",
          },
        ],
      },
    ),
  ],
};

const habits: Category = {
  id: "cat-habits",
  name: "Doctor habits",
  icon: "stethoscope",
  color: "violet",
  notes: [
    note(
      "note-dr-chen",
      "Dr Chen — weekday rounds",
      "Weekday round starts at bed 1 and moves clockwise. Dr Chen wants the problem list before any social update, and usually asks for the potassium first.",
      "2026-10-29T02:10:00.000Z",
      {
        checklist: [
          {
            id: "check-problems",
            text: "One-line problem list on the handover sheet",
            done: false,
          },
          {
            id: "check-fluids",
            text: "Fluid balance totalled to the nearest hour",
            done: false,
          },
          {
            id: "check-scans",
            text: "Outstanding scans marked on the board",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-bloods",
            kind: "tip",
            text: "Have the latest bloods open before the round reaches your bay.",
          },
        ],
      },
    ),
    note(
      "note-weekend",
      "Weekend on-call",
      "The weekend registrar covers 7A and 7B. Bleep for a NEWS2 of 5 or more, new chest pain, or a fall with a head injury. Routine chart rewrites wait until Monday unless a medicine will run out before then.",
      "2026-10-24T09:00:00.000Z",
      {
        callouts: [
          {
            id: "call-bleep",
            kind: "tip",
            text: "Write the bleep reason in one sentence before you call, including the latest NEWS2.",
          },
        ],
      },
    ),
  ],
};

const handover: Category = {
  id: "cat-handover",
  name: "Handover checklist",
  icon: "checklist",
  color: "emerald",
  notes: [
    note(
      "note-sbar",
      "SBAR shift handover",
      "Use the same order for every patient at 07:30 and 19:30 so the incoming nurse can take the bay without a second pass.",
      "2026-10-30T11:30:00.000Z",
      {
        checklist: [
          {
            id: "check-situation",
            text: "Situation: name, bed, diagnosis, latest NEWS2",
            done: false,
          },
          {
            id: "check-background",
            text: "Background: allergies, resuscitation status, infection flags",
            done: false,
          },
          {
            id: "check-assessment",
            text: "Assessment: what changed on this shift",
            done: false,
          },
          {
            id: "check-recommendation",
            text: "Recommendation: open jobs and the name of the owner",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-repeat",
            kind: "tip",
            text: "Ask the incoming nurse to repeat the top job before you leave.",
          },
        ],
      },
    ),
    note(
      "note-night-round",
      "Night safety round",
      "Walk the bay at 22:00. Fix what you can at the bedside, and hand over what you cannot.",
      "2026-10-26T14:00:00.000Z",
      {
        checklist: [
          {
            id: "check-bells",
            text: "Call bells within reach",
            done: true,
          },
          {
            id: "check-rails",
            text: "Bed rails match the care plan",
            done: true,
          },
          {
            id: "check-iv-sites",
            text: "Infusion sites checked",
            done: false,
          },
          {
            id: "check-falls",
            text: "Falls-risk patients have shoes on and a clear path to the toilet",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-obs",
            kind: "warning",
            text: "A patient calling out overnight still needs a set of observations, not only reassurance.",
          },
        ],
      },
    ),
  ],
};

const preop: Category = {
  id: "cat-preop",
  name: "Pre-op preparation",
  icon: "bed",
  color: "amber",
  notes: [
    note(
      "note-morning-surgery",
      "Morning of surgery",
      "Complete this before the theatre porter arrives. If something on the list is missing, call the surgical team before the patient leaves the ward.",
      "2026-10-29T23:45:00.000Z",
      {
        checklist: [
          {
            id: "check-consent",
            text: "Consent present and the procedure matches the board",
            done: false,
          },
          {
            id: "check-site",
            text: "Surgical site marked",
            done: false,
          },
          {
            id: "check-fasting",
            text: "Fasting time written on the chart",
            done: false,
          },
          {
            id: "check-jewellery",
            text: "Jewellery removed or taped, according to theatre notes",
            done: false,
          },
          {
            id: "check-premed",
            text: "Pre-medication given only if it is prescribed",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-unmarked",
            kind: "warning",
            text: "Do not send the patient if the site is unmarked.",
          },
        ],
      },
    ),
  ],
};

const wound: Category = {
  id: "cat-wound",
  name: "Wound and drains",
  icon: "bandage",
  color: "teal",
  notes: [
    note(
      "note-drain",
      "Drain output chart",
      "Record output at 06:00, 14:00, and 22:00. Compare the colour with the operation note, not with the previous bottle alone.",
      "2026-10-30T06:10:00.000Z",
      {
        checklist: [
          {
            id: "check-volume",
            text: "Volume read at eye level",
            done: false,
          },
          {
            id: "check-colour",
            text: "Colour described (serous, haemoserous, or bright red)",
            done: false,
          },
          {
            id: "check-total",
            text: "Running total updated on the fluid balance",
            done: false,
          },
          {
            id: "check-change",
            text: "Bottle changed with an aseptic technique when full",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-bright",
            kind: "warning",
            text: "Call the surgical team the same hour if the output turns bright red or passes the threshold in the operation note.",
          },
        ],
        images: [
          {
            id: "img-drain",
            url: sampleImages.drain,
            storagePath: "",
            caption: "Read the meniscus at eye level",
          },
          {
            id: "img-escalate",
            url: sampleImages.escalate,
            storagePath: "",
            caption: "Escalate bright red output the same hour",
          },
        ],
      },
    ),
  ],
};

const equipment: Category = {
  id: "cat-equipment",
  name: "Equipment reference",
  icon: "activity",
  color: "indigo",
  notes: [
    note(
      "note-pca",
      "PCA pump buttons",
      "Patients often ask which button is theirs. The green button delivers their bolus. Programming sits behind the locked menu.",
      "2026-10-25T04:25:00.000Z",
      {
        checklist: [
          {
            id: "check-reach",
            text: "Patient can reach the green button with their dominant hand",
            done: false,
          },
          {
            id: "check-relatives",
            text: "Relatives told not to press the bolus",
            done: false,
          },
          {
            id: "check-pain",
            text: "Pain score recorded with each set of observations",
            done: false,
          },
        ],
        callouts: [
          {
            id: "call-programme",
            kind: "warning",
            text: "Only the pain team or a nurse signed off for PCA changes the programme.",
          },
          {
            id: "call-drowsy",
            kind: "tip",
            text: "If the patient is too drowsy to talk, take a set of observations and call the pain team.",
          },
        ],
        images: [
          {
            id: "img-pump",
            url: sampleImages.pump,
            storagePath: "",
            caption: "Green button is the patient bolus",
          },
        ],
      },
    ),
  ],
};

const ward7a: Ward = {
  id: "ward-7a",
  name: "Ward 7A",
  description: "Acute medical",
  categories: [admission, medication, habits, handover],
};

const ward3b: Ward = {
  id: "ward-3b",
  name: "Ward 3B",
  description: "General surgery",
  categories: [preop, wound, equipment],
};

export const seedState: WardNotesState = {
  wards: [ward7a, ward3b],
  activeWardId: ward7a.id,
};
