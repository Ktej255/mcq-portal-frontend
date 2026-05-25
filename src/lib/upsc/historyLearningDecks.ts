import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";
import type { SubjectDayReadiness } from "@/lib/upsc/subjectReadiness";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";

export type HistoryLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
  mcqAngles: string[];
};

export type HistoryLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

export type HistoryVisualCommandDeck = {
  title: string;
  subtitle: string;
  rails: Array<{
    label: string;
    marker: string;
    detail: string;
  }>;
  recognition: Array<{
    label: string;
    value: string;
    proof: string;
  }>;
  trapClinic: string[];
  prompt: string;
};

export type HistoryMediaStudioDeck = {
  title: string;
  subtitle: string;
  canvasLabel: string;
  motionCue: string;
  mapAnchors: Array<{
    label: string;
    region: string;
    clue: string;
    x: number;
    y: number;
  }>;
  timeline: Array<{
    marker: string;
    label: string;
    cue: string;
  }>;
  recognitionTargets: Array<{
    label: string;
    cue: string;
    check: string;
  }>;
};

export type HistoryLectureMediaDeck = {
  title: string;
  subtitle: string;
  assetStatus: string;
  durationLabel: string;
  primarySlot: {
    label: string;
    kind: string;
    placeholder: string;
    cue: string;
  };
  segments: Array<{
    timestamp: string;
    title: string;
    visual: string;
    teacherCue: string;
    studentAction: string;
  }>;
  assetSlots: Array<{
    id: string;
    label: string;
    kind: string;
    requirement: string;
    use: string;
  }>;
  transcriptPrompts: string[];
};

export type HistoryRevisionCommandBlock = {
  id: string;
  title: string;
  dayRange: string;
  focus: string;
  trapFocus: string;
  commandCount: number;
  totalDays: number;
  averageScore: number;
  nextAction?: SubjectDayReadiness;
  weakDays: SubjectDayReadiness[];
  stageGaps: Array<{
    label: string;
    count: number;
  }>;
};

export type HistoryRevisionCommandDeck = {
  score: number;
  commandCount: number;
  totalDays: number;
  retestQueue: SubjectDayReadiness[];
  blocks: HistoryRevisionCommandBlock[];
  protocol: string[];
};

const packByLab: Record<string, HistoryLearningPack> = {
  "Modern Timeline": {
    lens: "Modern timeline causation frame",
    teacherFocus:
      "Teach Modern History through chronology, economic pressure, political control, social response, personalities, laws, movement form, and consequence.",
    caseAnchors: ["1857 centre-leader-cause map", "Revenue systems to agrarian distress", "Company to Crown shift", "Law-movement-response timeline"],
    causeChain: ["Event", "Background cause", "Immediate trigger", "Actor", "British response", "Consequence", "Next phase"],
    oralChecklist: ["Place the event in chronology", "Name cause and trigger", "Name actors", "Explain consequence and next phase"],
    trapBank: [
      "Reducing Modern History to dates while missing cause, actor, British response, and consequence.",
      "Mixing background causes with immediate triggers in revolt and movement questions.",
      "Treating every event as pan-India when many were regionally uneven.",
    ],
    keywords: ["modern", "timeline", "company", "crown", "revolt", "revenue", "movement", "law", "leader", "consequence"],
    mcqAngles: ["cause-centre-consequence trap", "chronology-order trap", "leader-region pairing"],
  },
  "National Movement Board": {
    lens: "Ideology-method-social-base movement frame",
    teacherFocus:
      "Read the national movement through ideology, method, leadership, social base, British response, limitations, and transition to the next phase.",
    caseAnchors: ["Moderate economic critique", "Swadeshi boycott-national education chain", "Gandhian mass mobilisation", "Revolutionary networks"],
    causeChain: ["Issue", "Ideology", "Method", "Social base", "Leadership", "British response", "Limitation"],
    oralChecklist: ["Name ideology", "Explain method", "Add social base", "State limitation and historical impact"],
    trapBank: [
      "Calling all nationalist streams identical while their ideology, method, and social base differed.",
      "Ignoring limitations of each movement and why the next phase emerged.",
      "Listing leaders without connecting them to method, region, and organisation.",
    ],
    keywords: ["national", "movement", "moderate", "extremist", "gandhi", "revolutionary", "social", "base", "method", "ideology"],
    mcqAngles: ["ideology-method trap", "leader-organisation pairing", "movement limitation trap"],
  },
  "Constitutional Development": {
    lens: "Act-institution-representation-transfer frame",
    teacherFocus:
      "Explain constitutional history through acts, councils, representation, executive control, federal ideas, communal provisions, and transfer of power.",
    caseAnchors: ["Regulating Act to Board of Control", "1909-1919-1935 representation chain", "Separate electorate trap", "Cabinet Mission to transfer of power"],
    causeChain: ["Act", "Administrative change", "Representation", "Control", "Federal idea", "Limitation", "Legacy"],
    oralChecklist: ["Name the act", "State institutional change", "State representation feature", "Explain limitation and legacy"],
    trapBank: [
      "Mixing council expansion, responsible government, dyarchy, provincial autonomy, and federation.",
      "Reading constitutional acts as isolated facts instead of a transfer-of-control sequence.",
      "Confusing separate electorate, reservation, franchise, and communal award.",
    ],
    keywords: ["act", "council", "representation", "dyarchy", "federation", "autonomy", "electorate", "cabinet", "mission", "transfer"],
    mcqAngles: ["act-feature matching", "representation-control sequence", "federal idea trap"],
  },
  "Ancient Civilisation Map": {
    lens: "Source-site-polity-economy-culture frame",
    teacherFocus:
      "Teach Ancient History by tying sources, sites, geography, polity, economy, society, religion, trade, art, and regional patterns together.",
    caseAnchors: ["Indus site-feature map", "Magadha rise through geography and resources", "Mauryan administration-dhamma chain", "Sangam trade-region evidence"],
    causeChain: ["Source", "Site or region", "Polity", "Economy", "Society", "Culture", "Historical inference"],
    oralChecklist: ["Name the source", "Locate the site or region", "Explain polity/economy", "Add cultural inference"],
    trapBank: [
      "Using literary or archaeological sources without explaining what they can and cannot prove.",
      "Mixing Indus, Vedic, Mauryan, Gupta, and Sangam features across periods.",
      "Ignoring geography and trade while explaining ancient political expansion.",
    ],
    keywords: ["ancient", "source", "site", "indus", "vedic", "maurya", "gupta", "sangam", "trade", "polity"],
    mcqAngles: ["site-feature pairing", "source-inference trap", "period-feature mismatch"],
  },
  "Ancient Thought Lab": {
    lens: "Doctrine-text-patronage-practice-impact frame",
    teacherFocus:
      "Read ancient religions, philosophies, literature, science, and language through doctrine, text, patronage, practice, spread, and social impact.",
    caseAnchors: ["Buddhist councils and spread", "Jain doctrine and practice", "Six schools comparison", "Sanskrit-Pali-Prakrit-Tamil source map"],
    causeChain: ["Doctrine", "Text", "Patronage", "Practice", "Institution", "Spread", "Impact"],
    oralChecklist: ["Define doctrine", "Name text or source", "Add patronage/practice", "Explain spread or social impact"],
    trapBank: [
      "Confusing doctrine, text, sect, council, and patronage in Buddhism and Jainism.",
      "Treating philosophy and religion as static without institution and practice.",
      "Mixing language traditions and literary sources without period context.",
    ],
    keywords: ["doctrine", "text", "patronage", "buddhism", "jainism", "philosophy", "literature", "language", "science", "practice"],
    mcqAngles: ["doctrine-text trap", "council-patronage pairing", "language-source mismatch"],
  },
  "Medieval Polity Grid": {
    lens: "Dynasty-administration-economy-region-transition frame",
    teacherFocus:
      "Build Medieval History through dynasty, administration, revenue, nobility, region, military pressure, economy, culture, and transition.",
    caseAnchors: ["Iqta to mansabdari comparison", "Vijayanagara-Bahmani Deccan grid", "Mughal revenue and nobility chain", "18th century regionalisation"],
    causeChain: ["Dynasty", "Military base", "Administration", "Revenue", "Nobility", "Region", "Transition"],
    oralChecklist: ["Name polity", "Explain administration/revenue", "Add region and nobility", "State transition or decline factor"],
    trapBank: [
      "Mixing Sultanate, Mughal, Vijayanagara, Bahmani, Maratha, and regional institutions.",
      "Explaining medieval polity without revenue, military, nobility, and region.",
      "Treating decline as one-cause collapse rather than layered fiscal, military, and regional pressure.",
    ],
    keywords: ["medieval", "dynasty", "sultanate", "mughal", "iqta", "mansab", "revenue", "nobility", "deccan", "transition"],
    mcqAngles: ["institution-dynasty trap", "revenue-administration pairing", "decline-cause trap"],
  },
  "Bhakti Sufi Culture": {
    lens: "Teacher-language-institution-practice-society frame",
    teacherFocus:
      "Teach Bhakti and Sufi traditions through teacher, language, institution, practice, message, region, social reach, and cultural synthesis.",
    caseAnchors: ["Alvar-Nayanar to regional bhakti", "Nirguna-saguna saint comparison", "Sufi silsila-khanqah map", "Vernacular language and social reach"],
    causeChain: ["Teacher", "Region", "Language", "Institution", "Practice", "Message", "Social impact"],
    oralChecklist: ["Name teacher/order", "Add region and language", "Explain practice/message", "State social impact"],
    trapBank: [
      "Mixing Bhakti sects, Sufi orders, saints, regions, and languages.",
      "Writing only spiritual message while missing institution, vernacular reach, and society.",
      "Treating synthesis as uniform across all regions and traditions.",
    ],
    keywords: ["bhakti", "sufi", "saint", "silsila", "khanqah", "language", "devotion", "vernacular", "society", "synthesis"],
    mcqAngles: ["saint-region-language pairing", "order-institution trap", "nirguna-saguna distinction"],
  },
  "Art Architecture Lab": {
    lens: "Style-feature-site-patronage-period frame",
    teacherFocus:
      "Convert Art and Architecture into exam-ready recognition by linking style, feature, site, material, patronage, period, school, and iconography.",
    caseAnchors: ["Nagara-Dravida-Vesara comparison", "Stupa-chaitya-vihara distinction", "Gandhara-Mathura-Amaravati school map", "Indo-Islamic regional feature grid"],
    causeChain: ["Form", "Feature", "Site", "Material", "Patronage", "Period", "Identification"],
    oralChecklist: ["Name the form", "State two features", "Attach site/patronage", "Place it in period or school"],
    trapBank: [
      "Recognising a monument name without style, feature, patronage, and period proof.",
      "Mixing temple architecture terms like shikhara, vimana, mandapa, garbhagriha, and gopuram.",
      "Confusing sculpture schools, painting schools, and architectural styles.",
    ],
    keywords: ["art", "architecture", "temple", "stupa", "cave", "school", "site", "patronage", "iconography", "style"],
    mcqAngles: ["style-feature-site trap", "term-definition mismatch", "school-patronage pairing"],
  },
  "Culture Current Affairs": {
    lens: "Heritage-institution-location-community-conservation frame",
    teacherFocus:
      "Turn culture news into stable notes by mapping heritage type, institution, location, feature, community, conservation, scheme, and exam hook.",
    caseAnchors: ["UNESCO tangible-intangible split", "GI tag location-community map", "ASI excavation to source inference", "Festival-news to culture concept"],
    causeChain: ["News", "Heritage type", "Location", "Institution", "Community", "Feature", "Exam hook"],
    oralChecklist: ["Name heritage type", "Locate it", "Add institution/community", "Extract MCQ or mains hook"],
    trapBank: [
      "Using culture news as headline memory without heritage type, location, institution, and feature.",
      "Mixing UNESCO, GI, ASI, museum, academy, and ministry roles.",
      "Ignoring the community and conservation angle in living traditions.",
    ],
    keywords: ["culture", "current", "heritage", "unesco", "gi", "asi", "festival", "institution", "community", "conservation"],
    mcqAngles: ["heritage-type trap", "institution-role pairing", "location-community hook"],
  },
  "History Revision Board": {
    lens: "Timeline-source-map-personality-culture-PYQ frame",
    teacherFocus:
      "Close History through integrated recall: timeline, source, map, personality, culture, chronology, PYQ traps, and weak-area recovery.",
    caseAnchors: ["Modern-to-independence timeline drill", "Ancient source-site drill", "Medieval institution comparison", "Art-culture feature recognition"],
    causeChain: ["Timeline", "Source", "Map", "Personality", "Culture", "PYQ trap", "Repair"],
    oralChecklist: ["State timeline", "Attach source/map", "Name personality or feature", "Predict PYQ trap and repair note"],
    trapBank: [
      "Revising History as isolated facts instead of timeline, source, map, personality, and culture links.",
      "Leaving weak areas untagged after mixed practice.",
      "Missing pair-matching and chronology traps in PYQ-style questions.",
    ],
    keywords: ["revision", "timeline", "source", "map", "personality", "culture", "pyq", "trap", "repair", "command"],
    mcqAngles: ["mixed chronology trap", "source-map-personality pairing", "feature-period mismatch"],
  },
};

const labDecks: Record<string, Omit<HistoryLabDeckCard, "id">[]> = {
  "modern-timeline": [
    {
      title: "1857 Cause-Centre-Consequence Grid",
      category: "Modern History",
      anchor: "Causes, centres, leaders, character, failure, consequences",
      detail:
        "Use the revolt as a structured timeline: background discontent, immediate trigger, regional centres, leadership, failure, Crown takeover, and army/policy change.",
      examTrap: "Do not treat 1857 as one uniform pan-India nationalist movement.",
      proofHint: "Write one line that links cause, centre, leader, and consequence.",
    },
    {
      title: "Revenue To Resistance Chain",
      category: "Company Rule",
      anchor: "Permanent settlement, ryotwari, mahalwari, commercialization, peasant distress",
      detail:
        "Connect land revenue, commercialization, credit, deindustrialisation, and resistance without reducing every uprising to one cause.",
      examTrap: "Revenue system details are often tested through region and social impact.",
      proofHint: "Attach one region to one revenue system and one consequence.",
    },
  ],
  "national-movement-board": [
    {
      title: "Movement Anatomy Board",
      category: "National Movement",
      anchor: "Ideology, method, social base, leader, British response, limitation",
      detail:
        "Compare Moderates, Extremists, revolutionaries, Gandhian movements, socialists, peasants, workers, and women through the same six-part frame.",
      examTrap: "Leader lists are weak unless connected to ideology, method, and social base.",
      proofHint: "Give one movement with ideology, method, social base, and limitation.",
    },
    {
      title: "Swadeshi To Mass Politics Bridge",
      category: "Movement Transition",
      anchor: "Boycott, national education, passive resistance, social base, regional spread",
      detail:
        "Show how Swadeshi introduced methods and vocabulary that later mass politics expanded and modified.",
      examTrap: "Swadeshi was not identical to later Gandhian satyagraha.",
      proofHint: "Name one continuity and one difference between two movement phases.",
    },
  ],
  "constitutional-development": [
    {
      title: "Act To Institution Table",
      category: "Constitutional History",
      anchor: "1773, 1784, 1861, 1892, 1909, 1919, 1935, 1947",
      detail:
        "Track every act through central control, council expansion, Indian participation, representation, dyarchy, provincial autonomy, federation, and transfer.",
      examTrap: "Do not mix dyarchy in provinces with dyarchy at the centre.",
      proofHint: "Pick one act and state feature, limitation, and legacy.",
    },
    {
      title: "Representation Trap Board",
      category: "Modern Polity Link",
      anchor: "Separate electorate, franchise, communal award, reserved seats, federal idea",
      detail:
        "Separate representation devices from administrative control so constitutional questions do not become a memorised list.",
      examTrap: "Separate electorate, reservation, and franchise are not the same thing.",
      proofHint: "Define two representation terms with one example each.",
    },
  ],
  "ancient-civilisation-map": [
    {
      title: "Indus Site Feature Map",
      category: "Ancient History",
      anchor: "Harappa, Mohenjo-daro, Dholavira, Lothal, Kalibangan, Rakhigarhi",
      detail:
        "Map sites to urban planning, craft, trade, water management, fire altars, dockyard debates, seals, weights, and decline theories.",
      examTrap: "Avoid assigning every Indus feature to every site.",
      proofHint: "Name one site and one defensible feature with source type.",
    },
    {
      title: "Magadha To Maurya Resource Chain",
      category: "Ancient Polity",
      anchor: "Geography, iron, agriculture, elephants, trade, administration, dhamma",
      detail:
        "Explain state formation through resources, strategic location, military capacity, administrative organisation, and ideological integration.",
      examTrap: "Magadha's rise was not only because of one ruler or one battle.",
      proofHint: "Give two material factors and one administrative/cultural factor.",
    },
  ],
  "ancient-thought-lab": [
    {
      title: "Doctrine Text Practice Grid",
      category: "Religion and Philosophy",
      anchor: "Buddhism, Jainism, Ajivikas, six schools, bhakti roots",
      detail:
        "Compare doctrines by text, concept, monastic or lay practice, patronage, spread, and social impact.",
      examTrap: "Doctrine, sect, council, text, and patron are different testing layers.",
      proofHint: "Choose one tradition and name doctrine, text, and practice.",
    },
    {
      title: "Language Source Map",
      category: "Literature and Science",
      anchor: "Sanskrit, Pali, Prakrit, Tamil, grammar, medicine, astronomy, mathematics",
      detail:
        "Connect language and text traditions with period, region, patronage, knowledge field, and historical inference.",
      examTrap: "Literary source questions often hide period and language traps.",
      proofHint: "Attach one text or knowledge tradition to language and period.",
    },
  ],
  "medieval-polity-grid": [
    {
      title: "Iqta Mansab Jagir Comparison",
      category: "Medieval Administration",
      anchor: "Iqta, mansab, jagir, zabt, nobility, revenue, centralisation",
      detail:
        "Compare Sultanate and Mughal institutions through assignment, rank, revenue, military obligation, control, and limitation.",
      examTrap: "Do not equate iqta, mansab, and jagir as the same institution.",
      proofHint: "Write one difference between iqta and mansab/jagir.",
    },
    {
      title: "18th Century Transition Grid",
      category: "Medieval To Modern Bridge",
      anchor: "Fiscal strain, regional states, military change, nobility, European entry",
      detail:
        "Frame decline and transition as layered political, fiscal, military, regional, and external pressure.",
      examTrap: "The 18th century was not simply political chaos; regional powers were active systems.",
      proofHint: "Name one fiscal factor, one regional actor, and one external factor.",
    },
  ],
  "bhakti-sufi-culture": [
    {
      title: "Saint Region Language Grid",
      category: "Bhakti",
      anchor: "Alvars, Nayanars, Kabir, Guru Nanak, Chaitanya, Tukaram, Mirabai",
      detail:
        "Attach each saint or tradition to region, language, doctrine, practice, social reach, and literary form.",
      examTrap: "Do not mix nirguna and saguna traditions or their social vocabulary.",
      proofHint: "Name one saint with region, language, and core message.",
    },
    {
      title: "Silsila Khanqah Practice Map",
      category: "Sufi Traditions",
      anchor: "Chishti, Suhrawardi, Qadiri, Naqshbandi, khanqah, sama, social reach",
      detail:
        "Read Sufi traditions through order, teacher, institution, practice, region, music/language, and relationship with society.",
      examTrap: "Sufi orders had different practices and state relationships.",
      proofHint: "Choose one silsila and name institution, practice, and region.",
    },
  ],
  "art-architecture-lab": [
    {
      title: "Temple Style Identifier",
      category: "Architecture",
      anchor: "Nagara, Dravida, Vesara, shikhara, vimana, mandapa, gopuram",
      detail:
        "Identify temple architecture using plan, elevation, tower, gateway, mandapa, sculpture programme, region, and patronage.",
      examTrap: "Terms like shikhara, vimana, gopuram, and mandapa cannot be swapped loosely.",
      proofHint: "Identify one temple style with two features and one example.",
    },
    {
      title: "School Site Feature Board",
      category: "Art Recognition",
      anchor: "Gandhara, Mathura, Amaravati, Ajanta, Ellora, Mughal, Rajput, Pahari",
      detail:
        "Compare sculpture and painting schools by material, theme, patronage, technique, site, and period.",
      examTrap: "School, style, site, patronage, and period are tested separately.",
      proofHint: "Attach one school to material/theme and one site or patronage.",
    },
  ],
  "culture-current-affairs": [
    {
      title: "UNESCO GI Institution Map",
      category: "Culture Current Affairs",
      anchor: "UNESCO, GI tags, ASI, museums, academies, Ministry of Culture",
      detail:
        "Convert cultural news into heritage type, institution, legal or policy mechanism, location, community, and conservation issue.",
      examTrap: "UNESCO, GI, ASI, museum, academy, and ministry roles are not interchangeable.",
      proofHint: "Pick one news item and map heritage type, location, institution, and community.",
    },
    {
      title: "Living Tradition Proof Board",
      category: "Culture To Society",
      anchor: "Festival, performance, craft, oral tradition, community, conservation, market",
      detail:
        "Read living traditions through community ownership, transmission, livelihood, conservation, tourism, and cultural identity.",
      examTrap: "Living culture is not only performance; community and conservation matter.",
      proofHint: "Name one living tradition with community and conservation concern.",
    },
  ],
  "history-revision-board": [
    {
      title: "Mixed History PYQ Trap Grid",
      category: "Revision Command",
      anchor: "Timeline, source, map, personality, culture, pair matching, chronology",
      detail:
        "Use the final board to tag every wrong answer as chronology, source, map, personality, culture, feature, or interpretation error.",
      examTrap: "History revision fails when mistakes are not classified.",
      proofHint: "Classify one wrong answer by trap type and write the repair note.",
    },
    {
      title: "60-Day Recall Lock",
      category: "Final Command",
      anchor: "Modern, Ancient, Medieval, Art and Culture",
      detail:
        "Close the block by linking four History sections into a single revision map with weak days, retest dates, and PYQ hooks.",
      examTrap: "Modern, Ancient, Medieval, and Culture should not remain separate memory islands.",
      proofHint: "Write one link between a history section and a culture or source trap.",
    },
  ],
};

const visualCommandDecks: Record<string, HistoryVisualCommandDeck> = {
  "modern-timeline": {
    title: "Modern Timeline Command Deck",
    subtitle: "Turn every modern event into a cause-centre-consequence visual sequence.",
    rails: [
      {
        label: "Pre-1857 pressure",
        marker: "Cause",
        detail: "Revenue, annexation, army grievance, religious fear, social disruption, and elite displacement.",
      },
      {
        label: "May 1857 trigger",
        marker: "Event",
        detail: "Sepoy action becomes a wider revolt only where local leadership, grievance, and organisation align.",
      },
      {
        label: "Centre-leader map",
        marker: "Map",
        detail: "Delhi, Kanpur, Lucknow, Jhansi, Bareilly, Bihar, and local leadership must be attached.",
      },
      {
        label: "Crown consequence",
        marker: "Outcome",
        detail: "Company rule ends, army policy changes, princely policy shifts, and Crown control begins.",
      },
    ],
    recognition: [
      { label: "Chronology", value: "Before, during, after", proof: "The answer can place the event in sequence." },
      { label: "Map", value: "Centre plus leader", proof: "The student can pair one place with one actor." },
      { label: "Interpretation", value: "Character of revolt", proof: "The answer avoids both exaggeration and dismissal." },
    ],
    trapClinic: [
      "Uniform pan-India claim",
      "Only military cause",
      "Leader without centre",
      "Date without consequence",
    ],
    prompt: "Place today's event on this rail, then speak one cause, one centre, one leader, and one consequence.",
  },
  "national-movement-board": {
    title: "Movement Anatomy Command Deck",
    subtitle: "Compare movements by ideology, method, leadership, social base, response, and limitation.",
    rails: [
      { label: "Ideology", marker: "Belief", detail: "Moderate, extremist, revolutionary, Gandhian, socialist, peasant, or worker stream." },
      { label: "Method", marker: "Action", detail: "Petition, boycott, satyagraha, strike, underground action, constructive work, or negotiation." },
      { label: "Social base", marker: "People", detail: "Middle class, peasants, workers, women, tribes, students, business groups, or regional elites." },
      { label: "Limitation", marker: "Transition", detail: "Every phase creates its next phase through gaps, repression, expansion, or ideological pressure." },
    ],
    recognition: [
      { label: "Leader", value: "Person plus organisation", proof: "Leader is linked to a platform, region, or method." },
      { label: "Mass base", value: "Who joined", proof: "The answer names the social group, not only the national leader." },
      { label: "British response", value: "Repression or reform", proof: "The answer explains how the state reacted." },
    ],
    trapClinic: ["All streams identical", "Leader list without method", "Movement without limitation", "Social base ignored"],
    prompt: "Use the same anatomy to compare two movement phases and identify one continuity plus one difference.",
  },
  "constitutional-development": {
    title: "Act To Institution Command Deck",
    subtitle: "Separate control, councils, representation, federation, responsibility, and transfer of power.",
    rails: [
      { label: "Company control", marker: "1773-1858", detail: "Regulating Act, Pitt's Act, charter acts, and Crown transfer." },
      { label: "Council expansion", marker: "1861-1892", detail: "Law-making spaces expand before responsible government arrives." },
      { label: "Representation debate", marker: "1909-1919", detail: "Separate electorate, limited franchise, dyarchy, and provincial experiments." },
      { label: "Federation to transfer", marker: "1935-1947", detail: "Provincial autonomy, failed federation, Cabinet Mission, and transfer of power." },
    ],
    recognition: [
      { label: "Feature", value: "Act-specific", proof: "The answer can attach one feature to one act." },
      { label: "Limit", value: "Control retained", proof: "The answer identifies who still held power." },
      { label: "Legacy", value: "Constitutional inheritance", proof: "The answer links the act to later institutions." },
    ],
    trapClinic: ["Dyarchy location mix-up", "Separate electorate versus reservation", "Council expansion equals democracy", "Federation actually implemented"],
    prompt: "Pick one act and speak feature, limitation, and legacy without mixing it with another act.",
  },
  "ancient-civilisation-map": {
    title: "Source Site Civilisation Deck",
    subtitle: "Move from source to site, then to polity, economy, society, culture, and inference.",
    rails: [
      { label: "Source", marker: "Evidence", detail: "Archaeology, inscription, coin, text, travel account, or material remain." },
      { label: "Site or region", marker: "Map", detail: "Capital, port, urban centre, cave, monastery, temple, or trade zone." },
      { label: "System", marker: "Structure", detail: "Polity, economy, craft, trade, society, religion, and patronage." },
      { label: "Inference", marker: "Meaning", detail: "What the source proves, what it suggests, and what it cannot prove." },
    ],
    recognition: [
      { label: "Site feature", value: "Place plus evidence", proof: "The student avoids assigning every feature to every site." },
      { label: "Period", value: "Correct phase", proof: "Indus, Vedic, Mauryan, Gupta, and Sangam features stay separated." },
      { label: "Geography", value: "Resource route", proof: "Expansion is linked to river, iron, trade, coast, or agriculture." },
    ],
    trapClinic: ["Site-feature overreach", "Literary source as direct proof", "Period-feature mismatch", "Map ignored"],
    prompt: "Choose one source or site and explain what it proves, what it suggests, and what remains uncertain.",
  },
  "ancient-thought-lab": {
    title: "Doctrine Text Practice Deck",
    subtitle: "Read ancient thought through doctrine, text, patronage, practice, spread, and social impact.",
    rails: [
      { label: "Doctrine", marker: "Idea", detail: "Dharma, karma, ahimsa, anekantavada, middle path, moksha, or philosophical school." },
      { label: "Text", marker: "Source", detail: "Vedas, Upanishads, Tripitaka, Agamas, epics, Sangam corpus, grammar, or science texts." },
      { label: "Practice", marker: "Life", detail: "Monastery, ritual, lay following, patronage, teaching, debate, or pilgrimage." },
      { label: "Impact", marker: "Society", detail: "Language, art, ethics, institutions, education, and social reach." },
    ],
    recognition: [
      { label: "Doctrine-text", value: "Concept plus source", proof: "The concept is tied to the correct tradition." },
      { label: "Patronage", value: "Who supported", proof: "King, guild, merchant, monastery, temple, or court is named." },
      { label: "Spread", value: "Route and institution", proof: "The answer explains how ideas travelled." },
    ],
    trapClinic: ["Doctrine versus sect mix-up", "Council and patron confusion", "Language-source mismatch", "Practice ignored"],
    prompt: "Take one doctrine and connect it to text, practice, patronage, and social impact.",
  },
  "medieval-polity-grid": {
    title: "Dynasty System Command Deck",
    subtitle: "Compare medieval systems by dynasty, administration, revenue, nobility, region, and transition.",
    rails: [
      { label: "Dynasty", marker: "Power", detail: "Ruler, succession, expansion, military base, and legitimacy." },
      { label: "Administration", marker: "State", detail: "Iqta, mansab, jagir, provincial control, record keeping, and court networks." },
      { label: "Economy", marker: "Revenue", detail: "Land revenue, crafts, trade, ports, market control, coinage, and agrarian base." },
      { label: "Transition", marker: "Change", detail: "Fiscal strain, regionalisation, military pressure, nobility politics, and European entry." },
    ],
    recognition: [
      { label: "Institution", value: "System specific", proof: "Iqta, mansab, jagir, and zabt are not collapsed into one." },
      { label: "Region", value: "Delhi, Deccan, South, Bengal", proof: "The answer places the system geographically." },
      { label: "Decline", value: "Layered pressure", proof: "The answer uses more than one cause." },
    ],
    trapClinic: ["Iqta equals jagir", "One-cause decline", "Region ignored", "Economy missing"],
    prompt: "Compare one Sultanate and one Mughal institution through assignment, revenue, military role, and control.",
  },
  "bhakti-sufi-culture": {
    title: "Teacher Language Society Deck",
    subtitle: "Map devotional traditions through teacher, region, language, institution, practice, and social reach.",
    rails: [
      { label: "Teacher", marker: "Person", detail: "Saint, guru, pir, acharya, poet, or reformer." },
      { label: "Language", marker: "Reach", detail: "Tamil, Hindi, Marathi, Punjabi, Persian, Bengali, or other regional form." },
      { label: "Institution", marker: "Practice", detail: "Khanqah, matha, satsang, poetry, music, pilgrimage, or community gathering." },
      { label: "Society", marker: "Impact", detail: "Vernacular reach, social critique, devotion, identity, synthesis, or reform." },
    ],
    recognition: [
      { label: "Saint-region", value: "Person plus place", proof: "The teacher is attached to a region and language." },
      { label: "Order", value: "Silsila or sect", proof: "The answer separates order, institution, and practice." },
      { label: "Message", value: "Doctrine in society", proof: "The message is linked to social reach." },
    ],
    trapClinic: ["Nirguna-saguna mix-up", "Sufi order confusion", "Language missing", "Uniform synthesis claim"],
    prompt: "Name one saint or silsila and attach region, language, practice, and social impact.",
  },
  "art-architecture-lab": {
    title: "Art Architecture Recognition Deck",
    subtitle: "Identify forms by style, feature, site, material, patronage, period, and iconography.",
    rails: [
      { label: "Form", marker: "Object", detail: "Stupa, cave, temple, mosque, tomb, fort, palace, sculpture, painting, or manuscript." },
      { label: "Feature", marker: "Visual cue", detail: "Shikhara, vimana, mandapa, gopuram, dome, arch, pillar, school, mudra, or theme." },
      { label: "Site", marker: "Location", detail: "Sanchi, Ajanta, Ellora, Khajuraho, Thanjavur, Fatehpur Sikri, or regional school." },
      { label: "Period", marker: "Time", detail: "Ancient, early medieval, Sultanate, Mughal, regional, colonial, or living tradition." },
    ],
    recognition: [
      { label: "Style", value: "Nagara Dravida Vesara", proof: "The student can name two visual features." },
      { label: "School", value: "Gandhara Mathura Amaravati", proof: "The answer names material, theme, and period." },
      { label: "Patronage", value: "Ruler, guild, monastery, court", proof: "The monument is not floating without historical context." },
    ],
    trapClinic: ["Term-definition swap", "School-site mismatch", "Patronage ignored", "Feature without period"],
    prompt: "Identify one form using two features, one site, one patronage clue, and one period marker.",
  },
  "culture-current-affairs": {
    title: "Culture News To Heritage Deck",
    subtitle: "Convert current affairs into heritage type, institution, location, community, feature, and conservation.",
    rails: [
      { label: "News", marker: "Trigger", detail: "UNESCO update, GI tag, excavation, festival, museum, scheme, award, or institution." },
      { label: "Heritage type", marker: "Class", detail: "Tangible, intangible, natural-cultural, living tradition, craft, or performance." },
      { label: "Institution", marker: "Authority", detail: "ASI, UNESCO, ministry, academy, museum, state body, or local community." },
      { label: "Exam hook", marker: "Question", detail: "Location, feature, community, conservation, scheme, and PYQ-style pair matching." },
    ],
    recognition: [
      { label: "Location", value: "State or region", proof: "The news is mapped geographically." },
      { label: "Community", value: "Who preserves", proof: "Living tradition includes people, not only performance." },
      { label: "Institution", value: "Correct role", proof: "UNESCO, GI, ASI, and ministry are separated." },
    ],
    trapClinic: ["Institution-role mix-up", "News without concept", "Community ignored", "Conservation missing"],
    prompt: "Convert one culture news item into heritage type, location, institution, community, and MCQ hook.",
  },
  "history-revision-board": {
    title: "History Revision Trap Deck",
    subtitle: "Repair History through timeline, source, map, personality, culture, PYQ trap, and retest plan.",
    rails: [
      { label: "Timeline", marker: "Order", detail: "Events, reigns, acts, movements, and cultural phases." },
      { label: "Source", marker: "Proof", detail: "Text, inscription, coin, archaeology, travel account, report, or image feature." },
      { label: "Map", marker: "Place", detail: "Site, capital, port, battle, movement centre, region, or cultural zone." },
      { label: "Trap repair", marker: "Retest", detail: "Classify mistake, write repair note, schedule retest, and connect to PYQ pattern." },
    ],
    recognition: [
      { label: "Mistake type", value: "Chronology/source/map/feature", proof: "Every wrong answer is tagged." },
      { label: "Weak day", value: "Retest list", proof: "The revision board creates a next action." },
      { label: "Cross-link", value: "History plus culture", proof: "Modern, Ancient, Medieval, and Culture are not isolated." },
    ],
    trapClinic: ["Fact island revision", "Wrong answer unclassified", "Pair matching ignored", "No retest date"],
    prompt: "Classify one mistake, write the correction, and decide the retest day before moving ahead.",
  },
};

const mediaStudioDecks: Record<string, HistoryMediaStudioDeck> = {
  "modern-timeline": {
    title: "Animated 1857 Centre Map",
    subtitle: "Watch the revolt as a moving chain: pressure, trigger, centres, leaders, and Crown consequence.",
    canvasLabel: "Revolt centre map",
    motionCue: "Follow the pulse from Delhi to Kanpur, Lucknow, Jhansi, and Bihar before stating the consequence.",
    mapAnchors: [
      { label: "Delhi", region: "North", clue: "Symbolic Mughal centre and rebel legitimacy", x: 48, y: 30 },
      { label: "Kanpur", region: "Awadh belt", clue: "Leadership, local grievance, and British response", x: 45, y: 42 },
      { label: "Lucknow", region: "Awadh", clue: "Annexation grievance and prolonged resistance", x: 53, y: 42 },
      { label: "Jhansi", region: "Bundelkhand", clue: "Doctrine of Lapse, leadership, and military resistance", x: 42, y: 52 },
      { label: "Bihar", region: "East", clue: "Kunwar Singh and regional elite resistance", x: 63, y: 50 },
    ],
    timeline: [
      { marker: "Before", label: "Pressure builds", cue: "Revenue, annexation, army grievance, and social fear." },
      { marker: "Trigger", label: "Sepoy spark", cue: "Military grievance turns into wider unrest where local conditions align." },
      { marker: "Spread", label: "Centres activate", cue: "Every centre needs place, leader, cause, and social base." },
      { marker: "After", label: "Crown rule", cue: "Company rule ends and army/princely policy changes." },
    ],
    recognitionTargets: [
      { label: "Cause", cue: "Background plus immediate trigger", check: "Do not call cartridge issue the only cause." },
      { label: "Centre", cue: "Place plus leader", check: "Leader without location is incomplete." },
      { label: "Character", cue: "Regional, layered, politically significant", check: "Avoid both nationalist overreach and dismissal." },
    ],
  },
  "national-movement-board": {
    title: "Movement Phase Playback",
    subtitle: "Animate movement phases by ideology, method, social base, British response, and limitation.",
    canvasLabel: "Movement spread map",
    motionCue: "Move from Bengal Swadeshi to all-India Gandhian mass politics and compare method changes.",
    mapAnchors: [
      { label: "Bengal", region: "East", clue: "Swadeshi, boycott, national education", x: 68, y: 47 },
      { label: "Punjab", region: "Northwest", clue: "Ghadar, Jallianwala, revolutionary and peasant energy", x: 37, y: 27 },
      { label: "Gujarat", region: "West", clue: "Kheda, Ahmedabad, Bardoli, satyagraha training", x: 31, y: 56 },
      { label: "Bihar", region: "East", clue: "Champaran and peasant grievance", x: 61, y: 49 },
      { label: "Tamil region", region: "South", clue: "Home Rule and regional political mobilisation", x: 49, y: 78 },
    ],
    timeline: [
      { marker: "1885", label: "Moderate phase", cue: "Petition, prayer, protest, economic critique." },
      { marker: "1905", label: "Swadeshi phase", cue: "Boycott, national education, and wider mobilisation." },
      { marker: "1919", label: "Gandhian entry", cue: "Satyagraha, mass politics, and moral pressure." },
      { marker: "1942", label: "Quit India", cue: "Decentralised mass upsurge and final pressure." },
    ],
    recognitionTargets: [
      { label: "Ideology", cue: "Moderate, extremist, revolutionary, Gandhian", check: "Do not merge all streams." },
      { label: "Method", cue: "Petition, boycott, satyagraha, strike", check: "Method decides the phase." },
      { label: "Social base", cue: "Who joined and where", check: "Mass politics needs social group proof." },
    ],
  },
  "constitutional-development": {
    title: "Act Feature Timeline",
    subtitle: "Play constitutional development as control, councils, representation, federation, and transfer.",
    canvasLabel: "Institution timeline",
    motionCue: "Move act by act and identify which feature belongs to which constitutional stage.",
    mapAnchors: [
      { label: "Calcutta", region: "Company capital", clue: "Company control and early councils", x: 68, y: 55 },
      { label: "London", region: "Imperial control", clue: "Board of Control, Crown, Parliament", x: 18, y: 18 },
      { label: "Delhi", region: "Imperial capital", clue: "Central legislature and transfer politics", x: 48, y: 30 },
      { label: "Provinces", region: "India", clue: "Dyarchy, autonomy, federation debate", x: 45, y: 58 },
    ],
    timeline: [
      { marker: "1773", label: "Regulating control", cue: "Company becomes more supervised." },
      { marker: "1909", label: "Representation", cue: "Separate electorate enters the frame." },
      { marker: "1919", label: "Dyarchy", cue: "Provincial subjects split into reserved and transferred." },
      { marker: "1935", label: "Autonomy", cue: "Provincial autonomy and federation proposal." },
    ],
    recognitionTargets: [
      { label: "Act", cue: "Feature belongs to exact act", check: "Do not swap 1909, 1919, and 1935." },
      { label: "Control", cue: "Who held power", check: "Council expansion is not full responsibility." },
      { label: "Legacy", cue: "What entered later institutions", check: "Link feature to later constitutional development." },
    ],
  },
  "ancient-civilisation-map": {
    title: "Ancient Site Evidence Map",
    subtitle: "Use site, source, feature, trade route, polity, and inference as a live map.",
    canvasLabel: "Source-site map",
    motionCue: "Pulse from Indus urban sites to Magadha resources and south Indian trade to separate period features.",
    mapAnchors: [
      { label: "Harappa", region: "Indus", clue: "Urban planning, seals, craft and trade", x: 34, y: 26 },
      { label: "Dholavira", region: "Kutch", clue: "Water management and urban planning", x: 28, y: 52 },
      { label: "Lothal", region: "Gujarat", clue: "Trade, craft, dockyard debate", x: 30, y: 59 },
      { label: "Pataliputra", region: "Magadha", clue: "Resources, river route, imperial administration", x: 61, y: 48 },
      { label: "Sangam coast", region: "South", clue: "Trade, literature, ports, regional culture", x: 52, y: 81 },
    ],
    timeline: [
      { marker: "Indus", label: "Urban evidence", cue: "Archaeology is the main proof." },
      { marker: "Vedic", label: "Text and society", cue: "Texts need careful interpretation." },
      { marker: "Maurya", label: "Empire and dhamma", cue: "Administration plus ideology." },
      { marker: "Gupta", label: "Culture and science", cue: "Literature, art, science, and society." },
    ],
    recognitionTargets: [
      { label: "Source", cue: "Archaeology, text, coin, inscription", check: "Say what the source can prove." },
      { label: "Site", cue: "Place plus feature", check: "Do not assign every feature to every site." },
      { label: "Period", cue: "Indus, Vedic, Maurya, Gupta, Sangam", check: "Avoid period-feature mismatch." },
    ],
  },
  "ancient-thought-lab": {
    title: "Doctrine Text Spread Studio",
    subtitle: "Visualise doctrine, text, practice, patronage, route, and social impact.",
    canvasLabel: "Thought spread map",
    motionCue: "Trace doctrine from source text to institution and then to region or patronage.",
    mapAnchors: [
      { label: "Sarnath", region: "Ganga plain", clue: "Buddhist teaching and early spread", x: 56, y: 43 },
      { label: "Pataliputra", region: "Magadha", clue: "Councils, Mauryan patronage, institutions", x: 61, y: 48 },
      { label: "Shravanabelagola", region: "South", clue: "Jain tradition and regional spread", x: 43, y: 76 },
      { label: "Tamilakam", region: "South", clue: "Sangam literature and language tradition", x: 51, y: 82 },
    ],
    timeline: [
      { marker: "Doctrine", label: "Idea", cue: "Core concept and distinction." },
      { marker: "Text", label: "Source", cue: "Scripture, literature, grammar, or science text." },
      { marker: "Practice", label: "Institution", cue: "Monastery, lay support, debate, ritual, patronage." },
      { marker: "Impact", label: "Society", cue: "Art, ethics, language, and social reach." },
    ],
    recognitionTargets: [
      { label: "Doctrine", cue: "Concept plus tradition", check: "Do not mix doctrine and sect." },
      { label: "Text", cue: "Language and source", check: "Text-language mismatch is a common trap." },
      { label: "Patronage", cue: "Who supported the tradition", check: "Name king, guild, merchant, monastery, or court." },
    ],
  },
  "medieval-polity-grid": {
    title: "Medieval Power System Map",
    subtitle: "Animate dynasty, administration, revenue, nobility, region, and transition.",
    canvasLabel: "Dynasty system map",
    motionCue: "Move from Delhi to Deccan, Bengal, Rajputana, and the Maratha zone while separating institutions.",
    mapAnchors: [
      { label: "Delhi", region: "North", clue: "Sultanate and Mughal central power", x: 48, y: 30 },
      { label: "Deccan", region: "Central-south", clue: "Bahmani, Deccan states, and Mughal pressure", x: 45, y: 64 },
      { label: "Vijayanagara", region: "South", clue: "Regional power, architecture, economy", x: 47, y: 74 },
      { label: "Bengal", region: "East", clue: "Regional state and trade economy", x: 68, y: 49 },
      { label: "Maratha zone", region: "West-Deccan", clue: "Shivaji, Peshwas, forts, chauth", x: 36, y: 63 },
    ],
    timeline: [
      { marker: "Sultanate", label: "Iqta and expansion", cue: "Military-fiscal assignments and nobility." },
      { marker: "Regional", label: "Deccan and south", cue: "Regional systems and culture." },
      { marker: "Mughal", label: "Mansab and jagir", cue: "Rank, revenue assignment, and central control." },
      { marker: "18th c.", label: "Transition", cue: "Fiscal strain and regionalisation." },
    ],
    recognitionTargets: [
      { label: "Institution", cue: "Iqta, mansab, jagir, zabt", check: "Do not collapse institutions." },
      { label: "Region", cue: "Delhi, Deccan, Bengal, South", check: "Place the institution geographically." },
      { label: "Transition", cue: "Layered decline", check: "Avoid one-cause collapse." },
    ],
  },
  "bhakti-sufi-culture": {
    title: "Saint Silsila Cultural Map",
    subtitle: "Map teacher, region, language, institution, practice, and social reach.",
    canvasLabel: "Devotional culture map",
    motionCue: "Pulse from teacher to language and institution before stating social impact.",
    mapAnchors: [
      { label: "Tamil region", region: "South", clue: "Alvar and Nayanar devotional roots", x: 50, y: 82 },
      { label: "Kashi", region: "North", clue: "Kabir and nirguna vocabulary", x: 55, y: 42 },
      { label: "Punjab", region: "Northwest", clue: "Guru Nanak and Sikh tradition", x: 38, y: 27 },
      { label: "Ajmer", region: "Rajasthan", clue: "Chishti Sufi tradition and social reach", x: 37, y: 42 },
      { label: "Maharashtra", region: "West", clue: "Varkari saints and vernacular devotion", x: 38, y: 64 },
    ],
    timeline: [
      { marker: "Teacher", label: "Saint or pir", cue: "Name person and tradition." },
      { marker: "Language", label: "Vernacular reach", cue: "Language explains social spread." },
      { marker: "Practice", label: "Institution", cue: "Khanqah, satsang, poetry, music, pilgrimage." },
      { marker: "Society", label: "Impact", cue: "Critique, synthesis, identity, community." },
    ],
    recognitionTargets: [
      { label: "Saint-region", cue: "Person plus place", check: "Never detach teacher from region." },
      { label: "Language", cue: "Tamil, Hindi, Marathi, Punjabi, Persian", check: "Language is a social reach clue." },
      { label: "Practice", cue: "Order, sect, institution", check: "Silsila and saint are not the same category." },
    ],
  },
  "art-architecture-lab": {
    title: "Monument Recognition Canvas",
    subtitle: "Recognise architecture and art through form, feature, site, patronage, school, and period.",
    canvasLabel: "Feature recognition canvas",
    motionCue: "Scan form first, then feature, site, patronage, and period before naming the style.",
    mapAnchors: [
      { label: "Sanchi", region: "Central India", clue: "Stupa, railing, torana, Buddhist patronage", x: 45, y: 56 },
      { label: "Ajanta", region: "Deccan", clue: "Cave murals, chaitya-vihara, painting tradition", x: 39, y: 65 },
      { label: "Ellora", region: "Deccan", clue: "Rock-cut, multi-religious, Kailasa temple", x: 40, y: 63 },
      { label: "Khajuraho", region: "Central India", clue: "Nagara temple, sculpture programme", x: 46, y: 49 },
      { label: "Thanjavur", region: "Tamil region", clue: "Dravida vimana, Chola patronage", x: 51, y: 82 },
    ],
    timeline: [
      { marker: "Form", label: "Object type", cue: "Stupa, cave, temple, mosque, tomb, fort, painting." },
      { marker: "Feature", label: "Visible cue", cue: "Shikhara, vimana, gopuram, arch, dome, pillar, mudra." },
      { marker: "Site", label: "Location", cue: "Site and region lock the answer." },
      { marker: "Period", label: "Style phase", cue: "Ancient, early medieval, Sultanate, Mughal, regional." },
    ],
    recognitionTargets: [
      { label: "Nagara silhouette cue", cue: "Curvilinear shikhara and mandapa axis", check: "Do not call it Dravida if gopuram/vimana clues are missing." },
      { label: "Dravida silhouette cue", cue: "Vimana, enclosure, gopuram, axial plan", check: "Separate vimana from shikhara." },
      { label: "Stupa cue", cue: "Anda, harmika, chhatra, vedika, torana", check: "Recognise Buddhist architectural vocabulary." },
    ],
  },
  "culture-current-affairs": {
    title: "Heritage News Media Board",
    subtitle: "Convert culture current affairs into location, institution, community, feature, and conservation cue.",
    canvasLabel: "Heritage news map",
    motionCue: "Move from news trigger to heritage type, institution, location, community, and exam hook.",
    mapAnchors: [
      { label: "UNESCO site", region: "India", clue: "Tangible or intangible heritage classification", x: 47, y: 48 },
      { label: "GI cluster", region: "State", clue: "Product, community, geography, legal protection", x: 35, y: 58 },
      { label: "Excavation", region: "Site", clue: "ASI, source inference, chronology", x: 55, y: 45 },
      { label: "Festival", region: "Community", clue: "Living tradition, transmission, identity", x: 50, y: 70 },
    ],
    timeline: [
      { marker: "News", label: "Trigger", cue: "Award, tag, site, scheme, excavation, festival." },
      { marker: "Class", label: "Heritage type", cue: "Tangible, intangible, craft, performance, living tradition." },
      { marker: "Authority", label: "Institution", cue: "UNESCO, GI, ASI, ministry, academy, community." },
      { marker: "Hook", label: "Exam use", cue: "Pair matching, location, feature, conservation." },
    ],
    recognitionTargets: [
      { label: "Institution role", cue: "UNESCO, GI, ASI, ministry", check: "Do not mix authority and protection roles." },
      { label: "Community", cue: "Who carries the tradition", check: "Living tradition needs people." },
      { label: "Conservation", cue: "Threat and response", check: "Heritage is not only a static fact." },
    ],
  },
  "history-revision-board": {
    title: "Mixed History Media Retest Board",
    subtitle: "Use timeline, source, map, personality, culture, and PYQ trap as a final visual retest.",
    canvasLabel: "Final recall canvas",
    motionCue: "Classify every mistake into timeline, source, map, personality, culture, or feature.",
    mapAnchors: [
      { label: "Modern centre", region: "Timeline", clue: "Event, leader, cause, consequence", x: 48, y: 34 },
      { label: "Ancient site", region: "Source", clue: "Site, feature, inference", x: 58, y: 50 },
      { label: "Medieval system", region: "Institution", clue: "Dynasty, revenue, region", x: 42, y: 60 },
      { label: "Culture site", region: "Recognition", clue: "Style, feature, patronage, period", x: 50, y: 76 },
    ],
    timeline: [
      { marker: "Tag", label: "Mistake type", cue: "Chronology, source, map, personality, feature." },
      { marker: "Repair", label: "Evidence anchor", cue: "One source, place, monument, leader, or act." },
      { marker: "Retest", label: "Fresh question", cue: "One MCQ trap or oral explanation." },
      { marker: "Lock", label: "Command memory", cue: "Move weak day to command-ready only after retest." },
    ],
    recognitionTargets: [
      { label: "Timeline", cue: "Order and consequence", check: "Date without cause is weak." },
      { label: "Source", cue: "What proves the claim", check: "Do not overread evidence." },
      { label: "Culture", cue: "Feature, site, style, period", check: "Recognition must include proof." },
    ],
  },
};

const revisionBlockMeta = [
  {
    id: "modern",
    title: "Modern History",
    from: 1,
    to: 15,
    focus: "Company rule, reform, revolt, national movement, constitutional development, independence.",
    trapFocus: "Chronology, leader-centre pairing, cause versus trigger, act-feature matching.",
  },
  {
    id: "ancient",
    title: "Ancient History",
    from: 16,
    to: 30,
    focus: "Sources, sites, polity, economy, religion, philosophy, literature, science, art.",
    trapFocus: "Source-inference, site-feature, period-feature, text-language, patronage traps.",
  },
  {
    id: "medieval",
    title: "Medieval History",
    from: 31,
    to: 45,
    focus: "Sultanate, regional powers, Bhakti-Sufi, Mughals, economy, society, transition.",
    trapFocus: "Institution-dynasty, revenue-administration, region, saint-language, decline traps.",
  },
  {
    id: "art-culture",
    title: "Art and Culture",
    from: 46,
    to: 60,
    focus: "Architecture, sculpture, painting, music, dance, literature, heritage, current affairs.",
    trapFocus: "Style-feature-site, school-patronage, UNESCO-GI-institution, community-conservation traps.",
  },
];

function getStageGapLabel(day: SubjectDayReadiness) {
  if (day.revisitNeeded) return "Revisit";
  if (!day.watchComplete) return "Watch";
  if (!day.talkMcqReady) return "Talk";
  if (!day.labComplete) return "Lab";
  if (!day.batchReady) return "Fresh MCQ";
  if (!day.mcqPracticeCommand) return "MCQ Retest";
  return "Command";
}

function summarizeStageGaps(days: SubjectDayReadiness[]) {
  const gapMap = new Map<string, number>();

  days.forEach((day) => {
    if (day.isCommandReady) return;
    const label = getStageGapLabel(day);
    gapMap.set(label, (gapMap.get(label) ?? 0) + 1);
  });

  return Array.from(gapMap.entries()).map(([label, count]) => ({ label, count }));
}

export function buildHistoryRevisionCommandDeck(days: SubjectDayReadiness[]): HistoryRevisionCommandDeck {
  const totalDays = days.length || 1;
  const commandCount = days.filter((day) => day.isCommandReady).length;
  const score = Math.round(days.reduce((sum, day) => sum + day.score, 0) / totalDays);
  const retestQueue = days
    .filter((day) => !day.isCommandReady)
    .sort((a, b) => {
      const aGap = getStageGapLabel(a);
      const bGap = getStageGapLabel(b);
      const gapPriority = ["Revisit", "Watch", "Talk", "Lab", "Fresh MCQ", "MCQ Retest", "Command"];
      return gapPriority.indexOf(aGap) - gapPriority.indexOf(bGap) || a.score - b.score || a.session.day - b.session.day;
    })
    .slice(0, 8);

  const blocks = revisionBlockMeta.map((meta) => {
    const blockDays = days.filter((day) => day.session.day >= meta.from && day.session.day <= meta.to);
    const blockTotal = blockDays.length || 1;
    const weakDays = blockDays
      .filter((day) => !day.isCommandReady)
      .sort((a, b) => a.score - b.score || a.session.day - b.session.day)
      .slice(0, 5);

    return {
      id: meta.id,
      title: meta.title,
      dayRange: `Days ${meta.from}-${meta.to}`,
      focus: meta.focus,
      trapFocus: meta.trapFocus,
      commandCount: blockDays.filter((day) => day.isCommandReady).length,
      totalDays: blockDays.length,
      averageScore: Math.round(blockDays.reduce((sum, day) => sum + day.score, 0) / blockTotal),
      nextAction: weakDays[0],
      weakDays,
      stageGaps: summarizeStageGaps(blockDays),
    };
  });

  return {
    score,
    commandCount,
    totalDays: days.length,
    retestQueue,
    blocks,
    protocol: [
      "Classify the mistake: chronology, source, map, personality, institution, feature, or interpretation.",
      "Write a two-line repair note with one evidence anchor and one UPSC trap.",
      "Return to Talk if oral score is below command level; return to Lab if proof is missing.",
      "Retest only with fresh MCQs after Watch, Talk, Lab, and repair gates are clear.",
    ],
  };
}

function fallbackPack(session: SubjectSession): HistoryLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through chronology, source, map, personality, institution, culture, consequence, and UPSC trap.`,
    caseAnchors: [session.chapter, session.lab, "Source or map anchor", "PYQ-style trap"],
    causeChain: ["Chronology", "Source", "Actor", "Institution", "Region", "Consequence", "Trap"],
    oralChecklist: ["Set chronology", "Add source or map", "Name actor/institution", "State consequence and trap"],
    trapBank: [`Moving to MCQs without chronology, source, map, personality, and consequence for ${session.title}.`],
    keywords: [session.title, session.chapter, session.lab, "history", "source", "timeline", "map", "culture", "pyq"]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
    mcqAngles: ["chronology trap", "source-map pairing", "feature-period mismatch"],
  };
}

export function getHistoryLearningPack(session: SubjectSession): HistoryLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildHistoryWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getHistoryLearningPack(session);

  return [
    {
      id: `${session.day}-history-frame`,
      kind: "briefing",
      title: "History frame",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can place ${session.title} inside a History frame before memorising facts.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-history-causation-chain`,
      kind: "mechanism",
      title: "Source-to-causation chain",
      objective: "Build chronology, source, actor, region, institution, and consequence in order.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Apply every link to ${session.title}.`,
      checkpoint: "Student can speak the topic through chronology and evidence instead of isolated facts.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-history-evidence-anchor`,
      kind: "application",
      title: "Evidence anchor",
      objective: "Attach the day to a source, map, site, personality, institution, movement, or cultural feature.",
      narration: `Choose one anchor: ${pack.caseAnchors.join(", ")}. The anchor must prove the historical explanation.`,
      checkpoint: "Student can attach one concrete evidence anchor to the answer.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-history-trap`,
      kind: "trap",
      title: "UPSC history trap",
      objective: "Predict chronology, pairing, source, region, feature, and interpretation traps.",
      narration: `Common trap: ${pack.trapBank[0] ?? "History fact without chronology and source proof."}`,
      checkpoint: "Student can create one almost-correct History statement and identify the hidden error.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-history-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral explanation.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the day through chronology, evidence, and UPSC trap logic.",
      durationMinutes: 2,
    },
  ];
}

export function getHistoryLabDeck(labSlug: string, session: SubjectSession): HistoryLabDeckCard[] {
  const deck = labDecks[labSlug];
  const fallback = [
    {
      title: `${session.title} History Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail:
        "Attach chronology, source or map, actor, institution, culture link, consequence, and one UPSC trap.",
      examTrap: "Avoid moving to MCQs without source, chronology, map or personality, and consequence.",
      proofHint: "Convert the topic into chronology, source/map, actor, consequence, and trap.",
    },
  ];

  return (deck ?? fallback).map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug || "history"}-${index + 1}`,
  }));
}

export function getHistoryVisualCommandDeck(labSlug: string, session: SubjectSession): HistoryVisualCommandDeck {
  const deck = visualCommandDecks[labSlug];
  if (deck) return deck;

  const pack = getHistoryLearningPack(session);
  return {
    title: `${session.title} Visual Command Deck`,
    subtitle: "Convert the day into timeline, source, map, personality, culture, consequence, and trap.",
    rails: pack.causeChain.slice(0, 4).map((item, index) => ({
      label: item,
      marker: `Step ${index + 1}`,
      detail: `Apply ${item.toLowerCase()} directly to ${session.title}.`,
    })),
    recognition: [
      { label: "Evidence", value: pack.caseAnchors[0] ?? session.lab, proof: "The answer has a concrete source, site, map, or case." },
      { label: "Trap", value: pack.mcqAngles[0] ?? "History trap", proof: "The student can explain why one tempting statement is wrong." },
      { label: "Repair", value: session.revisit, proof: "The day has a measurable recovery action." },
    ],
    trapClinic: pack.trapBank.slice(0, 4),
    prompt: `Speak ${session.title} through chronology, evidence, consequence, and one UPSC trap.`,
  };
}

export function getHistoryMediaStudioDeck(labSlug: string, session: SubjectSession): HistoryMediaStudioDeck {
  const deck = mediaStudioDecks[labSlug];
  if (deck) return deck;

  const visualDeck = getHistoryVisualCommandDeck(labSlug, session);
  return {
    title: `${session.title} Media Studio`,
    subtitle: "Animate the topic through place, time, evidence, recognition, and trap repair.",
    canvasLabel: session.lab,
    motionCue: visualDeck.prompt,
    mapAnchors: visualDeck.rails.slice(0, 4).map((rail, index) => ({
      label: rail.label,
      region: rail.marker,
      clue: rail.detail,
      x: [34, 48, 62, 50][index] ?? 50,
      y: [32, 48, 58, 76][index] ?? 50,
    })),
    timeline: visualDeck.rails.slice(0, 4).map((rail) => ({
      marker: rail.marker,
      label: rail.label,
      cue: rail.detail,
    })),
    recognitionTargets: visualDeck.recognition.map((item) => ({
      label: item.label,
      cue: item.value,
      check: item.proof,
    })),
  };
}

export function getHistoryLectureMediaDeck(session: SubjectSession): HistoryLectureMediaDeck {
  const mediaDeck = getHistoryMediaStudioDeck(
    {
      "Modern History": "modern-timeline",
      "Ancient History": session.lab === "Art Architecture Lab" ? "art-architecture-lab" : "ancient-civilisation-map",
      "Medieval History": session.lab === "Bhakti Sufi Culture" ? "bhakti-sufi-culture" : "medieval-polity-grid",
      "Art and Culture": session.lab === "Culture Current Affairs" ? "culture-current-affairs" : "art-architecture-lab",
      "Integrated Revision": "history-revision-board",
    }[session.chapter] ?? "history-revision-board",
    session
  );
  const pack = getHistoryLearningPack(session);

  return {
    title: `${session.title} Lecture Media Queue`,
    subtitle: "Local lecture, map/image, transcript, and animation slots for the History watch flow.",
    assetStatus: "Local asset-ready workflow",
    durationLabel: session.duration,
    primarySlot: {
      label: mediaDeck.title,
      kind: mediaDeck.canvasLabel,
      placeholder: "Attach real lecture video or keep the generated demo scene for local testing.",
      cue: mediaDeck.motionCue,
    },
    segments: mediaDeck.timeline.map((item, index) => ({
      timestamp: `${String(index * 3).padStart(2, "0")}:00`,
      title: item.label,
      visual: item.marker,
      teacherCue: item.cue,
      studentAction: pack.oralChecklist[index % pack.oralChecklist.length] ?? "Explain the History trap in your own words.",
    })),
    assetSlots: [
      {
        id: "lecture-video",
        label: "Lecture video",
        kind: "MP4/WebM",
        requirement: `Full class recording or compressed ${session.title} revision video.`,
        use: "Watch room primary lesson and auto handoff to Talk.",
      },
      {
        id: "visual-map",
        label: "Map or monument visual",
        kind: "PNG/JPG/WebP",
        requirement: mediaDeck.mapAnchors.map((anchor) => anchor.label).slice(0, 4).join(", "),
        use: "Visual Lab, recap, and MCQ explanation anchor.",
      },
      {
        id: "transcript",
        label: "Transcript and teacher script",
        kind: "Markdown/Text",
        requirement: pack.causeChain.join(" -> "),
        use: "AI teacher prompt, compressed recap, and revisit repair.",
      },
      {
        id: "animation-brief",
        label: "Animation brief",
        kind: "Remotion-ready brief",
        requirement: mediaDeck.motionCue,
        use: "Future 3D/Remotion lesson production.",
      },
    ],
    transcriptPrompts: [
      `Open with: ${pack.lens}.`,
      `Explain the chain: ${pack.causeChain.join(" -> ")}.`,
      `Use one anchor: ${pack.caseAnchors[0] ?? session.lab}.`,
      `End with trap: ${pack.trapBank[0] ?? "Avoid a chronology or source trap."}`,
    ],
  };
}

export function getHistoryMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const pack = getHistoryLearningPack(session);
  return {
    trapSeed: pack.trapBank[0] ?? `confusing chronology, source, map, personality, and consequence inside ${session.title}`,
    explanationSeed: `Use ${pack.causeChain.join(" -> ")} and name the source, map/site, personality, institution, or feature that proves the answer.`,
    caseTag: pack.caseAnchors[0] ?? session.lab,
    source: "FRESH_HISTORY_AUTHORING",
    questionSeed: `Consider the following statements about ${session.title}: build a fresh UPSC History trap around ${pack.mcqAngles[0] ?? pack.trapBank[0]}.`,
    planTitle: plan.title,
  };
}
