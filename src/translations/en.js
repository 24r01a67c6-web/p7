// English translations (simple, clear, everyday vocabulary)
export const en = {
  // Common navigation & controls
  appName: 'Pravedā',
  appSubtitle: 'Intelligent Pre-Consultation Care',
  continue: 'Continue',
  back: 'Back',
  submit: 'Submit to Doctor',
  done: 'Done',
  cancel: 'Cancel',
  edit: 'Edit History',
  send: 'Send',
  save: 'Save',
  saveAssessment: 'Save Assessment',
  listen: '🔊 Listen',
  stopListening: 'Stop Listening',
  speak: '🎤 Speak',
  listening: 'Listening... Speak Now',
  typeAnswerPlaceholder: 'Type your answer here...',
  stepOf: 'Step {current} of {total}: {title}',
  percentComplete: '{percent}% Complete',
  languageBadge: 'English',
  adaptiveInstructions: 'Your next question changes based on your answers. You can skip anything.',
  aiAssistant: 'Pravedā Clinical Assistant',
  generalHistory: 'General health history',
  skip: 'Skip',
  voiceUnsupported: 'Voice input is not supported in this browser.',
  voiceError: 'We could not hear that. Please try again or type your answer.',

  // Progress step titles
  steps: {
    language: 'Choose Language',
    documents: 'Previous Reports',
    demographics: 'Patient Details',
    history: 'Medical Concerns',
    summary: 'Review & Submit'
  },

  // Landing page
  landing: {
    badge: 'Designed for OPD hospital intake',
    title: 'Pravedā',
    tagline: '"Intelligent pre-consultation care"',
    description: 'Tell us your health concerns and share previous medical reports before meeting your doctor.',
    startConsultation: 'Start Consultation',
    doctorDashboard: 'Doctor Dashboard'
  },

  // Language selection page
  languagePage: {
    title: 'Choose Your Language',
    subtitle: 'Select the language you are most comfortable speaking and reading',
    listenText: 'Please choose your preferred language to start your consultation.'
  },

  // Document page (Step 1 of Patient Intake)
  documentsPage: {
    title: 'Previous Medical Reports',
    subtitle: 'Do you have any previous medical documents?',
    listenText: 'Do you have any previous doctor prescriptions, lab test reports, or hospital discharge summaries with you today?',
    question: 'Do you have any previous medical documents or doctor reports?',
    questionSub: 'Such as doctor prescriptions, blood test reports, or hospital summaries',
    yesOption: 'Yes, I have documents',
    yesOptionDesc: 'Upload doctor slips, lab tests or scans',
    noOption: "I don't have any documents",
    noOptionDesc: 'Continue straight to consultation without reports',
    noDocsNoticeTitle: 'No documents added.',
    noDocsNoticeDesc: 'Continuing to patient details...',
    types: {
      prescription: 'Prescription',
      prescriptionDesc: 'Doctor prescription slips or bills',
      labReport: 'Lab Report',
      labReportDesc: 'Blood test, urine, X-ray or scan report',
      discharge: 'Discharge Summary',
      dischargeDesc: 'Hospital stay summary or surgery papers',
      other: 'Other Medical Record',
      otherDesc: 'Any other previous health paper'
    },
    clickToUpload: 'Tap to Choose File',
    scanning: 'Scanning document...',
    processing: 'Checking document...',
    ready: 'Document ready ✓',
    uploadedSuccess: 'Document uploaded ✓',
    fileName: 'File name',
    fileType: 'File type',
    recordedListTitle: 'Uploaded Medical Documents',
    continueToPatientInfo: 'Continue to Patient Info'
  },

  // Registration page (Step 2 of Patient Intake)
  registrationPage: {
    title: 'Patient Information',
    subtitle: 'Enter your basic details so the doctor can call your token',
    listenText: 'Please enter your full name, age, gender, phone number, and select the OPD department you want to visit.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. Ramesh Patel',
    age: 'Age (in years)',
    agePlaceholder: 'e.g. 52',
    gender: 'Gender',
    genders: {
      male: 'Male',
      female: 'Female',
      other: 'Other'
    },
    phone: 'Phone Number',
    phonePlaceholder: 'e.g. 98765 43210',
    department: 'OPD Department to Visit',
    departments: {
      generalMedicine: 'General Medicine (Fever, Cough, General illness)',
      cardiology: 'Cardiology (Heart, Blood Pressure, Chest pain)',
      orthopedics: 'Orthopedics (Bones, Joints, Knee/Back pain)',
      pediatrics: 'Pediatrics (Children & Infants)',
      ayush: 'AYUSH (Ayurveda, Yoga, Traditional medicine)'
    },
    errors: {
      name: 'Please enter your full name',
      age: 'Please enter a valid age (1 to 120)',
      phone: 'Please enter your 10-digit phone number'
    },
    continueToHistory: 'Continue to Medical History'
  },

  // History taking page (Step 3 of Patient Intake)
  historyPage: {
    title: 'Medical Concerns',
    subtitle: 'Answer a few simple questions about how you feel today',
    aiAssistant: 'Pravedā Clinical Assistant',
    questionCount: 'Question {current} of {total}',
    chooseHowToRespond: 'Choose how to answer:',
    speakBtn: '🎤 Speak',
    listeningMsg: 'Listening... Please speak now',
    unsupportedVoice: 'Voice input is not supported in this browser. Please tap or type your answer.',
    conversationLog: 'Conversation Log:',
    nextQuestion: 'Next Question',
    toSummary: 'Continue to Summary',

    // Red flag alert banner & modal
    emergencyBannerTitle: '🚨 Potential Emergency Symptom Detected',
    emergencyBannerDesc: 'High-risk symptom detected. Please alert the triage nurse or hospital staff immediately.',
    emergencyModalText: 'Chest pain or breathing difficulty detected. Please inform hospital nursing staff right away.',
    emergencyModalBtn: 'I Have Informed Triage Staff',
    emergencyDisclaimer: 'This is an automatic safety alert, not a doctor diagnosis.',

    // 5 Simple Mock Clinical Questions & Chips
    questions: [
      {
        text: 'What is your main problem today?',
        chips: [
          { label: 'Headache', icon: '🤕', emergency: false },
          { label: 'Fever', icon: '🤒', emergency: false },
          { label: 'Chest Pain', icon: '🚨', emergency: true },
          { label: 'Stomach Pain', icon: '🤢', emergency: false },
          { label: 'Cough / Cold', icon: '🤧', emergency: false },
          { label: 'Other', icon: '❓', emergency: false }
        ]
      },
      {
        text: 'How long have you had this problem?',
        chips: [
          { label: 'Started today', icon: '⏱️', emergency: false },
          { label: '2-3 days', icon: '📅', emergency: false },
          { label: 'About 1 week', icon: '🗓️', emergency: false },
          { label: 'More than a month', icon: '⏳', emergency: false }
        ]
      },
      {
        text: 'Are you having any other difficulty or pain?',
        chips: [
          { label: 'Mild discomfort', icon: '🙂', emergency: false },
          { label: 'Moderate pain', icon: '😐', emergency: false },
          { label: 'Severe pain', icon: '😣', emergency: false },
          { label: 'Difficulty breathing', icon: '🚨', emergency: true },
          { label: 'No other symptoms', icon: '👍', emergency: false }
        ]
      },
      {
        text: 'Do you take any regular medicines or have long-term illness?',
        chips: [
          { label: 'High Blood Pressure', icon: '🩺', emergency: false },
          { label: 'Diabetes (Sugar)', icon: '🩸', emergency: false },
          { label: 'Asthma (Inhaler)', icon: '🫁', emergency: false },
          { label: 'No past illness', icon: '✨', emergency: false }
        ]
      },
      {
        text: 'Do you have any known allergy to medicines or food?',
        chips: [
          { label: 'No allergies', icon: '🛡️', emergency: false },
          { label: 'Penicillin allergy', icon: '💊', emergency: false },
          { label: 'Sulfa medicine', icon: '💊', emergency: false },
          { label: 'Dust / Pollen', icon: '🌾', emergency: false }
        ]
      }
    ]
  },

  // Summary page (Step 4 of Patient Intake)
  summaryPage: {
    title: 'Your Clinical Summary',
    subtitle: 'Review your details before submitting to the doctor',
    listenText: 'Please review your answers before submitting your details to the attending physician.',
    patientSectionTitle: 'PATIENT REVIEW',
    doctorSectionTitle: 'DOCTOR CLINICAL SUMMARY (ENGLISH)',
    draftBadge: 'AI-generated draft – requires physician review',
    notReported: 'Not reported',
    labels: {
      patientInfo: 'Patient Information',
      chiefComplaint: 'Chief Complaint',
      hpi: 'History of Present Illness (HPI)',
      pmh: 'Past Medical Conditions',
      medications: 'Current Medicines',
      allergies: 'Allergies',
      investigations: 'Previous Reports & Documents',
      redFlags: 'Red-Flag Safety Check'
    },
    redFlagDetected: '⚠️ Emergency Alert: Acute symptoms reported – flagged for immediate nurse triage',
    redFlagNone: 'None reported',
    submissionSuccessTitle: 'Submitted to Doctor Queue!',
    submissionSuccessMsg: 'Token #{token} generated for {name} ({department} OPD). Please take your seat in the OPD waiting area.',
    viewDashboard: 'View Doctor Dashboard',
    doneNextPatient: 'Done / Next Patient'
  },
  languageTitle: 'Choose Your Language',
  languageSubtitle: 'Select the language you prefer for your consultation',
  selected: 'Selected',
  step: 'Step',
  male: 'Male',
  female: 'Female',
  generalMedicine: 'General Medicine',
  cardiology: 'Cardiology',
  orthopedics: 'Orthopedics',
  pediatrics: 'Pediatrics',
  ayush: 'AYUSH',
  documentsQuestion: 'Do you have any previous medical reports?',
  yesDocuments: 'Yes, I have documents',
  noDocuments: "I don't have documents",
  documentsTitle: 'Previous Medical Documents',
  documentsSubtitle: 'You can upload JPG, PNG, or PDF files. Documents are optional.',
  upload: 'Upload documents',
  checking: 'Checking document...',
  ready: 'Document ready ✓',
  uploaded: 'Document uploaded ✓',
  continuing: 'Continuing...',
  noDocs: 'No documents added.',
  patientTitle: 'Patient Information',
  patientSubtitle: 'Enter your basic details',
  fullName: 'Full Name',
  age: 'Age',
  gender: 'Gender',
  phone: 'Phone Number',
  department: 'Department',
  enterName: 'Enter your full name',
  enterAge: 'Enter your age',
  enterPhone: 'Enter your phone number',
  nameError: 'Please enter your full name',
  ageError: 'Please enter a valid age',
  phoneError: 'Please enter your phone number',
  historyTitle: 'Medical History',
  question: 'Question',
  touchAnswer: 'Touch to select an answer:',
  chooseResponse: 'Choose how to respond:',
  speak: 'Speak',
  listening: 'Listening... Speak now',
  typeAnswer: 'Type your answer here...',
  set: 'Set',
  next: 'Next',
  finish: 'Finish',
  mainProblem: 'What is your main problem today?',
  duration: 'How long have you had this problem?',
  otherSymptoms: 'Are you having any other symptoms or pain?',
  conditions: 'Do you have any past medical conditions or take medicines?',
  allergies: 'Do you have any drug or food allergies?',
  headache: 'Headache', fever: 'Fever', chestPain: 'Chest Pain', stomachPain: 'Stomach Pain', other: 'Other',
  startedToday: 'Started today', days: '2-3 days', week: 'About 1 week', month: 'More than a month',
  mild: 'Mild discomfort', moderate: 'Moderate pain', severe: 'Severe pain', breathing: 'Difficulty breathing',
  none: 'None', highBp: 'High Blood Pressure', diabetes: 'Diabetes', asthma: 'Asthma',
  noAllergies: 'No allergies', penicillin: 'Penicillin', dust: 'Dust / Pollen', food: 'Food allergy',
  emergencyTitle: 'Potential emergency symptom detected',
  emergencyText: 'Please alert the triage staff immediately.',
  saving: 'Saving...',
  savePatientError: 'We could not save your details. Please try again.',
  supabaseNotConfigured: 'Patient registration is not available yet. Please contact the kiosk staff.'
};
