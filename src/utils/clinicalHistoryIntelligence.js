const normalize = (value = "") => value.toLowerCase().trim();

const firstMatch = (text, patterns) => {
  const match = patterns.map((pattern) => text.match(pattern)).find(Boolean);
  return match?.[1] || "";
};

export const extractClinicalInformation = (answers = {}) => {
  const rawAnswers = Object.values(answers)
    .filter((value) => typeof value === "string")
    .join(" ");

  const text = normalize(rawAnswers);
  const extracted = {};

  const category =
    /chest pain|chest discomfort|ఛాతి నొప్పి|छाती में दर्द/i.test(text)
      ? "chest"
      : /\bfever\b|జ్వరం|बुखार/i.test(text)
        ? "fever"
        : /\bcough(?:ing)?\b|దగ్గు|खांसी/i.test(text)
          ? "cough"
          : /stomach pain|abdominal pain|కడుపు నొప్పి|पेट दर्द/i.test(text)
            ? "stomach"
            : "generic";

  if (category !== "generic") {
    extracted.chiefComplaint = answers.chiefComplaint || category;
  }

  const onset = firstMatch(text, [
    /(?:fever|cough(?:ing)?|pain).{0,20}?\bfor\s+(.{1,20}?)(?:\s+(?:with|and|when|it|i)\b|[,.]|$)/i,
    /(?:since|for|from|started|start(?:ed)?|had)\s+(.{1,30}?)(?:\s+(?:and|with|when|it|i)\b|[,.]|$)/i,
    /(?:ఎప్పటి నుంచి|ఎన్ని రోజులు|से|के लिए)\s+(.{1,30})/i,
  ]);

  if (onset) {
    if (category === "fever") extracted.feverStart = onset;
    else if (category === "cough") extracted.coughDuration = onset;
    else if (category === "stomach") extracted.stomachStart = onset;
    else extracted.chestStart = onset;
  }

  const severity = firstMatch(text, [
    /(?:about|around|severity|at)\s*(\d{1,2}(?:\s*\/\s*10)?)/i,
    /\b(10|[1-9])\s*(?:out of|\/)\s*10\b/i,
  ]);

  if (severity) {
    if (category === "stomach") extracted.stomachSeverity = severity;
    else if (category === "cough") extracted.coughSeverity = severity;
    else extracted.chestSeverity = severity;
  }

  if (/(when i walk|walking|exertion|activity)/i.test(text)) {
    extracted.trigger = "walking/exertion";
  }

  if (
    /(not having|no|without).{0,20}(difficulty breathing|shortness of breath)|\bno\s+breathing difficulty\b/i.test(
      text,
    )
  ) {
    extracted.breathing = "No";
    extracted.coughBreathing = "No";
  } else if (
    /(difficulty breathing|shortness of breath|breathless|శ్వాస తీసుకోవడంలో ఇబ్బంది|सांस लेने में दिक्कत)/i.test(
      text,
    )
  ) {
    extracted.breathing = "Yes";
    extracted.coughBreathing = "Yes";
  }

  if (/\bchills?\b|చలి|ठंड लगना/i.test(text)) {
    extracted.feverChills = "Yes";
  }

  if (/\bbody pain\b|శరీర నొప్పి|शरीर में दर्द/i.test(text)) {
    extracted.feverBodyPain = "Yes";
  }

  if (/(yellow|green|blood).{0,15}(mucus|sputum)|కఫం|बलगम/i.test(text)) {
    extracted.coughType = "With mucus";
    extracted.coughColor =
      firstMatch(text, [/(yellow|green|blood).{0,15}(?:mucus|sputum)/i]) ||
      "Mucus mentioned";
  }

  if (/\bvomit|vomiting\b|వాంతి|उल्टी/i.test(text)) {
    extracted.stomachVomiting = "Yes";
  }

  if (/\bdiarrhea\b|విరేచనాలు|दस्त/i.test(text)) {
    extracted.stomachBowels = "Diarrhea";
  }

  return extracted;
};

/*
 * History Completeness Engine
 *
 * Converts the collected clinical information into a simple
 * doctor-facing completeness score.
 */
export const analyzeHistoryCompleteness = (answers = {}) => {
  const extracted = extractClinicalInformation(answers);
  const merged = { ...extracted, ...answers };

  const hasValue = (value) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    value.trim().toLowerCase() !== "not reported";

  const hasAny = (keys) => keys.some((key) => hasValue(merged[key]));

  const captured = [];
  const missing = [];

  // 1. Chief complaint
  if (hasAny(["chiefComplaint"])) {
    captured.push("Chief complaint");
  } else {
    missing.push("Chief complaint");
  }

  // 2. Duration / onset
  if (
    hasAny([
      "feverStart",
      "coughDuration",
      "stomachStart",
      "chestStart",
      "generalStart",
    ])
  ) {
    captured.push("Duration");
  } else {
    missing.push("Duration / onset");
  }

  // 3. Severity
  if (
    hasAny([
      "chestSeverity",
      "stomachSeverity",
      "coughSeverity",
      "generalSeverity",
      "severity",
    ])
  ) {
    captured.push("Severity");
  } else {
    missing.push("Severity");
  }

  // 4. Associated symptoms
  if (
    hasAny([
      "relevantSymptoms",
      "breathing",
      "coughBreathing",
      "feverChills",
      "feverBodyPain",
      "stomachVomiting",
      "stomachBowels",
      "coughType",
      "coughColor",
      "trigger",
    ])
  ) {
    captured.push("Associated symptoms");
  } else {
    missing.push("Associated symptoms");
  }

  // 5. Medical history / medication
  if (
    hasAny([
      "medicalHistory",
      "previousHistory",
      "pastMedicalHistory",
      "medications",
      "currentMedication",
      "currentMedications",
    ])
  ) {
    captured.push("Medical history / medication");
  } else {
    missing.push("Medical history / medication");
  }

  const percentage = Math.round((captured.length / 5) * 100);

  let quality = "LIMITED";

  if (percentage >= 80) {
    quality = "GOOD";
  } else if (percentage >= 50) {
    quality = "PARTIAL";
  }

  return {
    percentage,
    score: percentage,
    quality,
    captured,
    missing,
    doctorNeeds: missing,
  };
};
