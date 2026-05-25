import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";

export type EconomyLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
  mcqAngles: string[];
};

export type EconomyLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

const packByLab: Record<string, EconomyLearningPack> = {
  "Macro Flow Board": {
    lens: "Macro circular flow",
    teacherFocus: "Teach every economy topic as a flow between households, firms, government, banks, external sector, and indicators.",
    caseAnchors: ["Household-firm income loop", "Savings-investment channel", "Government tax-spend loop", "External sector leakage"],
    causeChain: ["Agent", "Flow", "Indicator", "Policy lever", "Distribution impact", "UPSC trap"],
    oralChecklist: ["Name the agent", "Trace the flow", "Read the indicator", "Explain one policy effect"],
    trapBank: [
      "Treating GDP, income, welfare, and development as identical.",
      "Ignoring leakages such as savings, taxes, imports, and debt service.",
      "Reading an indicator without naming what it excludes.",
    ],
    keywords: ["household", "firm", "government", "flow", "income", "output", "savings", "investment", "indicator", "gdp"],
    mcqAngles: ["nominal-real distinction", "domestic-national distinction", "income-output-expenditure identity"],
  },
  "Inflation Dashboard": {
    lens: "Inflation cause-index-policy dashboard",
    teacherFocus: "Force inflation answers through cause, index, affected group, policy lever, lag, and welfare impact.",
    caseAnchors: ["Food inflation shock", "Imported crude price pressure", "Core inflation persistence", "Repo-rate transmission"],
    causeChain: ["Demand or supply shock", "Price index", "Real income effect", "Policy response", "Transmission lag", "Welfare trade-off"],
    oralChecklist: ["Identify the shock", "Name CPI/WPI/core", "Explain impact on real income", "Choose RBI or fiscal response"],
    trapBank: [
      "Assuming CPI and WPI measure the same basket.",
      "Calling every price rise demand-pull inflation.",
      "Assuming repo changes instantly reduce retail inflation.",
    ],
    keywords: ["inflation", "cpi", "wpi", "repo", "demand", "supply", "core", "real", "wages", "transmission"],
    mcqAngles: ["CPI-WPI basket trap", "demand-pull versus cost-push", "repo-rate transmission lag"],
  },
  "Banking Credit Grid": {
    lens: "Credit creation and risk grid",
    teacherFocus: "Read banking through deposits, credit, risk, capital, regulation, and monetary transmission.",
    caseAnchors: ["Deposit-to-credit loop", "NPA provisioning", "Priority sector lending", "Basel capital adequacy"],
    causeChain: ["Deposit", "Credit", "Borrower risk", "NPA or repayment", "Capital buffer", "Credit growth"],
    oralChecklist: ["Name the liability", "Name the asset", "Explain risk control", "Connect to growth or stability"],
    trapBank: [
      "Mixing CRR, SLR, repo, and bank rate as identical liquidity tools.",
      "Treating NBFCs and banks as the same regulatory category.",
      "Ignoring capital adequacy while discussing credit expansion.",
    ],
    keywords: ["bank", "deposit", "credit", "npa", "capital", "liquidity", "repo", "crr", "slr", "transmission"],
    mcqAngles: ["CRR-SLR-repo direction", "NPA provisioning logic", "bank versus NBFC distinction"],
  },
  "Budget Tax Lab": {
    lens: "Fiscal flow and tax incidence lab",
    teacherFocus: "Connect budget numbers with receipts, expenditure, deficit, debt, GST chain, federalism, and macro impact.",
    caseAnchors: ["Fiscal deficit financing", "Revenue versus capital expenditure", "GST input tax credit", "Subsidy targeting"],
    causeChain: ["Receipt", "Expenditure", "Deficit", "Borrowing", "Interest burden", "Growth or welfare outcome"],
    oralChecklist: ["Classify receipt/expenditure", "Name the deficit", "Explain funding", "Add one outcome or trade-off"],
    trapBank: [
      "Mixing fiscal deficit, revenue deficit, and primary deficit.",
      "Treating cess, surcharge, and GST compensation as the same federal flow.",
      "Calling all capital expenditure automatically productive without context.",
    ],
    keywords: ["budget", "revenue", "capital", "deficit", "tax", "gst", "frbm", "borrowing", "subsidy", "expenditure"],
    mcqAngles: ["deficit comparison", "GST input tax credit", "cess versus surcharge"],
  },
  "External Sector Map": {
    lens: "Balance of payments and currency map",
    teacherFocus: "Make external-sector answers move through trade, invisibles, capital flows, currency, reserves, and global shocks.",
    caseAnchors: ["Rupee depreciation chain", "Oil import shock", "Remittance cushion", "FPI outflow pressure"],
    causeChain: ["Trade or capital shock", "BoP account", "Currency movement", "Inflation or debt effect", "Reserve response", "Policy trade-off"],
    oralChecklist: ["Separate current and capital account", "Explain currency direction", "Add reserve or inflation impact", "Name one policy response"],
    trapBank: [
      "Confusing depreciation with appreciation.",
      "Putting remittances, FDI, FPI, and external borrowing in the wrong BoP account.",
      "Assuming forex reserves are only export earnings.",
    ],
    keywords: ["current", "capital", "forex", "exchange", "depreciation", "appreciation", "reserves", "trade", "fdi", "fpi"],
    mcqAngles: ["current-account versus capital-account", "rupee depreciation effect", "forex reserve composition"],
  },
  "Growth Inclusion Lab": {
    lens: "Growth-to-welfare bridge",
    teacherFocus: "Connect growth with jobs, productivity, poverty, inequality, welfare delivery, sectoral change, and human development.",
    caseAnchors: ["GDP versus HDI contrast", "MSP-procurement-PDS chain", "MGNREGA wage support", "Digital payments inclusion"],
    causeChain: ["Growth driver", "Employment or productivity", "Income distribution", "Welfare delivery", "Human development", "Fiscal cost"],
    oralChecklist: ["Name the growth driver", "Attach employment or welfare effect", "Add one indicator", "Explain the trade-off"],
    trapBank: [
      "Assuming high GDP growth automatically means inclusive development.",
      "Mixing unemployment rate, LFPR, and workforce participation.",
      "Treating welfare delivery as only expenditure, not targeting and outcome.",
    ],
    keywords: ["growth", "development", "poverty", "employment", "inequality", "welfare", "mgnrega", "dbt", "hdi", "lfpr"],
    mcqAngles: ["GDP versus HDI", "LFPR-unemployment distinction", "DBT targeting logic"],
  },
  "Policy Reform Board": {
    lens: "State-market reform board",
    teacherFocus: "Read reforms through problem, instrument, institution, incentive, distribution effect, and current-affairs hook.",
    caseAnchors: ["1991 liberalization", "NITI Aayog cooperative federalism", "PLI incentive design", "Economic Survey reform theme"],
    causeChain: ["Problem", "Reform instrument", "Institution", "Market incentive", "Implementation gap", "Outcome"],
    oralChecklist: ["Name the old constraint", "Name the reform tool", "Explain institutional role", "Add one beneficiary or risk"],
    trapBank: [
      "Treating liberalization, privatization, and globalization as interchangeable.",
      "Assuming reforms remove the state instead of changing its role.",
      "Memorizing scheme names without instrument and outcome.",
    ],
    keywords: ["reform", "liberalization", "privatization", "globalization", "niti", "federalism", "survey", "budget", "scheme", "incentive"],
    mcqAngles: ["LPG distinction", "state-market role", "scheme instrument versus objective"],
  },
};

const labDecks: Record<string, Omit<EconomyLabDeckCard, "id">[]> = {
  "macro-flow-board": [
    {
      title: "Household-Firm Loop",
      category: "Circular Flow",
      anchor: "Income, consumption, wages, output",
      detail: "Trace how household labour becomes firm output, wages become consumption, and consumption becomes firm revenue.",
      examTrap: "GDP is not welfare by itself; unpaid work, inequality, and environmental costs can be outside the number.",
      proofHint: "Use one line connecting income, output, consumption, and one leakage.",
    },
    {
      title: "GDP Measurement Ladder",
      category: "National Income",
      anchor: "Domestic-national and nominal-real distinction",
      detail: "Read GDP, GNP, NNP, depreciation, inflation adjustment, factor cost, and market price as a conversion ladder.",
      examTrap: "Domestic and national are not the same; nominal and real are not the same.",
      proofHint: "Build one conversion from GDP at market price to a cleaner welfare reading.",
    },
  ],
  "inflation-dashboard": [
    {
      title: "Food Inflation Shock",
      category: "Prices",
      anchor: "Supply disruption to CPI pressure",
      detail: "Connect harvest shock, logistics, food weight in CPI, real wage pressure, and policy response.",
      examTrap: "A repo hike cannot directly produce vegetables or repair a supply chain.",
      proofHint: "Separate monetary response from supply-side response.",
    },
    {
      title: "Imported Inflation Chain",
      category: "External Shock",
      anchor: "Oil price, rupee, logistics, WPI/CPI pass-through",
      detail: "Trace crude prices and currency movement into transport cost, firm margins, CPI, and inflation expectations.",
      examTrap: "Imported inflation is not purely domestic demand pressure.",
      proofHint: "Use oil import dependence to connect external sector and inflation.",
    },
  ],
  "banking-credit-grid": [
    {
      title: "Repo To Loan Rate",
      category: "Transmission",
      anchor: "Policy rate to bank funding cost",
      detail: "Trace repo rate, liquidity, deposit rates, lending rates, borrower demand, and investment response.",
      examTrap: "Transmission depends on liquidity, bank balance sheets, and borrower risk; it is not automatic.",
      proofHint: "Name two frictions between RBI action and final credit demand.",
    },
    {
      title: "NPA Balance Sheet Stress",
      category: "Risk",
      anchor: "Default, provisioning, capital, lending ability",
      detail: "Connect bad loans with provisioning, profitability, capital adequacy, credit slowdown, and resolution.",
      examTrap: "NPA is not merely non-payment; it affects future credit creation.",
      proofHint: "Explain why cleaning bank balance sheets can support growth.",
    },
  ],
  "budget-tax-lab": [
    {
      title: "Deficit Comparison",
      category: "Public Finance",
      anchor: "Fiscal, revenue, primary deficit",
      detail: "Compare what each deficit reveals about borrowing, current spending, interest burden, and fiscal quality.",
      examTrap: "A lower primary deficit can still coexist with high interest burden.",
      proofHint: "Write one line separating fiscal deficit from revenue deficit.",
    },
    {
      title: "GST Input Credit Chain",
      category: "Tax",
      anchor: "Value addition, tax credit, compliance, federalism",
      detail: "Follow a supply chain to see how input tax credit reduces cascading and creates invoice matching incentives.",
      examTrap: "GST is not just a tax rate; credit chain and Council federalism matter.",
      proofHint: "Use a manufacturer-to-retailer example.",
    },
  ],
  "external-sector-map": [
    {
      title: "Rupee Depreciation Chain",
      category: "Currency",
      anchor: "Imports, exports, inflation, debt",
      detail: "Connect rupee movement with oil import bill, export competitiveness, imported inflation, and external debt servicing.",
      examTrap: "Depreciation can help exporters but raise import and inflation pressure.",
      proofHint: "Give one gain and one cost of depreciation.",
    },
    {
      title: "BoP Account Sorting",
      category: "Balance of Payments",
      anchor: "Current account versus capital account",
      detail: "Place goods, services, remittances, FDI, FPI, ECB, and reserves in the correct external-sector map.",
      examTrap: "Remittances are current-account invisibles, not capital inflow like FDI.",
      proofHint: "Sort four items into current and capital account.",
    },
  ],
  "growth-inclusion-lab": [
    {
      title: "GDP-HDI-Poverty Triangle",
      category: "Inclusion",
      anchor: "Growth, welfare, distribution",
      detail: "Compare output growth with health, education, poverty, employment, and regional inequality.",
      examTrap: "Growth can rise while employment quality or distribution remains weak.",
      proofHint: "Use one indicator beyond GDP.",
    },
    {
      title: "Welfare Delivery Chain",
      category: "Schemes",
      anchor: "Budget, targeting, delivery, outcome",
      detail: "Trace welfare from allocation to identification, transfer, leakage control, beneficiary outcome, and fiscal cost.",
      examTrap: "A scheme name is not enough; target group, instrument, and outcome decide exam value.",
      proofHint: "Explain DBT or MGNREGA as delivery design.",
    },
  ],
  "policy-reform-board": [
    {
      title: "1991 Reform Logic",
      category: "Reforms",
      anchor: "Crisis, liberalization, privatization, globalization",
      detail: "Read reforms as a response to macro crisis, licensing constraints, external stress, and productivity needs.",
      examTrap: "Reforms changed the role of the state; they did not remove economic governance.",
      proofHint: "Separate liberalization, privatization, and globalization in one answer.",
    },
    {
      title: "Current Affairs To Static Hook",
      category: "Integration",
      anchor: "Budget, Survey, RBI, scheme, global shock",
      detail: "Turn a current event into concept, indicator, institution, scheme, affected group, and MCQ trap.",
      examTrap: "Data without concept and institution is weak revision material.",
      proofHint: "Convert one budget item into a static Economy question.",
    },
  ],
};

function fallbackPack(session: SubjectSession): EconomyLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through economic agent, flow, indicator, policy lever, and distribution impact.`,
    caseAnchors: [session.chapter, session.lab, "India policy example", "Current economy hook"],
    causeChain: ["Concept", "Flow", "Indicator", "Policy", "Impact", "Trap"],
    oralChecklist: ["Define the concept", "Trace one flow", "Name one indicator", "Predict one trap"],
    trapBank: ["Moving to MCQs without showing the economic relationship."],
    keywords: [session.title, session.chapter, session.lab, "economy", "policy", "indicator", "impact"]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
    mcqAngles: ["concept-mechanism distinction", "indicator limitation", "policy trade-off"],
  };
}

export function getEconomyLearningPack(session: SubjectSession): EconomyLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildEconomyWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getEconomyLearningPack(session);

  return [
    {
      id: `${session.day}-economy-briefing`,
      kind: "briefing",
      title: "Economy frame",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can state which economic agent, flow, and indicator are active inside ${session.title}.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-economy-chain`,
      kind: "mechanism",
      title: "Economic chain",
      objective: "Build the relationship before memorizing definitions.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Explain each link through ${session.title}.`,
      checkpoint: "Student can speak the mechanism with agent, flow, indicator, policy, and impact.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-economy-case`,
      kind: "application",
      title: "Policy or indicator anchor",
      objective: "Attach the idea to a policy, indicator, institution, or current economy case.",
      narration: `Choose one anchor: ${pack.caseAnchors.join(", ")}. The example must prove the economic relationship.`,
      checkpoint: "Student can connect the case to policy design, distribution, or macro stability.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-economy-trap`,
      kind: "trap",
      title: "UPSC economy trap",
      objective: "Predict statement and indicator traps before practice.",
      narration: `Common trap: ${pack.trapBank[0] ?? "Confusing an indicator with the full reality."}`,
      checkpoint: "Student can create one almost-correct statement and identify the missing qualifier.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-economy-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral answer.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the topic through relationship, policy, indicator, and trap.",
      durationMinutes: 2,
    },
  ];
}

export function getEconomyLabDeck(labSlug: string, session: SubjectSession): EconomyLabDeckCard[] {
  const deck = labDecks[labSlug];
  const fallback = [
    {
      title: `${session.title} Case Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail: "Attach one economic agent, indicator, institution, policy lever, distribution effect, and current-affairs hook.",
      examTrap: "Avoid moving to MCQs without one economic mechanism and one indicator limitation.",
      proofHint: "Convert the topic into concept, flow, data point, policy response, and MCQ trap.",
    },
  ];

  return (deck ?? fallback).map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug || "economy"}-${index + 1}`,
  }));
}

export function getEconomyMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const pack = getEconomyLearningPack(session);
  return {
    trapSeed: pack.trapBank[0] ?? `confusing ${session.title} with a related economy concept`,
    explanationSeed: `Use ${pack.causeChain.join(" -> ")} and name the policy or indicator limitation.`,
    caseTag: pack.caseAnchors[0] ?? session.lab,
    source: "FRESH_ECONOMY_AUTHORING",
    questionSeed: `Consider the following statements about ${session.title}: build a fresh UPSC trap around ${pack.mcqAngles[0] ?? pack.trapBank[0]}.`,
    planTitle: plan.title,
  };
}
