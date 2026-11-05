function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function illustration(title: string, lines: string[], accent: string, drawing: string) {
  const text = lines
    .map(
      (line, index) =>
        `<text x="80" y="${760 + index * 52}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" fill="#334155">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280">
    <rect width="960" height="1280" fill="#f8fafc"/>
    <rect x="36" y="36" width="888" height="1208" rx="40" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <rect x="36" y="36" width="888" height="18" fill="${accent}"/>
    <text x="80" y="140" font-family="ui-sans-serif,system-ui,sans-serif" font-size="42" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
    <text x="80" y="190" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" fill="#64748b">Ward reference card</text>
    ${drawing}
    ${text}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const sampleImages = {
  cupboard: illustration(
    "Red-lid cupboard",
    ["Second shelf · high-alert stock", "Insulin, anticoagulants, opioids", "Do not leave doses unlabelled"],
    "#e11d48",
    `<rect x="250" y="250" width="460" height="430" rx="24" fill="#fff1f2" stroke="#be123c" stroke-width="6"/>
     <rect x="250" y="250" width="460" height="70" rx="18" fill="#e11d48"/>
     <text x="480" y="294" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" font-weight="700" fill="#ffffff">HIGH ALERT</text>
     <rect x="290" y="360" width="380" height="120" rx="16" fill="#ffffff" stroke="#fecdd3"/>
     <rect x="290" y="510" width="380" height="120" rx="16" fill="#ffe4e6" stroke="#fb7185" stroke-width="4"/>
     <text x="480" y="580" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" fill="#9f1239">Second shelf</text>`,
  ),
  drain: illustration(
    "Drain bottle scale",
    ["Read at eye level", "Record 06:00, 14:00, 22:00", "Describe the colour, not only the ml"],
    "#0284c7",
    `<rect x="390" y="250" width="180" height="430" rx="70" fill="#e0f2fe" stroke="#0284c7" stroke-width="6"/>
     <rect x="414" y="430" width="132" height="220" rx="50" fill="#38bdf8"/>
     <path d="M430 340 H530 M430 400 H530 M430 460 H530 M430 520 H530 M430 580 H530" stroke="#0369a1" stroke-width="3"/>
     <text x="560" y="468" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" fill="#0369a1">meniscus</text>`,
  ),
  escalate: illustration(
    "When to call surgery",
    ["Bright red output", "Above the threshold in the op note", "Call the same hour — do not wait"],
    "#d97706",
    `<rect x="230" y="270" width="500" height="360" rx="28" fill="#fffbeb" stroke="#d97706" stroke-width="4"/>
     <text x="480" y="360" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="30" font-weight="700" fill="#92400e">Same-hour review</text>
     <text x="480" y="430" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" fill="#78350f">Colour change or volume spike</text>
     <text x="480" y="490" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" fill="#78350f">Tell the nurse in charge first</text>`,
  ),
  pump: illustration(
    "PCA pump face",
    ["Green button · patient bolus", "Locked menu · staff programme", "Relatives do not press the button"],
    "#4f46e5",
    `<rect x="250" y="260" width="460" height="400" rx="36" fill="#eef2ff" stroke="#4f46e5" stroke-width="6"/>
     <circle cx="400" cy="430" r="54" fill="#16a34a"/>
     <text x="400" y="438" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="18" font-weight="700" fill="#ffffff">BOLUS</text>
     <circle cx="560" cy="430" r="54" fill="#cbd5e1" stroke="#64748b" stroke-width="4"/>
     <text x="560" y="438" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="16" fill="#334155">LOCK</text>`,
  ),
};
