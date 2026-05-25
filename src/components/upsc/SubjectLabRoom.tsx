"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Layers3,
  MapPinned,
  Network,
  Radar,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import { getDisasterManagementLabDeck } from "@/lib/upsc/disasterManagementLearningDecks";
import { getEconomyLabDeck } from "@/lib/upsc/economyLearningDecks";
import { getEnvironmentLabDeck } from "@/lib/upsc/environmentLabDecks";
import { getHistoryLabDeck, getHistoryMediaStudioDeck, getHistoryVisualCommandDeck } from "@/lib/upsc/historyLearningDecks";
import { getInternalSecuritySocietyLabDeck } from "@/lib/upsc/internalSecuritySocietyLearningDecks";
import { getPolityGovernanceLabDeck } from "@/lib/upsc/polityGovernanceLearningDecks";
import { getScienceTechLabDeck } from "@/lib/upsc/scienceTechLearningDecks";
import type { SubjectLab, SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { isSubjectTalkReadyForMcq } from "@/lib/upsc/subjectProgressGates";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { useSubjectProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type LabNode = {
  label: string;
  detail: string;
};

type LabScene = {
  lens: string;
  anchor: string;
  boardTitle: string;
  boardDetail: string;
  nodes: LabNode[];
  drill: string[];
};

type LabProofStage = {
  id: string;
  title: string;
  prompt: string;
  proofSignal: string;
  checkpoint: string;
};

function getLabSlugForSession(plan: SubjectSprintPlan, session: SubjectSession) {
  return plan.labs.find((lab) => lab.title === session.lab)?.slug ?? plan.labs[0]?.slug ?? "";
}

function buildLabProofStages(session: SubjectSession, lab: SubjectLab, scene: LabScene): LabProofStage[] {
  const primaryNode = scene.nodes[0]?.label ?? session.chapter;
  const secondaryNode = scene.nodes[1]?.label ?? session.lab;
  const finalNode = scene.nodes.at(-1)?.label ?? "UPSC trap";

  return [
    {
      id: `${session.day}-${lab.slug}-concept`,
      title: "Concept proof",
      prompt: `Explain ${session.title} through ${primaryNode} and ${secondaryNode}.`,
      proofSignal: scene.anchor,
      checkpoint: "The student can explain the mechanism without only listing terms.",
    },
    {
      id: `${session.day}-${lab.slug}-case`,
      title: "Applied case",
      prompt: `Attach one India, policy, institution, map, report, technology, society, or history example to ${session.title}.`,
      proofSignal: `Use the lab lens: ${scene.lens}.`,
      checkpoint: "The proof has a concrete place, institution, case, report, law, or current-affairs hook.",
    },
    {
      id: `${session.day}-${lab.slug}-institution`,
      title: "Institution or actor",
      prompt: `Name who acts, regulates, funds, implements, or responds inside ${session.chapter}.`,
      proofSignal: `Connect the actor to ${scene.nodes.slice(0, 3).map((node) => node.label).join(", ")}.`,
      checkpoint: "The answer names the actor and its role, not just the topic.",
    },
    {
      id: `${session.day}-${lab.slug}-trap`,
      title: "UPSC trap",
      prompt: `Create one almost-correct UPSC statement about ${session.title}.`,
      proofSignal: `Hidden exception should come from ${finalNode}.`,
      checkpoint: "The trap has a qualifier, exception, pair-matching risk, or overgeneralization.",
    },
    {
      id: `${session.day}-${lab.slug}-answer`,
      title: "Answer hook",
      prompt: `Compress the lab proof into one mains line and one prelims MCQ angle.`,
      proofSignal: `Use ${lab.title} to bridge Watch, Talk, Lab, and fresh MCQs.`,
      checkpoint: "The saved insight is ready to appear in MCQ explanations or revision notes.",
    },
  ];
}

function buildLabScene(session: SubjectSession, lab: SubjectLab): LabScene {
  const commonDrill = [
    `Explain ${session.title} without reading notes.`,
    `Attach one UPSC-style trap to ${session.chapter}.`,
    `Convert the idea into one map, case, rule, report, or example.`,
  ];

  if (lab.slug === "ecosystem-board") {
    return {
      lens: "Ecology relationship board",
      anchor: "Energy, nutrients, species, and habitat move as one system.",
      boardTitle: "System Flow",
      boardDetail: "Use this board to keep ecology answers connected instead of memorized as isolated terms.",
      nodes: [
        { label: "Habitat", detail: "Physical space and limiting conditions" },
        { label: "Producer", detail: "Primary productivity and biomass entry" },
        { label: "Consumer", detail: "Trophic transfer and population pressure" },
        { label: "Decomposer", detail: "Nutrient return and soil health" },
        { label: "Cycle", detail: "Carbon, nitrogen, phosphorus, water" },
        { label: "Disturbance", detail: "Invasion, pollution, drought, human use" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "biodiversity-map") {
    return {
      lens: "India biodiversity map",
      anchor: "Location, legal category, species, threat, and institution must stay together.",
      boardTitle: "Map Memory Grid",
      boardDetail: "Use the grid to connect protected areas and species with ecological regions.",
      nodes: [
        { label: "Himalaya", detail: "Altitude, endemism, fragile habitats" },
        { label: "Western Ghats", detail: "Hotspot, evergreen forests, endemic species" },
        { label: "Northeast", detail: "Rainfall, corridors, cross-border ecology" },
        { label: "Coasts", detail: "Mangroves, coral, turtle nesting, cyclones" },
        { label: "Drylands", detail: "Grasslands, deserts, Great Indian Bustard" },
        { label: "Protected Area", detail: "Park, sanctuary, biosphere, reserve rules" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "pollution-control") {
    return {
      lens: "Pollution pathway lab",
      anchor: "Every pollution answer needs source, pollutant, pathway, impact, and control.",
      boardTitle: "Source To Control",
      boardDetail: "Trace the pollutant chain before jumping to laws or schemes.",
      nodes: [
        { label: "Source", detail: "Industry, vehicle, farm, household, mining" },
        { label: "Pollutant", detail: "PM, NOx, BOD, heavy metal, plastic" },
        { label: "Pathway", detail: "Air, water, soil, food chain, bioaccumulation" },
        { label: "Impact", detail: "Health, ecology, livelihood, climate" },
        { label: "Standard", detail: "AQI, emission norm, EIA, consent" },
        { label: "Control", detail: "Technology, behavior, law, monitoring" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "climate-link") {
    return {
      lens: "Climate mechanism lab",
      anchor: "Climate questions move from science to impact, then to adaptation and mitigation.",
      boardTitle: "Climate Chain",
      boardDetail: "Keep physical mechanism and policy response in the same mental frame.",
      nodes: [
        { label: "Forcing", detail: "GHG, aerosol, land-use, albedo" },
        { label: "Feedback", detail: "Water vapour, ice-albedo, carbon sink" },
        { label: "Impact", detail: "Heat, rainfall, sea level, extremes" },
        { label: "Adaptation", detail: "Resilience, warning, crop, water, city planning" },
        { label: "Mitigation", detail: "Energy, transport, sinks, efficiency" },
        { label: "Equity", detail: "CBDR, NDC, finance, technology transfer" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "convention-tracker") {
    return {
      lens: "Convention tracker",
      anchor: "Treaties become easy when principle, institution, obligation, and mechanism are separated.",
      boardTitle: "Treaty Logic",
      boardDetail: "Use this board to avoid mixing climate, biodiversity, wetland, ozone, and trade conventions.",
      nodes: [
        { label: "UNFCCC", detail: "Climate, CBDR, COP, NDC" },
        { label: "CBD", detail: "Biodiversity, access, benefit sharing" },
        { label: "CITES", detail: "Wildlife trade appendix logic" },
        { label: "Ramsar", detail: "Wetland conservation and wise use" },
        { label: "Montreal", detail: "Ozone depletion substances" },
        { label: "Paris", detail: "Temperature goal, NDC, stocktake" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "risk-matrix") {
    return {
      lens: "Disaster risk matrix",
      anchor: "Risk becomes visible only when hazard, exposure, vulnerability, and capacity are read together.",
      boardTitle: "Risk Equation",
      boardDetail: "Use this board to stop treating disasters as isolated events and start reading them as risk systems.",
      nodes: [
        { label: "Hazard", detail: "Earthquake, flood, cyclone, drought, chemical release" },
        { label: "Exposure", detail: "People, assets, services, infrastructure in harm's way" },
        { label: "Vulnerability", detail: "Poverty, unsafe housing, weak planning, low awareness" },
        { label: "Capacity", detail: "Preparedness, warning, shelters, local institutions" },
        { label: "Risk", detail: "Expected loss when hazard meets vulnerable exposure" },
        { label: "Resilience", detail: "Ability to absorb, recover, adapt, and reduce future risk" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "hazard-map") {
    return {
      lens: "Hazard map",
      anchor: "Every hazard needs location, trigger, vulnerable zone, warning possibility, and mitigation logic.",
      boardTitle: "India Hazard Board",
      boardDetail: "Use this board to connect disaster questions with Indian regions and local preparedness.",
      nodes: [
        { label: "Seismic Zone", detail: "Himalaya, Northeast, Kachchh, plate-boundary risk" },
        { label: "Flood Basin", detail: "Riverine flood, flash flood, drainage and land-use failure" },
        { label: "Coast", detail: "Cyclone, storm surge, evacuation, mangrove buffer" },
        { label: "Dryland", detail: "Drought, heatwave, water stress, crop impact" },
        { label: "Mountain", detail: "Landslide, avalanche, glacial lake, road cutting" },
        { label: "Urban Risk", detail: "Encroachment, poor drainage, density, critical services" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "response-chain") {
    return {
      lens: "Response chain",
      anchor: "Disaster response must move from alert to evacuation to relief to recovery without breaking coordination.",
      boardTitle: "Warning To Recovery",
      boardDetail: "Use this board to reason through operational gaps in cyclone, flood, drought, and heatwave cases.",
      nodes: [
        { label: "Forecast", detail: "IMD, CWC, local observation, risk communication" },
        { label: "Alert", detail: "Warning level, last-mile message, vulnerable groups" },
        { label: "Evacuate", detail: "Route, transport, shelter, livestock, documents" },
        { label: "Relief", detail: "Food, water, health, sanitation, temporary services" },
        { label: "Recover", detail: "Damage assessment, compensation, restoration" },
        { label: "Build Back", detail: "Safer housing, ecosystem buffer, livelihood resilience" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "institution-grid") {
    return {
      lens: "Institution grid",
      anchor: "Roles must be clear across national, state, district, force, ministry, and community levels.",
      boardTitle: "Governance Chain",
      boardDetail: "Use this board to avoid mixing planning, coordination, funding, and response responsibilities.",
      nodes: [
        { label: "NDMA", detail: "Policy, guidelines, national planning, apex coordination" },
        { label: "SDMA", detail: "State plans, state coordination, department alignment" },
        { label: "DDMA", detail: "District plan, local response, evacuation, relief" },
        { label: "NDRF", detail: "Specialized response, rescue, training, deployment" },
        { label: "Ministries", detail: "Sectoral responsibility and technical agencies" },
        { label: "Community", detail: "Preparedness, volunteers, first response, local knowledge" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "technology-dashboard") {
    return {
      lens: "Technology dashboard",
      anchor: "Technology helps only when data, warning, administration, and community action are connected.",
      boardTitle: "Tech To Last Mile",
      boardDetail: "Use this board to turn GIS, satellites, sensors, and communication into exam-ready governance logic.",
      nodes: [
        { label: "GIS", detail: "Risk maps, shelters, routes, exposure layers" },
        { label: "Remote Sensing", detail: "Flood extent, forest fire, drought, landslide monitoring" },
        { label: "Early Warning", detail: "Forecast, threshold, alert, dissemination" },
        { label: "Drones", detail: "Assessment, delivery, search, inaccessible terrain" },
        { label: "Communication", detail: "Cell broadcast, radio, sirens, local volunteers" },
        { label: "Preparedness", detail: "Mock drills, school safety, panchayat capacity" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "case-study-board") {
    return {
      lens: "Case study board",
      anchor: "A mains-ready disaster answer needs case, lesson, institution, community, and reform.",
      boardTitle: "Case To Answer",
      boardDetail: "Use this board to convert events into structured examples and policy recommendations.",
      nodes: [
        { label: "Context", detail: "Place, hazard, vulnerability, exposure" },
        { label: "Trigger", detail: "Rainfall, cyclone, earthquake, industrial failure" },
        { label: "Response", detail: "Warning, evacuation, rescue, relief, coordination" },
        { label: "Gap", detail: "Planning, infrastructure, communication, enforcement" },
        { label: "Lesson", detail: "Preparedness, ecosystem, technology, community capacity" },
        { label: "Reform", detail: "Build-back-better, risk audit, local resilience" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "fire-and-industrial-risk") {
    return {
      lens: "Industrial and fire risk lab",
      anchor: "Technical disasters need prevention, emergency planning, health response, liability, and public communication.",
      boardTitle: "Prevention To Accountability",
      boardDetail: "Use this board to connect industrial safety and ecosystem fire risk with governance.",
      nodes: [
        { label: "Hazard Source", detail: "Chemical storage, forest fuel, reactor, lab, pipeline" },
        { label: "Prevention", detail: "Inspection, safety code, buffer, maintenance, training" },
        { label: "Emergency Plan", detail: "On-site, off-site, evacuation, medical response" },
        { label: "Health Impact", detail: "Toxic exposure, burns, trauma, long-term monitoring" },
        { label: "Liability", detail: "Compensation, accountability, regulation, audit" },
        { label: "Recovery", detail: "Restoration, livelihood support, environmental cleanup" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "macro-flow-board") {
    return {
      lens: "Macro circular flow",
      anchor: "Economy questions become easier when households, firms, government, banks, and external sector are connected.",
      boardTitle: "Circular Flow",
      boardDetail: "Use this board to trace how income, output, savings, investment, tax, spending, and imports move together.",
      nodes: [
        { label: "Households", detail: "Consumption, savings, labour, welfare, tax incidence" },
        { label: "Firms", detail: "Production, investment, employment, profits, credit demand" },
        { label: "Government", detail: "Tax, expenditure, borrowing, welfare, regulation" },
        { label: "Banks", detail: "Deposits, credit, liquidity, monetary transmission" },
        { label: "External Sector", detail: "Exports, imports, capital flows, exchange rate" },
        { label: "Indicators", detail: "GDP, inflation, unemployment, CAD, fiscal deficit" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "inflation-dashboard") {
    return {
      lens: "Inflation dashboard",
      anchor: "Inflation must be read through cause, index, affected group, and policy response.",
      boardTitle: "Price Pressure Board",
      boardDetail: "Use this board to separate demand-pull, cost-push, monetary, imported, and structural inflation.",
      nodes: [
        { label: "Demand", detail: "Income, credit, government spending, expectations" },
        { label: "Supply", detail: "Fuel, food, logistics, global shocks, harvest" },
        { label: "Index", detail: "CPI, WPI, core inflation, base effect" },
        { label: "Impact", detail: "Poor households, real wages, savings, firms" },
        { label: "RBI", detail: "Repo, liquidity, stance, transmission" },
        { label: "Government", detail: "Buffer stock, tax cuts, imports, supply measures" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "banking-credit-grid") {
    return {
      lens: "Banking credit grid",
      anchor: "Banking links savings to investment, but risk, regulation, capital, and trust decide credit flow.",
      boardTitle: "Credit Transmission",
      boardDetail: "Use this board to connect RBI tools, bank balance sheets, borrowers, NPAs, and growth.",
      nodes: [
        { label: "Deposits", detail: "Savings, CASA, deposit rates, bank liabilities" },
        { label: "Credit", detail: "Loans, working capital, investment, consumption" },
        { label: "RBI Tools", detail: "Repo, CRR, SLR, OMO, liquidity" },
        { label: "Risk", detail: "NPA, provisioning, capital adequacy, governance" },
        { label: "Markets", detail: "Bonds, equity, money market, SEBI" },
        { label: "Transmission", detail: "Policy rate to lending rate to demand" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "budget-tax-lab") {
    return {
      lens: "Budget and tax lab",
      anchor: "Fiscal policy must be read through revenue, expenditure, deficit, debt, and growth impact.",
      boardTitle: "Fiscal Flow",
      boardDetail: "Use this board to avoid mixing revenue/capital, direct/indirect, deficit types, and GST chain logic.",
      nodes: [
        { label: "Receipts", detail: "Tax, non-tax, borrowings, disinvestment" },
        { label: "Expenditure", detail: "Revenue, capital, subsidies, grants, schemes" },
        { label: "Deficit", detail: "Fiscal, revenue, primary, debt implications" },
        { label: "Tax", detail: "Direct, indirect, GST, cess, surcharge" },
        { label: "Federalism", detail: "GST Council, Finance Commission, transfers" },
        { label: "Outcome", detail: "Growth, inclusion, inflation, crowding out" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "external-sector-map") {
    return {
      lens: "External sector map",
      anchor: "External stability depends on trade, capital flows, currency, reserves, and global shocks.",
      boardTitle: "BoP Map",
      boardDetail: "Use this board to reason through current account, capital account, forex, exchange rate, and trade policy.",
      nodes: [
        { label: "Exports", detail: "Goods, services, competitiveness, global demand" },
        { label: "Imports", detail: "Oil, gold, capital goods, intermediate goods" },
        { label: "Current Account", detail: "Trade balance, invisibles, remittances" },
        { label: "Capital Account", detail: "FDI, FPI, ECB, external borrowing" },
        { label: "Currency", detail: "Depreciation, appreciation, REER, inflation pass-through" },
        { label: "Reserves", detail: "Forex buffer, intervention, import cover" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "growth-inclusion-lab") {
    return {
      lens: "Growth inclusion lab",
      anchor: "Growth is exam-ready only when connected to jobs, productivity, welfare, poverty, and sectoral change.",
      boardTitle: "Inclusive Growth Grid",
      boardDetail: "Use this board to connect agriculture, industry, services, welfare, and employment in one answer.",
      nodes: [
        { label: "Agriculture", detail: "MSP, markets, irrigation, risk, food security" },
        { label: "Industry", detail: "MSME, PLI, logistics, investment, jobs" },
        { label: "Services", detail: "IT, platforms, digital payments, gig work" },
        { label: "Employment", detail: "LFPR, unemployment, skills, informality" },
        { label: "Welfare", detail: "DBT, MGNREGA, social security, targeting" },
        { label: "Inequality", detail: "Poverty, human development, regional disparity" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "policy-reform-board") {
    return {
      lens: "Policy reform board",
      anchor: "Reforms should be studied as a changing state-market relationship, not just as a 1991 event.",
      boardTitle: "Reform Logic",
      boardDetail: "Use this board to connect reforms, institutions, Budget, Survey, schemes, and current affairs.",
      nodes: [
        { label: "1991 Reform", detail: "Liberalization, privatization, globalization" },
        { label: "Institutions", detail: "NITI Aayog, RBI, SEBI, GST Council" },
        { label: "Budget", detail: "Priorities, allocations, fiscal math, schemes" },
        { label: "Survey", detail: "Themes, data, policy diagnosis, reforms" },
        { label: "Schemes", detail: "Target group, ministry, funding, outcome" },
        { label: "Current Affairs", detail: "Data release, global shock, RBI update, policy change" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "science-system-board") {
    return {
      lens: "Science policy system",
      anchor: "Science and Tech becomes exam-ready when principle, institution, application, ethics, and impact are connected.",
      boardTitle: "Science To Society",
      boardDetail: "Use this board to convert inventions, missions, and discoveries into governance-ready notes.",
      nodes: [
        { label: "Principle", detail: "Scientific concept, mechanism, method, evidence" },
        { label: "Institution", detail: "ISRO, DRDO, DST, DBT, CSIR, ICMR, missions" },
        { label: "Application", detail: "Health, agriculture, defence, climate, governance" },
        { label: "Risk", detail: "Privacy, safety, ethics, dual use, environmental impact" },
        { label: "Policy", detail: "Funding, regulation, standards, IPR, access" },
        { label: "Outcome", detail: "Inclusion, productivity, security, resilience" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "space-mission-control") {
    return {
      lens: "Space mission control",
      anchor: "Space missions should be read through orbit, payload, objective, launch vehicle, and public application.",
      boardTitle: "Mission Logic",
      boardDetail: "Use this board to avoid memorizing mission names without scientific and governance value.",
      nodes: [
        { label: "Orbit", detail: "LEO, GTO, geostationary, polar, sun-synchronous" },
        { label: "Launch Vehicle", detail: "PSLV, GSLV, LVM3, payload capacity, mission profile" },
        { label: "Payload", detail: "Camera, spectrometer, communication, navigation, science instrument" },
        { label: "Mission", detail: "Chandrayaan, Aditya, Gaganyaan, NavIC, remote sensing" },
        { label: "Application", detail: "Disaster, agriculture, weather, navigation, connectivity" },
        { label: "Strategy", detail: "Commercial space, security, autonomy, international cooperation" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "digital-ai-lab") {
    return {
      lens: "Digital AI lab",
      anchor: "Digital technology needs data, infrastructure, model logic, security, regulation, and social impact.",
      boardTitle: "Data To Decision",
      boardDetail: "Use this board to reason through AI, cyber, IoT, robotics, cloud, and digital public infrastructure.",
      nodes: [
        { label: "Data", detail: "Collection, quality, consent, privacy, bias" },
        { label: "Model", detail: "Algorithm, training, inference, validation, explainability" },
        { label: "Infrastructure", detail: "Cloud, edge, compute, sensors, networks" },
        { label: "Security", detail: "Encryption, CERT-In, cyber threats, critical infrastructure" },
        { label: "Governance", detail: "Data protection, audit, standards, accountability" },
        { label: "Impact", detail: "Service delivery, jobs, inclusion, risk, productivity" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "biotech-health-lab") {
    return {
      lens: "Biotech health lab",
      anchor: "Biotechnology questions connect molecular tools with health, agriculture, ethics, and regulation.",
      boardTitle: "Gene To Public Health",
      boardDetail: "Use this board to map CRISPR, sequencing, vaccines, diagnostics, AMR, and biotech governance.",
      nodes: [
        { label: "Molecule", detail: "DNA, RNA, protein, gene, enzyme" },
        { label: "Tool", detail: "PCR, sequencing, recombinant DNA, CRISPR" },
        { label: "Health", detail: "Vaccines, diagnostics, surveillance, AMR" },
        { label: "Agriculture", detail: "GM crops, biofortification, stress tolerance" },
        { label: "Ethics", detail: "Gene editing, privacy, equity, biosafety" },
        { label: "Regulation", detail: "Clinical trials, biosafety approvals, public trust" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "energy-climate-tech") {
    return {
      lens: "Energy climate tech",
      anchor: "Energy and climate technologies must be tested through mechanism, storage, grid, emissions, and cost.",
      boardTitle: "Transition Tech",
      boardDetail: "Use this board to connect renewables, hydrogen, batteries, nuclear, carbon capture, and climate monitoring.",
      nodes: [
        { label: "Generation", detail: "Solar, wind, nuclear, fuel cells, green hydrogen" },
        { label: "Storage", detail: "Batteries, pumped hydro, hydrogen, thermal storage" },
        { label: "Grid", detail: "Smart grid, intermittency, transmission, demand response" },
        { label: "Mitigation", detail: "Carbon capture, efficiency, low-carbon fuels" },
        { label: "Monitoring", detail: "Climate models, weather prediction, pollution sensors" },
        { label: "Policy", detail: "Subsidy, standards, financing, just transition" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "defence-security-tech") {
    return {
      lens: "Defence security tech",
      anchor: "Modern security technology connects missiles, drones, radar, cyber, space, autonomy, and indigenization.",
      boardTitle: "Security Tech Grid",
      boardDetail: "Use this board to understand defence systems by domain, sensor, platform, weapon, and command chain.",
      nodes: [
        { label: "Missiles", detail: "Range, guidance, propulsion, payload, deterrence" },
        { label: "Drones", detail: "ISR, strike, swarm, autonomy, counter-drone" },
        { label: "Sensors", detail: "Radar, sonar, satellites, electronic intelligence" },
        { label: "Cyber-Space", detail: "Critical systems, communication, space assets, EW" },
        { label: "Indigenization", detail: "DRDO, private sector, procurement, testing" },
        { label: "Ethics", detail: "Autonomous weapons, accountability, escalation risk" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "innovation-current-affairs") {
    return {
      lens: "Innovation current affairs",
      anchor: "Science news becomes exam-worthy when it links to concept, mission, institution, application, and risk.",
      boardTitle: "News To Concept",
      boardDetail: "Use this board to convert launches, reports, awards, regulations, and missions into stable revision hooks.",
      nodes: [
        { label: "News Item", detail: "Mission, regulation, award, startup, discovery, launch" },
        { label: "Static Concept", detail: "Principle, mechanism, process, terminology" },
        { label: "Institution", detail: "Ministry, agency, lab, mission, regulator" },
        { label: "Application", detail: "Health, defence, agriculture, climate, governance" },
        { label: "Risk", detail: "Ethics, safety, privacy, environment, dual use" },
        { label: "Question Hook", detail: "Statement trap, pair match, application-based mains point" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "constitution-map") {
    return {
      lens: "Constitution map",
      anchor: "Polity becomes clear when article, principle, institution, limitation, and remedy are read together.",
      boardTitle: "Constitution Balance",
      boardDetail: "Use this board to connect constitutional values with provisions, institutions, and governance outcomes.",
      nodes: [
        { label: "Preamble", detail: "Justice, liberty, equality, fraternity, sovereignty" },
        { label: "Structure", detail: "Union, states, citizenship, schedules, amendments" },
        { label: "Rights", detail: "Part III, restrictions, remedies, judicial review" },
        { label: "Policy", detail: "DPSP, welfare state, duties, constitutional morality" },
        { label: "Emergency", detail: "Order, liberty, federal balance, safeguards" },
        { label: "Doctrine", detail: "Basic structure, rule of law, separation of powers" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "rights-justice-lab") {
    return {
      lens: "Rights justice lab",
      anchor: "Rights questions require article, scope, restriction, remedy, court interpretation, and social impact.",
      boardTitle: "Right To Remedy",
      boardDetail: "Use this board to compare Fundamental Rights, DPSP, duties, writs, and access to justice.",
      nodes: [
        { label: "Article", detail: "Equality, freedom, life, religion, culture, remedies" },
        { label: "Scope", detail: "State action, individual liberty, public interest" },
        { label: "Restriction", detail: "Reasonable limits, security, morality, order" },
        { label: "Remedy", detail: "Article 32, 226, writs, PIL, legal aid" },
        { label: "DPSP", detail: "Welfare, social justice, directive policy role" },
        { label: "Balance", detail: "Rights, duties, justice, governance capacity" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "parliament-process-board") {
    return {
      lens: "Parliament process board",
      anchor: "Parliament must be studied as law-making, financial control, debate, committee work, and accountability.",
      boardTitle: "Bill To Law",
      boardDetail: "Use this board to trace ordinary bills, money bills, committees, budget control, and privileges.",
      nodes: [
        { label: "House", detail: "Lok Sabha, Rajya Sabha, joint sitting, sessions" },
        { label: "Bill", detail: "Ordinary, money, financial, constitutional amendment" },
        { label: "Committee", detail: "Scrutiny, expertise, reports, executive accountability" },
        { label: "Budget", detail: "Demands, cut motions, appropriation, finance bill" },
        { label: "Privilege", detail: "Freedom of speech, contempt, internal control" },
        { label: "Accountability", detail: "Questions, motions, debates, CAG reports" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "federalism-grid") {
    return {
      lens: "Federalism grid",
      anchor: "Indian federalism must be read through legislative, administrative, fiscal, political, and local-government relations.",
      boardTitle: "Centre-State Matrix",
      boardDetail: "Use this board to connect lists, councils, Finance Commission, GST Council, emergency effects, and local bodies.",
      nodes: [
        { label: "Legislative", detail: "Union, State, Concurrent lists, residuary power" },
        { label: "Administrative", detail: "Directions, All India Services, inter-state coordination" },
        { label: "Fiscal", detail: "Finance Commission, grants, borrowing, GST Council" },
        { label: "Political", detail: "Governor, Rajya Sabha, coalition, regional parties" },
        { label: "Local", detail: "Panchayats, municipalities, finance, functions" },
        { label: "Stress", detail: "Emergency, disputes, central laws, cooperative federalism" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "institution-grid-polity") {
    return {
      lens: "Polity institution grid",
      anchor: "Institution questions are solved by status, appointment, tenure, powers, independence, and accountability.",
      boardTitle: "Institution Logic",
      boardDetail: "Use this board to avoid mixing constitutional bodies, statutory bodies, executive offices, and regulators.",
      nodes: [
        { label: "Executive", detail: "President, Governor, PM, CM, council of ministers" },
        { label: "Judiciary", detail: "SC, HC, review, writs, independence, appointments" },
        { label: "Constitutional Body", detail: "ECI, CAG, UPSC, Finance Commission" },
        { label: "Statutory Body", detail: "NHRC, CIC, CVC, regulators, commissions" },
        { label: "Independence", detail: "Appointment, removal, tenure, finance, powers" },
        { label: "Accountability", detail: "Reports, Parliament, courts, transparency" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "election-democracy-lab") {
    return {
      lens: "Election democracy lab",
      anchor: "Election integrity depends on rules, institutions, technology, parties, finance, and voter trust.",
      boardTitle: "Democracy Flow",
      boardDetail: "Use this board to connect ECI, MCC, EVM, VVPAT, anti-defection, and electoral reforms.",
      nodes: [
        { label: "ECI", detail: "Superintendence, direction, control, election schedule" },
        { label: "MCC", detail: "Campaign conduct, neutrality, enforcement limits" },
        { label: "Technology", detail: "EVM, VVPAT, counting, transparency, trust" },
        { label: "Parties", detail: "Recognition, symbols, inner-party democracy, finance" },
        { label: "Anti-Defection", detail: "Tenth Schedule, whip, merger, Speaker role" },
        { label: "Reform", detail: "Criminalization, funding, turnout, representation" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "governance-delivery-board") {
    return {
      lens: "Governance delivery board",
      anchor: "Governance works only when policy design, institutions, technology, accountability, and citizen feedback align.",
      boardTitle: "Policy To Citizen",
      boardDetail: "Use this board to map RTI, social audit, e-governance, DBT, policy cycle, and service delivery.",
      nodes: [
        { label: "Policy Design", detail: "Problem, objective, target group, instrument" },
        { label: "Implementation", detail: "Ministry, state, district, local body, capacity" },
        { label: "Technology", detail: "DBT, portals, identity, data, monitoring" },
        { label: "Transparency", detail: "RTI, proactive disclosure, open data" },
        { label: "Accountability", detail: "Audit, grievance, social audit, citizen charter" },
        { label: "Outcome", detail: "Inclusion, leakage reduction, trust, last-mile delivery" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "polity-current-affairs") {
    return {
      lens: "Polity current affairs",
      anchor: "Polity news becomes exam-worthy when article, institution, issue, judgment, and reform are linked.",
      boardTitle: "News To Article",
      boardDetail: "Use this board to convert judgments, bills, federal disputes, and governance updates into stable notes.",
      nodes: [
        { label: "News", detail: "Judgment, bill, body report, federal dispute, reform" },
        { label: "Article", detail: "Relevant provision, schedule, amendment, doctrine" },
        { label: "Institution", detail: "Court, Parliament, ECI, CAG, commission, ministry" },
        { label: "Issue", detail: "Rights, federalism, accountability, representation" },
        { label: "Precedent", detail: "Case law, committee, commission, past event" },
        { label: "Reform", detail: "Recommendation, safeguard, governance implication" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "security-framework") {
    return {
      lens: "Security framework",
      anchor: "Internal security answers work when threat, vulnerability, institution, law, force, and community trust stay connected.",
      boardTitle: "Threat Matrix",
      boardDetail: "Use this board to diagnose security issues before jumping to agencies or force response.",
      nodes: [
        { label: "Threat", detail: "Terrorism, extremism, cyber, border, organised crime" },
        { label: "Vulnerability", detail: "Terrain, inequality, weak policing, infrastructure gaps" },
        { label: "Intelligence", detail: "Collection, sharing, analysis, early warning" },
        { label: "Law", detail: "Procedure, rights, special powers, accountability" },
        { label: "Force", detail: "Police, CAPF, coast guard, armed forces interface" },
        { label: "Resilience", detail: "Community trust, development, rehabilitation, continuity" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "border-security-map") {
    return {
      lens: "Border security map",
      anchor: "Border management needs geography, technology, force posture, livelihood, diplomacy, and local trust.",
      boardTitle: "Border Risk Map",
      boardDetail: "Use this board to connect terrain and people with security threats and governance response.",
      nodes: [
        { label: "Land Border", detail: "Terrain, fencing, villages, trade, infiltration routes" },
        { label: "Coast", detail: "Fishing, ports, landing points, maritime surveillance" },
        { label: "Maritime", detail: "Sea lanes, piracy, smuggling, coastal radar chain" },
        { label: "Smuggling", detail: "Arms, narcotics, fake currency, contraband" },
        { label: "Migration", detail: "Refugees, illegal movement, identity, humanitarian balance" },
        { label: "Surveillance", detail: "Sensors, drones, patrols, intelligence, coordination" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "terrorism-response-grid") {
    return {
      lens: "Terrorism response grid",
      anchor: "Counter-terror strategy must follow the chain from ideology and recruitment to finance, intelligence, law, and rehabilitation.",
      boardTitle: "Threat To Response",
      boardDetail: "Use this board to frame terrorism, radicalisation, LWE, and insurgency without one-dimensional answers.",
      nodes: [
        { label: "Ideology", detail: "Narrative, grievance, identity, propaganda" },
        { label: "Recruitment", detail: "Networks, online spaces, coercion, local grievances" },
        { label: "Financing", detail: "Hawala, laundering, narcotics, extortion, crypto" },
        { label: "Weapon", detail: "Arms, IED, drone, cyber, dual-use technology" },
        { label: "Intelligence", detail: "Prevention, coordination, evidence, prosecution support" },
        { label: "Rehabilitation", detail: "Surrender, counselling, livelihood, social reintegration" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "cyber-security-grid") {
    return {
      lens: "Cyber security grid",
      anchor: "Cyber threats become internal security issues when data, infrastructure, identity, and public trust are attacked.",
      boardTitle: "Cyber Threat Grid",
      boardDetail: "Use this board to convert technical cyber terms into governance, security, and rights logic.",
      nodes: [
        { label: "Malware", detail: "Ransomware, spyware, botnet, supply-chain attack" },
        { label: "Phishing", detail: "Credential theft, fraud, social engineering, deepfake" },
        { label: "Critical Infra", detail: "Power, banking, telecom, transport, health systems" },
        { label: "Data", detail: "Privacy, breach, identity, sovereignty, trust" },
        { label: "Attribution", detail: "State actor, non-state actor, proof, escalation" },
        { label: "Response", detail: "CERT, incident response, audit, resilience, awareness" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "institution-response-chain") {
    return {
      lens: "Institution response chain",
      anchor: "Security response must align police, intelligence, forces, courts, regulators, and communities with accountability.",
      boardTitle: "Institution Chain",
      boardDetail: "Use this board to avoid mixing mandate, coordination, investigation, prosecution, and public trust.",
      nodes: [
        { label: "MHA", detail: "Policy, coordination, central forces, internal security oversight" },
        { label: "Intelligence", detail: "Inputs, analysis, sharing, early warning" },
        { label: "Police", detail: "Prevention, investigation, order, community interface" },
        { label: "CAPF", detail: "Special deployment, border, LWE, riot, critical assets" },
        { label: "Courts", detail: "Procedure, evidence, rights, conviction, review" },
        { label: "Community", detail: "Trust, reporting, resilience, rehabilitation" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "society-structure-lab") {
    return {
      lens: "Society structure lab",
      anchor: "Indian society must be read through institutions, identities, inequality, continuity, and change.",
      boardTitle: "Society Structure",
      boardDetail: "Use this board to connect social features with examples, current affairs, and governance response.",
      nodes: [
        { label: "Family", detail: "Joint, nuclear, care, gender roles, intergenerational change" },
        { label: "Caste", detail: "Hierarchy, mobility, discrimination, politics, reservation" },
        { label: "Tribe", detail: "Identity, land, culture, displacement, autonomy" },
        { label: "Religion", detail: "Pluralism, secularism, harmony, communal tension" },
        { label: "Region", detail: "Language, federal identity, migration, regionalism" },
        { label: "Class", detail: "Poverty, inequality, work, mobility, aspiration" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "social-justice-board") {
    return {
      lens: "Social justice board",
      anchor: "Social justice answers need right, barrier, institution, delivery, dignity, and measurable outcome.",
      boardTitle: "Justice Delivery",
      boardDetail: "Use this board to connect vulnerable sections with law, welfare, representation, and accountability.",
      nodes: [
        { label: "Rights", detail: "Equality, dignity, protection, constitutional safeguards" },
        { label: "Welfare", detail: "Schemes, benefits, health, education, livelihood" },
        { label: "Access", detail: "Awareness, documentation, distance, digital divide" },
        { label: "Representation", detail: "Political voice, administration, participation" },
        { label: "Protection", detail: "Law, grievance redressal, rescue, rehabilitation" },
        { label: "Accountability", detail: "Audit, data, courts, commissions, social monitoring" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "migration-urbanisation-map") {
    return {
      lens: "Migration urbanisation map",
      anchor: "Migration and urbanisation questions move from push-pull causes to city systems, vulnerability, and integration.",
      boardTitle: "Mobility Map",
      boardDetail: "Use this board to explain social change through movement, work, services, identity, and policy.",
      nodes: [
        { label: "Push Factor", detail: "Agrarian stress, conflict, climate, unemployment" },
        { label: "Pull Factor", detail: "Jobs, education, safety, services, networks" },
        { label: "City", detail: "Housing, transport, sanitation, informal settlements" },
        { label: "Informality", detail: "Gig work, daily wage, social security gap" },
        { label: "Services", detail: "Health, school, identity documents, welfare portability" },
        { label: "Integration", detail: "Language, social networks, inclusion, local governance" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "security-case-board") {
    return {
      lens: "Security case board",
      anchor: "A strong security answer turns a case into actors, threat, response, rights balance, gap, and reform.",
      boardTitle: "Case To Strategy",
      boardDetail: "Use this board to convert incidents and case studies into repeatable mains frameworks.",
      nodes: [
        { label: "Context", detail: "Place, society, terrain, institution, recent trigger" },
        { label: "Threat", detail: "Actor, method, network, finance, technology" },
        { label: "Actors", detail: "State, non-state group, community, external link" },
        { label: "Response", detail: "Intelligence, policing, legal action, development" },
        { label: "Gap", detail: "Capacity, trust, coordination, rights, infrastructure" },
        { label: "Reform", detail: "Prevention, accountability, resilience, rehabilitation" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "society-current-affairs") {
    return {
      lens: "Society current affairs",
      anchor: "Society news becomes useful when group, issue, institution, policy, social impact, and answer hook are linked.",
      boardTitle: "News To Society",
      boardDetail: "Use this board to turn daily news into society examples for GS answers.",
      nodes: [
        { label: "News", detail: "Judgment, report, protest, scheme, survey, social trend" },
        { label: "Group", detail: "Women, children, elderly, migrants, tribes, minorities" },
        { label: "Issue", detail: "Inequality, identity, exclusion, violence, mobility" },
        { label: "Institution", detail: "Court, ministry, commission, local body, school" },
        { label: "Policy", detail: "Law, scheme, reform, budget, implementation tool" },
        { label: "Answer Hook", detail: "Example, data, constitutional value, reform point" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "modern-timeline") {
    return {
      lens: "Modern history timeline",
      anchor: "Modern History becomes clear when event, cause, actor, law, movement, and consequence are read in order.",
      boardTitle: "Timeline To Cause",
      boardDetail: "Use this board to prevent chronology errors and connect events with larger historical processes.",
      nodes: [
        { label: "Event", detail: "War, act, revolt, reform, movement, negotiation" },
        { label: "Cause", detail: "Economic, political, social, religious, external trigger" },
        { label: "Actor", detail: "Company, Crown, Congress, leader, peasant, tribe, worker" },
        { label: "Law", detail: "Charter act, council act, reform, regulation, restriction" },
        { label: "Movement", detail: "Moderate, extremist, Gandhian, revolutionary, socialist" },
        { label: "Consequence", detail: "Administrative change, mass politics, ideology, partition, integration" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "national-movement-board") {
    return {
      lens: "National movement board",
      anchor: "National movement questions need ideology, method, social base, leadership, British response, and limitation.",
      boardTitle: "Movement Anatomy",
      boardDetail: "Use this board to compare reform movements, uprisings, Congress phases, and mass movements.",
      nodes: [
        { label: "Ideology", detail: "Moderate, extremist, revolutionary, Gandhian, socialist" },
        { label: "Method", detail: "Petition, boycott, satyagraha, strike, underground action" },
        { label: "Social Base", detail: "Peasants, workers, students, women, tribes, middle class" },
        { label: "Leader", detail: "Local leadership, national leadership, ideological mentors" },
        { label: "British Response", detail: "Repression, reform, negotiation, divide, concession" },
        { label: "Outcome", detail: "Mass awakening, institutional shift, limitation, next phase" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "constitutional-development") {
    return {
      lens: "Constitutional development",
      anchor: "Modern constitutional history moves from company control to representation, federation, responsibility, and transfer of power.",
      boardTitle: "Act To Institution",
      boardDetail: "Use this board to keep acts, councils, powers, representation, and federal ideas separated.",
      nodes: [
        { label: "Company Control", detail: "Regulating Act, Pitt's Act, Board of Control" },
        { label: "Council", detail: "Legislative councils, executive councils, Indian participation" },
        { label: "Representation", detail: "Separate electorate, franchise, communal award, reserved seats" },
        { label: "Federal Idea", detail: "Provinces, dyarchy, autonomy, federation proposal" },
        { label: "Responsibility", detail: "Executive accountability, ministries, responsible government" },
        { label: "Transfer", detail: "Cabinet Mission, Mountbatten Plan, independence, partition" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "ancient-civilisation-map") {
    return {
      lens: "Ancient civilisation map",
      anchor: "Ancient History is strongest when source, site, polity, economy, society, and culture are mapped together.",
      boardTitle: "Source To Site",
      boardDetail: "Use this board to connect archaeological and literary evidence with historical interpretation.",
      nodes: [
        { label: "Source", detail: "Inscriptions, coins, texts, archaeology, foreign accounts" },
        { label: "Site", detail: "Urban centre, port, capital, cave, monastery, temple" },
        { label: "Polity", detail: "Janapada, empire, republic, monarchy, regional kingdom" },
        { label: "Economy", detail: "Agriculture, craft, guild, trade, coins, land grants" },
        { label: "Society", detail: "Varna, jati, gender, tribe, family, education" },
        { label: "Culture", detail: "Religion, art, literature, science, philosophy" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "ancient-thought-lab") {
    return {
      lens: "Ancient thought lab",
      anchor: "Ancient intellectual traditions need doctrine, text, patronage, practice, spread, and social impact.",
      boardTitle: "Idea To Tradition",
      boardDetail: "Use this board to compare religions, philosophies, literature, science, and language traditions.",
      nodes: [
        { label: "Doctrine", detail: "Dharma, karma, ahimsa, anekantavada, middle path, moksha" },
        { label: "Text", detail: "Vedas, Upanishads, Tripitaka, Agamas, epics, Sangam corpus" },
        { label: "Patronage", detail: "King, guild, merchant, monastery, temple, court" },
        { label: "Practice", detail: "Ritual, meditation, monastic life, debate, worship" },
        { label: "Spread", detail: "Mission, trade route, language, inscription, pilgrimage" },
        { label: "Impact", detail: "Ethics, society, art, architecture, literature, politics" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "medieval-polity-grid") {
    return {
      lens: "Medieval polity grid",
      anchor: "Medieval History requires dynasty, administration, economy, nobility, region, and cultural production in one view.",
      boardTitle: "Dynasty To System",
      boardDetail: "Use this board to compare Sultanate, Mughal, Vijayanagara, Bahmani, Maratha, and regional systems.",
      nodes: [
        { label: "Dynasty", detail: "Rulers, succession, expansion, military pressure" },
        { label: "Administration", detail: "Iqta, mansab, jagir, provincial control, revenue" },
        { label: "Economy", detail: "Agriculture, crafts, ports, coins, market, land revenue" },
        { label: "Nobility", detail: "Turks, Afghans, Rajputs, zamindars, mansabdars, elites" },
        { label: "Region", detail: "Delhi, Deccan, Bengal, Rajputana, South India, Punjab" },
        { label: "Transition", detail: "Decline, regionalisation, European entry, 18th century" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "bhakti-sufi-culture") {
    return {
      lens: "Bhakti Sufi culture",
      anchor: "Bhakti and Sufi traditions are best read through teacher, language, institution, practice, message, and society.",
      boardTitle: "Devotion To Society",
      boardDetail: "Use this board to connect saints, silsilas, poetry, music, vernacular languages, and social change.",
      nodes: [
        { label: "Teacher", detail: "Saint, guru, pir, acharya, poet, reformer" },
        { label: "Language", detail: "Tamil, Hindi, Marathi, Punjabi, Persian, regional forms" },
        { label: "Institution", detail: "Matha, temple, khanqah, dargah, community network" },
        { label: "Practice", detail: "Kirtan, sama, zikr, pilgrimage, service, poetry" },
        { label: "Message", detail: "Devotion, equality, love, surrender, social critique" },
        { label: "Impact", detail: "Vernacular growth, synthesis, reform, popular religion" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "art-architecture-lab") {
    return {
      lens: "Art architecture lab",
      anchor: "Art and architecture questions are solved by feature, patron, school, material, site, and chronology.",
      boardTitle: "Feature To Site",
      boardDetail: "Use this board to identify temples, stupas, caves, tombs, paintings, sculpture, and iconography.",
      nodes: [
        { label: "Feature", detail: "Shikhara, vimana, dome, arch, stupa, mandapa, mudra" },
        { label: "Patron", detail: "King, guild, merchant, monk, sultan, emperor, community" },
        { label: "School", detail: "Nagara, Dravida, Vesara, Gandhara, Mathura, Mughal, Rajput" },
        { label: "Material", detail: "Stone, brick, bronze, paint, stucco, manuscript" },
        { label: "Site", detail: "Sanchi, Ajanta, Ellora, Khajuraho, Thanjavur, Fatehpur Sikri" },
        { label: "Chronology", detail: "Ancient, early medieval, Sultanate, Mughal, regional phase" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "culture-current-affairs") {
    return {
      lens: "Culture current affairs",
      anchor: "Culture news becomes exam-ready when heritage, institution, location, feature, community, and conservation are linked.",
      boardTitle: "News To Heritage",
      boardDetail: "Use this board to turn UNESCO, GI, festivals, excavations, and cultural schemes into stable notes.",
      nodes: [
        { label: "Heritage", detail: "Tangible, intangible, natural-cultural, living tradition" },
        { label: "Institution", detail: "ASI, UNESCO, ministry, academy, museum, state body" },
        { label: "Location", detail: "State, region, river, trade route, cultural zone" },
        { label: "Feature", detail: "Architecture, performance, craft, ritual, language, cuisine" },
        { label: "Community", detail: "Artist, artisan, tribe, sect, monastery, local society" },
        { label: "Conservation", detail: "GI, restoration, documentation, tourism, livelihood" },
      ],
      drill: commonDrill,
    };
  }

  if (lab.slug === "history-revision-board") {
    return {
      lens: "History revision board",
      anchor: "Final History command needs timeline, source, map, personality, culture, and PYQ trap recovery.",
      boardTitle: "Recall Grid",
      boardDetail: "Use this board to repair weak areas across Modern, Ancient, Medieval, and Art and Culture.",
      nodes: [
        { label: "Timeline", detail: "Order events, reigns, acts, movements, and cultural phases" },
        { label: "Source", detail: "Inscription, text, coin, travel account, archaeology, report" },
        { label: "Map", detail: "Site, capital, port, battle, movement centre, cultural region" },
        { label: "Personality", detail: "Leader, ruler, saint, reformer, scholar, artist" },
        { label: "Culture", detail: "Architecture, literature, religion, music, dance, painting" },
        { label: "PYQ Trap", detail: "Pairing, chronology, location, feature, statement qualifier" },
      ],
      drill: commonDrill,
    };
  }

  return {
    lens: "Current affairs bridge",
    anchor: "News becomes useful only when it connects to static concept, place, institution, and exam angle.",
    boardTitle: "News To Notes",
    boardDetail: "Convert reports, indices, disasters, species news, and policies into stable revision hooks.",
    nodes: [
      { label: "Report", detail: "Publisher, index, theme, India rank" },
      { label: "Species", detail: "Habitat, threat, IUCN, project" },
      { label: "Place", detail: "River, wetland, forest, coast, protected area" },
      { label: "Policy", detail: "Ministry, rule, scheme, target" },
      { label: "Disaster", detail: "Hazard, vulnerability, response, mitigation" },
      { label: "PYQ Hook", detail: "Statement trap and paired facts" },
    ],
    drill: commonDrill,
  };
}

export function SubjectLabRoom({
  plan,
  initialDay,
  initialMode,
}: {
  plan: SubjectSprintPlan;
  initialDay?: number;
  initialMode?: string;
}) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useSubjectProgress(plan.slug, plan.sessions);
  const boundedInitialDay =
    initialDay && Number.isFinite(initialDay) ? Math.min(Math.max(initialDay, 1), plan.sessions.length) : 1;
  const initialSession = plan.sessions.find((session) => session.day === boundedInitialDay) ?? plan.sessions[0];
  const [activeDay, setActiveDay] = useState(boundedInitialDay);
  const [activeLabSlug, setActiveLabSlug] = useState(initialMode || getLabSlugForSession(plan, initialSession));
  const [activeProofIndex, setActiveProofIndex] = useState(0);
  const [completedProofIds, setCompletedProofIds] = useState<string[]>([]);
  const [labInsight, setLabInsight] = useState("");
  const [labSaved, setLabSaved] = useState(false);
  const [activeDeckCardId, setActiveDeckCardId] = useState<string | null>(null);

  const activeSession = plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
  const activeLab =
    plan.labs.find((lab) => lab.slug === activeLabSlug) ??
    plan.labs.find((lab) => lab.title === activeSession.lab) ??
    plan.labs[0];
  const activeWeek = activeSession.week;
  const weekSessions = useMemo(
    () => plan.sessions.filter((session) => session.week === activeWeek),
    [activeWeek, plan.sessions]
  );
  const scene = useMemo(() => buildLabScene(activeSession, activeLab), [activeLab, activeSession]);
  const evidenceDeck = useMemo(
    () =>
      plan.slug === "environment"
        ? getEnvironmentLabDeck(activeLab.slug, activeSession)
        : plan.slug === "economy"
          ? getEconomyLabDeck(activeLab.slug, activeSession)
          : plan.slug === "disaster-management"
            ? getDisasterManagementLabDeck(activeLab.slug, activeSession)
            : plan.slug === "science-tech"
              ? getScienceTechLabDeck(activeLab.slug, activeSession)
              : plan.slug === "polity-governance"
                ? getPolityGovernanceLabDeck(activeLab.slug, activeSession)
                : plan.slug === "internal-security-society"
                  ? getInternalSecuritySocietyLabDeck(activeLab.slug, activeSession)
                  : plan.slug === "history"
                    ? getHistoryLabDeck(activeLab.slug, activeSession)
                    : [],
    [activeLab.slug, activeSession, plan.slug]
  );
  const activeDeckCard =
    evidenceDeck.find((card) => card.id === activeDeckCardId) ?? evidenceDeck[0] ?? null;
  const historyVisualDeck = useMemo(
    () => (plan.slug === "history" ? getHistoryVisualCommandDeck(activeLab.slug, activeSession) : null),
    [activeLab.slug, activeSession, plan.slug]
  );
  const historyMediaStudio = useMemo(
    () => (plan.slug === "history" ? getHistoryMediaStudioDeck(activeLab.slug, activeSession) : null),
    [activeLab.slug, activeSession, plan.slug]
  );
  const proofStages = useMemo(() => buildLabProofStages(activeSession, activeLab, scene), [activeLab, activeSession, scene]);
  const activeProof = proofStages[Math.min(activeProofIndex, proofStages.length - 1)];
  const proofProgress = proofStages.length > 0 ? Math.round((completedProofIds.length / proofStages.length) * 100) : 0;
  const basePath = `/upsc/${plan.slug}`;
  const activeProgress = getDayProgress(activeSession.day);
  const isTalkPassed = isSubjectTalkReadyForMcq(activeProgress);
  const isLabProofComplete = proofStages.length > 0 && completedProofIds.length >= proofStages.length;
  const isLabSavedForActiveMode = Boolean(labSaved || (activeProgress?.labCompleted && activeProgress.labMode === activeLab.slug));
  const isLabReadyForMcq = isTalkPassed && isLabProofComplete && isLabSavedForActiveMode;
  const nextRouteHref = isLabReadyForMcq
    ? `${basePath}/mcq-readiness?day=${activeSession.day}`
    : isTalkPassed
      ? `${basePath}/lab?mode=${activeLab.slug}&day=${activeSession.day}`
    : `${basePath}/talk?day=${activeSession.day}`;
  const nextRouteLabel = isLabReadyForMcq ? "Open MCQ readiness" : isTalkPassed ? "Save lab proof" : "Explain in Talk";
  const nextRouteDetail = isLabReadyForMcq
    ? "Talk command and Lab proof are saved. Fresh MCQ readiness is open."
    : isTalkPassed
      ? "Talk command proof is saved. Save all Lab proof stages before fresh MCQ readiness opens."
    : "Talk command proof is still pending. Save the lab insight, then return to the AI teacher before MCQs.";
  const labCommandSteps = [
    {
      id: "talk",
      label: "Talk",
      value: isTalkPassed ? `${activeProgress?.talkScore ?? 0}%` : "Pending",
      complete: isTalkPassed,
    },
    {
      id: "case",
      label: "Evidence",
      value: activeDeckCard?.category ?? activeLab.title,
      complete: Boolean(activeDeckCard),
    },
    {
      id: "proof",
      label: "Proof",
      value: `${completedProofIds.length}/${proofStages.length}`,
      complete: isLabProofComplete,
    },
    {
      id: "save",
      label: "Save",
      value: isLabSavedForActiveMode ? "Saved" : "Pending",
      complete: isLabSavedForActiveMode,
    },
    {
      id: "route",
      label: "Route",
      value: isLabReadyForMcq ? "MCQ open" : "Locked",
      complete: isLabReadyForMcq,
    },
  ];
  const themeStyle = getSubjectThemeStyle(plan);

  useEffect(() => {
    if (!isLoaded) return;
    const saved = getDayProgress(activeSession.day);
    setLabInsight(saved?.labInsight ?? "");
    setActiveProofIndex(Math.min(Math.max(saved?.labProofIndex ?? 0, 0), proofStages.length - 1));
    setCompletedProofIds(saved?.labProofCompletedIds ?? (saved?.labCompleted ? proofStages.map((stage) => stage.id) : []));
    setLabSaved(Boolean(saved?.labCompleted && saved?.labMode === activeLab.slug));
  }, [activeLab.slug, activeSession.day, getDayProgress, isLoaded, proofStages]);

  useEffect(() => {
    if (evidenceDeck.length === 0) {
      setActiveDeckCardId(null);
      return;
    }

    if (!activeDeckCardId || !evidenceDeck.some((card) => card.id === activeDeckCardId)) {
      setActiveDeckCardId(evidenceDeck[0].id);
    }
  }, [activeDeckCardId, evidenceDeck]);

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), plan.sessions.length);
    const nextSession = plan.sessions.find((session) => session.day === boundedDay) ?? plan.sessions[0];
    const nextLabSlug = getLabSlugForSession(plan, nextSession);
    setActiveDay(boundedDay);
    setActiveLabSlug(nextLabSlug);
    setActiveProofIndex(0);
    setCompletedProofIds([]);
    setLabInsight("");
    setLabSaved(false);
    setActiveDeckCardId(null);
    router.replace(`${basePath}/lab?mode=${nextLabSlug}&day=${boundedDay}`, { scroll: false });
  };

  const selectLab = (slug: string) => {
    setActiveLabSlug(slug);
    setActiveProofIndex(0);
    setCompletedProofIds([]);
    setLabSaved(false);
    setActiveDeckCardId(null);
    router.replace(`${basePath}/lab?mode=${slug}&day=${activeSession.day}`, { scroll: false });
  };

  const selectProofStage = (index: number) => {
    const boundedIndex = Math.min(Math.max(index, 0), proofStages.length - 1);
    setActiveProofIndex(boundedIndex);
    saveDayProgress(activeSession.day, {
      labProofIndex: boundedIndex,
      labProofCompletedIds: completedProofIds,
    });
  };

  const completeActiveProof = () => {
    if (!activeProof) return;
    const nextCompletedProofIds = Array.from(new Set([...completedProofIds, activeProof.id]));
    const nextIndex = Math.min(activeProofIndex + 1, proofStages.length - 1);
    setCompletedProofIds(nextCompletedProofIds);
    setActiveProofIndex(nextIndex);
    setLabSaved(false);
    saveDayProgress(activeSession.day, {
      labProofIndex: nextIndex,
      labProofCompletedIds: nextCompletedProofIds,
      labProofSummary: `${activeProof.title}: ${activeProof.checkpoint}`,
    });
  };

  const markLabComplete = () => {
    const evidenceLine = activeDeckCard
      ? `${activeDeckCard.title}: ${activeDeckCard.anchor}; trap: ${activeDeckCard.examTrap}`
      : scene.anchor;
    const insight = labInsight.trim() || evidenceLine;
    const allProofIds = proofStages.map((stage) => stage.id);
    const nextCompletedProofIds = completedProofIds.length >= proofStages.length ? completedProofIds : allProofIds;
    saveDayProgress(activeSession.day, {
      labCompleted: true,
      labMode: activeLab.slug,
      labInsight: insight,
      labFocus: `${scene.lens}: ${activeDeckCard?.title ?? activeProof?.title ?? "Applied proof"}`,
      labProofIndex: proofStages.length - 1,
      labProofCompletedIds: nextCompletedProofIds,
      labProofSummary: `${activeProof?.title ?? scene.lens}: ${insight}`,
      activePromptLabel: activeLab.title,
    });
    setActiveProofIndex(proofStages.length - 1);
    setCompletedProofIds(nextCompletedProofIds);
    setLabInsight(insight);
    setLabSaved(true);
  };

  return (
    <div
      data-testid="subject-room-shell"
      data-room="lab"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
              <ArrowLeft className="h-4 w-4" /> {plan.title} command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Visual Lab</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day {activeSession.day} applied board</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">{activeSession.chapter}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Lab", activeLab.title],
                ["Lens", scene.lens],
                ["Duration", activeSession.duration],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => selectDay(activeSession.day - 1)}
                disabled={activeSession.day === 1}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" /> Previous day
              </button>
              <button
                type="button"
                onClick={() => selectDay(activeSession.day + 1)}
                disabled={activeSession.day === plan.sessions.length}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Next day <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            data-testid="subject-lab-visual-surface"
            className="relative overflow-hidden rounded-lg border border-[var(--subject-border)] bg-[var(--subject-panel)] p-5 text-white shadow-sm"
            style={{
              background:
                "radial-gradient(circle at 18% 16%, var(--subject-accent-glow), transparent 26%), linear-gradient(135deg, var(--subject-dark), #111827)",
            }}
          >
            <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-light)]">{scene.boardTitle}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{activeLab.title}</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-[var(--subject-light)] ring-1 ring-white/15">
                <activeLab.icon className="h-5 w-5" />
              </div>
            </div>

            <div className="relative min-h-[370px] overflow-hidden rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--subject-light)] opacity-25" />
              <div className="absolute inset-y-8 left-1/2 w-px bg-[var(--subject-light)] opacity-20" />
              <div className="relative grid gap-3 sm:grid-cols-2">
                {scene.nodes.map((node, index) => (
                  <div
                    key={node.label}
                    className={cn(
                      "min-h-28 rounded-md border border-white/10 bg-white/[0.07] p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.11]",
                      index === 0 || index === scene.nodes.length - 1 ? "ring-1 ring-white/25" : ""
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[var(--subject-light)]">{node.label}</p>
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--subject-accent)] text-xs font-black text-white">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-5 text-[#b7d5ca]">{node.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-[#c8ddd5]">{scene.boardDetail}</p>

            {historyVisualDeck ? (
              <div
                data-testid="history-lab-visual-command-deck"
                className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                      History visual command
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-white">{historyVisualDeck.title}</h3>
                    <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-[#c8ddd5]">
                      {historyVisualDeck.subtitle}
                    </p>
                  </div>
                  <span className="inline-flex min-h-9 max-w-full items-center gap-2 break-words rounded-md bg-white/10 px-3 text-xs font-black text-[#dff7ee] ring-1 ring-white/15 sm:shrink-0">
                    <CalendarDays className="h-4 w-4" /> {activeSession.chapter}
                  </span>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-light)]">
                      <MapPinned className="h-4 w-4" /> Visual rail
                    </div>
                    <div className="grid gap-2 md:grid-cols-4">
                      {historyVisualDeck.rails.map((rail, index) => (
                        <div
                          key={`${rail.label}-${index}`}
                          data-testid={`history-lab-visual-rail-${index + 1}`}
                          className="min-h-36 rounded-md border border-white/10 bg-black/20 p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="rounded-md bg-[var(--subject-accent)] px-2 py-1 text-[10px] font-black text-white">
                              {rail.marker}
                            </span>
                            <span className="text-xs font-black text-[var(--subject-light)]">{index + 1}</span>
                          </div>
                          <p className="text-sm font-black leading-5 text-white">{rail.label}</p>
                          <p className="mt-2 text-xs font-semibold leading-5 text-[#b7d5ca]">{rail.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#ef9f27]">
                      <Network className="h-4 w-4" /> Trap clinic
                    </div>
                    <div className="grid gap-2">
                      {historyVisualDeck.trapClinic.map((trap) => (
                        <div key={trap} className="rounded-md bg-[#ef9f27]/15 px-3 py-2 text-xs font-black leading-5 text-[#f5ead8]">
                          {trap}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  data-testid="history-lab-recognition-grid"
                  className="mt-4 grid gap-2 md:grid-cols-3"
                >
                  {historyVisualDeck.recognition.map((item) => (
                    <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.08] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--subject-light)]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-black leading-5 text-white">{item.value}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#b7d5ca]">{item.proof}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-sm font-bold leading-6 text-[#dff7ee]">
                  {historyVisualDeck.prompt}
                </p>
              </div>
            ) : null}

            {historyMediaStudio ? (
              <div
                data-testid="history-lab-media-studio"
                className="mt-5 rounded-lg border border-white/15 bg-black/20 p-4 backdrop-blur"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                      History media studio
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-white">{historyMediaStudio.title}</h3>
                    <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-[#c8ddd5]">
                      {historyMediaStudio.subtitle}
                    </p>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-white/10 px-3 py-2 text-xs font-black text-[#dff7ee] ring-1 ring-white/15 sm:shrink-0">
                    {historyMediaStudio.canvasLabel}
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div
                    data-testid="history-lab-animated-map"
                    className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#07110d] p-4"
                  >
                    <div className="absolute inset-0 opacity-45">
                      <div className="absolute left-[8%] top-[12%] h-[76%] w-[84%] rounded-[42%_48%_50%_40%] border border-white/10 bg-white/[0.03]" />
                      <div
                        className="absolute left-[24%] top-[10%] h-[78%] w-[52%] bg-[var(--subject-accent)] opacity-20"
                        style={{
                          clipPath:
                            "polygon(42% 0%, 57% 8%, 63% 21%, 75% 30%, 70% 45%, 82% 56%, 66% 63%, 60% 78%, 52% 100%, 43% 78%, 31% 72%, 25% 58%, 13% 49%, 22% 36%, 18% 21%, 31% 11%)",
                        }}
                      />
                      <div className="absolute left-[16%] top-[18%] h-px w-[68%] bg-white/10" />
                      <div className="absolute left-[14%] top-[42%] h-px w-[72%] bg-white/10" />
                      <div className="absolute left-[18%] top-[66%] h-px w-[62%] bg-white/10" />
                      <div className="absolute left-[33%] top-[8%] h-[82%] w-px bg-white/10" />
                      <div className="absolute left-[55%] top-[8%] h-[82%] w-px bg-white/10" />
                    </div>

                    <svg className="absolute inset-0 h-full w-full" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline
                        points={historyMediaStudio.mapAnchors.map((anchor) => `${anchor.x},${anchor.y}`).join(" ")}
                        fill="none"
                        stroke="rgba(239,159,39,0.72)"
                        strokeDasharray="2 3"
                        strokeWidth="0.7"
                      />
                    </svg>

                    {historyMediaStudio.mapAnchors.map((anchor, index) => (
                      <div
                        key={`${anchor.label}-${index}`}
                        data-testid={`history-lab-media-anchor-${index + 1}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
                      >
                        <div className="relative">
                          <span className="absolute inset-0 rounded-full bg-[#ef9f27]/45 motion-safe:animate-ping" />
                          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#ef9f27] text-[10px] font-black text-[#13251d] ring-2 ring-white/25">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
                      <div className="max-w-[260px] rounded-md border border-white/10 bg-black/45 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-light)]">
                          Animated canvas
                        </p>
                        <p className="mt-2 text-sm font-black leading-5 text-white">{historyMediaStudio.canvasLabel}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {historyMediaStudio.mapAnchors.slice(0, 4).map((anchor, index) => (
                          <div key={`${anchor.label}-card`} className="rounded-md border border-white/10 bg-black/45 p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ef9f27]">
                              {index + 1}. {anchor.region}
                            </p>
                            <p className="mt-1 text-sm font-black text-white">{anchor.label}</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-[#b7d5ca]">{anchor.clue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div data-testid="history-lab-media-timeline" className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-light)]">
                        <CalendarDays className="h-4 w-4" /> Animated timeline
                      </div>
                      <div className="relative grid gap-3 md:grid-cols-4">
                        <div className="pointer-events-none absolute left-6 right-6 top-5 hidden h-px bg-[#ef9f27]/45 md:block" />
                        {historyMediaStudio.timeline.map((item, index) => (
                          <div key={`${item.marker}-${index}`} className="relative rounded-md border border-white/10 bg-black/25 p-3">
                            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#ef9f27] text-[10px] font-black text-[#13251d]">
                              {index + 1}
                            </span>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--subject-light)]">{item.marker}</p>
                            <p className="mt-2 text-sm font-black leading-5 text-white">{item.label}</p>
                            <p className="mt-2 text-xs font-semibold leading-5 text-[#b7d5ca]">{item.cue}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div data-testid="history-lab-media-recognition" className="grid gap-2 md:grid-cols-3">
                      {historyMediaStudio.recognitionTargets.map((target) => (
                        <div key={target.label} className="min-h-32 rounded-lg border border-white/10 bg-white/[0.07] p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ef9f27]">Recognition cue</p>
                          <p className="mt-2 text-sm font-black leading-5 text-white">{target.label}</p>
                          <p className="mt-2 text-xs font-semibold leading-5 text-[#b7d5ca]">{target.cue}</p>
                          <p className="mt-2 rounded-md bg-black/25 p-2 text-xs font-bold leading-5 text-[#dff7ee]">{target.check}</p>
                        </div>
                      ))}
                    </div>

                    <p className="rounded-lg border border-[#ef9f27]/30 bg-[#ef9f27]/15 p-3 text-sm font-bold leading-6 text-[#f5ead8]">
                      {historyMediaStudio.motionCue}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              data-testid={plan.slug === "environment" ? "environment-lab-command-board" : "subject-lab-command-board"}
              className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur"
            >
              <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                    Lab command board
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                    Evidence to MCQ route
                  </h3>
                </div>
                <span
                  data-testid="subject-lab-route-status"
                  className={cn(
                    "max-w-full break-words rounded-md px-3 py-2 text-xs font-black ring-1 sm:shrink-0",
                    isLabReadyForMcq
                      ? "bg-[var(--subject-light)] text-[var(--subject-dark)] ring-white/40"
                      : "bg-white/10 text-[#f5ead8] ring-white/15"
                  )}
                >
                  {isLabReadyForMcq ? "MCQ open" : "MCQ locked"}
                </span>
              </div>

              <div className="relative grid gap-3 md:grid-cols-5">
                <div className="pointer-events-none absolute left-8 right-8 top-6 hidden h-px bg-[var(--subject-light)] opacity-25 md:block" />
                {labCommandSteps.map((step, index) => {
                  const isActive = !step.complete && labCommandSteps.slice(0, index).every((item) => item.complete);
                  return (
                    <div
                      key={step.id}
                      data-testid={`subject-lab-command-${step.id}`}
                      className={cn(
                        "relative min-h-28 rounded-md border p-3 transition",
                        step.complete
                          ? "border-white/20 bg-white/15 text-white"
                          : "border-white/10 bg-black/20 text-[#d1e3dc]"
                      )}
                    >
                      <span
                        className={cn(
                          "mb-3 flex h-8 w-8 items-center justify-center rounded-md text-xs font-black ring-1",
                          step.complete
                            ? "bg-[var(--subject-accent)] text-white ring-white/30"
                            : isActive
                              ? "bg-[#ef9f27] text-[var(--subject-dark)] ring-[#ef9f27]/40 motion-safe:animate-pulse"
                              : "bg-white/10 text-[#c8ddd5] ring-white/15"
                        )}
                      >
                        {step.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-light)]">
                        {step.label}
                      </p>
                      <p className="mt-2 break-words text-sm font-black leading-5">{step.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              data-testid="subject-lab-proof-engine"
              className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur"
            >
              <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                    Applied proof engine
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                    {`${activeProofIndex + 1}. ${activeProof?.title ?? "Proof stage"}`}
                  </h3>
                </div>
                <span className="max-w-full break-words rounded-md bg-white/10 px-3 py-2 text-xs font-black text-[#dff7ee] ring-1 ring-white/15 sm:shrink-0">
                  {completedProofIds.length}/{proofStages.length} proof stages
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-md bg-black/20 p-3 ring-1 ring-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                    Student proof prompt
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#dce8e2]">{activeProof?.prompt}</p>
                </div>
                <div className="rounded-md bg-black/20 p-3 ring-1 ring-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef9f27]">Checkpoint</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#f5ead8]">{activeProof?.checkpoint}</p>
                </div>
              </div>

              <p className="mt-3 rounded-md bg-white/10 p-3 text-sm font-bold leading-6 text-[#c8ddd5]">
                {activeProof?.proofSignal}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#ef9f27]" style={{ width: `${proofProgress}%` }} />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => selectProofStage(activeProofIndex - 1)}
                  disabled={activeProofIndex === 0}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous proof
                </button>
                <button
                  type="button"
                  data-testid="subject-lab-proof-complete"
                  onClick={completeActiveProof}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#ef9f27] px-3 text-xs font-black text-[var(--subject-dark)] transition hover:bg-[#f3b956] sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4" /> Complete proof
                </button>
                <button
                  type="button"
                  onClick={() => selectProofStage(activeProofIndex + 1)}
                  disabled={activeProofIndex === proofStages.length - 1}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  Next proof <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Lab modes</p>
                <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Switch the visual lens</h2>
              </div>
              <Layers3 className="h-6 w-6 text-[var(--subject-dark)]" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {plan.labs.map((lab) => {
                const isActive = activeLab.slug === lab.slug;
                return (
                  <button
                    key={lab.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectLab(lab.slug)}
                    className={cn(
                      "min-h-24 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                        : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
                    )}
                  >
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-white/75 text-[var(--subject-dark)]">
                      <lab.icon className="h-4 w-4" />
                    </span>
                    <span className="block text-sm font-black leading-5">{lab.title}</span>
                    <span className="mt-2 block text-xs font-semibold leading-5 opacity-75">{lab.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--subject-heading)]">Lab drill</p>
                  <p className="text-xs font-semibold text-[#746f66]">{scene.anchor}</p>
                </div>
              </div>

              <div data-testid="subject-lab-proof-list" className="mb-5 grid gap-2 sm:grid-cols-5">
                {proofStages.map((stage, index) => {
                  const isActive = activeProof?.id === stage.id;
                  const isComplete = completedProofIds.includes(stage.id);
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => selectProofStage(index)}
                      className={cn(
                        "min-h-24 rounded-md border p-3 text-left transition",
                        isActive
                          ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                          : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
                      )}
                    >
                      <span className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                        Proof {index + 1}
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </span>
                      <span className="block text-sm font-black leading-5">{stage.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3">
                {scene.drill.map((item, index) => (
                  <div key={item} className="grid grid-cols-[36px_1fr] gap-3 rounded-md bg-[var(--subject-bg)] p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--subject-accent)] text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-[#34453b]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {evidenceDeck.length > 0 && activeDeckCard ? (
              <div
                data-testid={plan.slug === "environment" ? "environment-lab-evidence-deck" : `${plan.slug}-lab-evidence-deck`}
                className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
                      {plan.title} evidence deck
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                      Pick one case for the proof
                    </h2>
                  </div>
                  <span className="rounded-md bg-[var(--subject-light)] px-3 py-2 text-xs font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)]">
                    {activeDeckCard.category}
                  </span>
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {evidenceDeck.map((card) => {
                    const isActive = activeDeckCard.id === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        data-testid={`${plan.slug}-lab-evidence-card-${card.id}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          setActiveDeckCardId(card.id);
                          setLabSaved(false);
                        }}
                        className={cn(
                          "min-h-28 rounded-md border p-3 text-left transition",
                          isActive
                            ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                            : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
                        )}
                      >
                        <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-75">
                          {card.category}
                        </span>
                        <span className="mt-2 block text-sm font-black leading-5">{card.title}</span>
                        <span className="mt-2 block text-xs font-semibold leading-5 opacity-75">{card.anchor}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  data-testid={plan.slug === "environment" ? "environment-lab-selected-evidence" : `${plan.slug}-lab-selected-evidence`}
                  className="rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">
                    Selected evidence
                  </p>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-[var(--subject-heading)]">{activeDeckCard.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">{activeDeckCard.detail}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md bg-white/75 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a6a16]">
                        UPSC trap
                      </p>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#6f4a12]">{activeDeckCard.examTrap}</p>
                    </div>
                    <div className="rounded-md bg-white/75 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-dark)]">
                        Proof hint
                      </p>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#345d52]">{activeDeckCard.proofHint}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div data-testid="lab-completion-panel" className="rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Lab completion</p>
                  <h3 className="mt-1 text-lg font-black text-[var(--subject-heading)]">Save the visual insight</h3>
                  <p data-testid="lab-next-route-status" className="mt-2 text-xs font-bold leading-5 text-[#49675e]">
                    {nextRouteDetail}
                  </p>
                </div>
                {labSaved ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 py-2 text-xs font-black text-white">
                    <CheckCircle2 className="h-4 w-4" /> Lab saved locally
                  </span>
                ) : null}
              </div>
              <div
                data-testid="subject-lab-proof-status"
                className="mb-3 rounded-md border border-[var(--subject-accent)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-dark)]"
              >
                Applied proof progress {completedProofIds.length}/{proofStages.length}
              </div>
              <textarea
                value={labInsight}
                onChange={(event) => {
                  setLabInsight(event.target.value);
                  setLabSaved(false);
                }}
                rows={4}
                placeholder="Write the concept, case, map point, or UPSC trap you can now explain."
                className="w-full resize-none rounded-md border border-[var(--subject-border)] bg-white px-3 py-2 text-sm font-semibold leading-6 text-[var(--subject-heading)] outline-none transition placeholder:text-[#8d8579] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={markLabComplete}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                >
                  <ClipboardCheck className="h-4 w-4" /> Mark lab complete
                </button>
                <Link
                  data-testid="lab-primary-route"
                  href={nextRouteHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)]"
                >
                  {isTalkPassed ? <ClipboardCheck className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                  {nextRouteLabel}
                </Link>
                <Link
                  href={`${basePath}/mcq-readiness?day=${activeSession.day}`}
                  aria-disabled={!isLabReadyForMcq}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-black transition",
                    isLabReadyForMcq
                      ? "border-[var(--subject-border)] bg-white text-[var(--subject-dark)] hover:bg-[var(--subject-light)]"
                      : "pointer-events-none border-[#dcd5c7] bg-[#f7f4ee] text-[#8a8174]"
                  )}
                >
                  <ClipboardCheck className="h-4 w-4" /> MCQ readiness
                </Link>
              </div>
            </div>

            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="lab" />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Week {activeSession.week}</p>
              <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Lab playlist</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-[var(--subject-dark)]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {weekSessions.map((session) => {
              const isActive = activeSession.day === session.day;
              return (
                <button
                  key={session.day}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectDay(session.day)}
                  className={cn(
                    "min-h-24 rounded-md border p-3 text-left transition",
                    isActive
                      ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                      : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
                  )}
                >
                  <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em]">
                    Day {session.day}
                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />}
                  </span>
                  <span className="block text-sm font-bold leading-5">{session.title}</span>
                  <span className="mt-2 block text-xs font-semibold opacity-75">{session.lab}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
