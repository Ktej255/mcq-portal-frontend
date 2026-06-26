/* ------------------------------------------------------------------ */
/* GS Subject Detail Data — Comprehensive content for all 9 GS subjects */
/* Used by /subjects/[slug]/page.tsx for the enriched subject pages    */
/* ------------------------------------------------------------------ */

export interface GsSubjectDetail {
  slug: string;
  name: string;
  overview: string;
  syllabus: string[];
  strategy: string[];
  books: { title: string; author: string; why: string }[];
  pyqTrend: { insight: string; frequency: string };
}

export const gsSubjectDetails: GsSubjectDetail[] = [
  // ──────────────────────────────────────────────────────────────────
  // 1. GEOGRAPHY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "geography",
    name: "Indian & World Geography",
    overview:
      "Geography is one of the highest-scoring subjects in UPSC Prelims, consistently contributing 15–20 questions in GS Paper I. It spans physical geography (geomorphology, climatology, oceanography), Indian geography (physiography, drainage, resources) and world geography (continents, mapping). The subject rewards visual learners — maps, diagrams and spatial reasoning are tested frequently. For Mains, geography appears in GS-I (physical, social, economic geography of India and the world) and GS-III (land resources, agriculture, infrastructure).",
    syllabus: [
      "Salient features of world's physical geography",
      "Distribution of key natural resources across the world (including South Asia and the Indian subcontinent)",
      "Factors responsible for the location of primary, secondary and tertiary sector industries",
      "Important geophysical phenomena such as earthquakes, tsunami, volcanic activity, cyclone etc.",
      "Geographical features and their location — changes in critical geographical features (water-bodies, ice-caps) and in flora and fauna and effects of such changes",
      "Indian physiography — the Himalayan system, peninsular plateau, coastal plains, islands",
      "Drainage systems — Himalayan and peninsular rivers, lakes",
      "Climate of India — monsoon mechanism, rainfall distribution, climatic regions",
      "Natural vegetation and soil types",
      "Mineral and energy resources — distribution and conservation",
      "Agriculture — types, cropping patterns, irrigation, land reforms",
      "Industrial geography — location factors, major industrial regions",
      "Transport and communication networks",
      "Population distribution, density and growth — urbanisation trends",
    ],
    strategy: [
      "Start with NCERT textbooks from Class 6 to 12 (especially Class 11 Fundamentals of Physical Geography and India: Physical Environment). These build foundational understanding of concepts like plate tectonics, pressure belts, ocean currents, and Indian physiography that UPSC tests directly. Follow NCERTs with GC Leong for world physical geography — read it chapter by chapter, making notes of key terms.",
      "Geography is a map-heavy subject. Maintain a dedicated atlas (Orient Blackswan or Oxford) and mark every location, river, mountain pass, national park and industrial region as you study. UPSC frequently asks map-based match-the-following questions. Practice plotting at least 5 locations daily. For Indian geography, the India Year Book and Economic Survey supplement your understanding of resource distribution and recent developments.",
      "For Prelims, solve previous year questions topic-wise after finishing each chapter — you'll notice that UPSC repeats conceptual patterns (not exact questions). For Mains, focus on linking geography to current issues: climate change, urbanisation, disaster vulnerability, agricultural distress. Write 2–3 answers per week connecting static concepts to current developments.",
    ],
    books: [
      { title: "Certificate Physical and Human Geography", author: "GC Leong", why: "The standard reference for world physical geography — covers geomorphology, climatology and oceanography comprehensively." },
      { title: "NCERT Geography (Class 6–12)", author: "NCERT", why: "Foundation-building textbooks. Class 11–12 are essential; Class 6–10 provide basics that UPSC tests directly." },
      { title: "India: Physical Environment (Class 11 NCERT)", author: "NCERT", why: "Dedicated coverage of Indian physiography, climate, drainage and natural vegetation." },
      { title: "Oxford School Atlas", author: "Oxford University Press", why: "Detailed maps essential for location-based questions and spatial understanding." },
      { title: "Indian Geography", author: "Majid Husain", why: "Comprehensive treatment of Indian economic and human geography with exam-focused data." },
    ],
    pyqTrend: {
      insight: "Geography contributes 15–20 questions in Prelims GS Paper I consistently. Physical geography (geomorphology, climatology) and Indian physiography are the most tested areas. Map-based questions on rivers, passes, national parks and tribal areas appear every year. Climate and monsoon questions have increased post-2020. In Mains GS-I, one full question on geographical features is guaranteed.",
      frequency: "15–20 questions in Prelims yearly; 2–3 questions in Mains GS-I and GS-III",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 2. POLITY & GOVERNANCE
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "polity",
    name: "Indian Polity & Governance",
    overview:
      "Indian Polity is the single highest-scoring static subject in UPSC Prelims, contributing 18–22 questions annually. It covers the Constitution of India, political system, governance mechanisms, Panchayati Raj, public policy and rights issues. For Mains, Polity dominates GS-II (governance, Constitution, polity, social justice and international relations). The subject is predictable and high-yield — a strong polity preparation can single-handedly secure your Prelims cutoff.",
    syllabus: [
      "Indian Constitution — historical underpinnings, evolution, features, amendments, significant provisions and basic structure",
      "Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure",
      "Devolution of powers and finances up to local levels and challenges therein",
      "Separation of powers between various organs, dispute redressal mechanisms and institutions",
      "Comparison of the Indian constitutional scheme with that of other countries",
      "Parliament and State legislatures — structure, functioning, conduct of business, powers & privileges",
      "Structure, organisation and functioning of the Executive and the Judiciary",
      "Ministries and Departments of the Government; pressure groups and formal/informal associations",
      "Representation of People's Act — salient features",
      "Appointment to various Constitutional posts, powers, functions and responsibilities",
      "Statutory, regulatory and various quasi-judicial bodies",
      "Government policies and interventions for development in various sectors and issues arising out of their design and implementation",
      "Development processes and the development industry — the role of NGOs, SHGs, various groups and associations",
      "Welfare schemes for vulnerable sections of the population",
      "Issues relating to governance, transparency and accountability — citizens' charters, transparency & accountability, institutional and other measures",
      "Role of civil services in a democracy",
    ],
    strategy: [
      "M. Laxmikanth's Indian Polity is the undisputed bible for this subject. Read it cover to cover — do not skip any chapter. UPSC draws questions directly from Laxmikanth, including obscure provisions like Article 371 variants, schedules, and constitutional body compositions. Read the book at least twice: first for understanding, second for retention of specific articles and amendments.",
      "Supplement Laxmikanth with the original Constitution text for key parts (Part III — Fundamental Rights, Part IV — DPSPs, Part IX — Panchayats, Part IXA — Municipalities). Follow landmark Supreme Court judgments (Kesavananda Bharati, SR Bommai, Vishakha, Navtej Johar) as UPSC loves testing constitutional interpretation. For governance topics, read the 2nd ARC reports selectively — especially on ethics, e-governance, citizen-centric administration and local governance.",
      "Polity is a revision-heavy subject because of the sheer volume of articles, amendments and institutional details. Create a personal comparison chart (Governor vs President, Lok Sabha vs Rajya Sabha, Constitutional vs Statutory bodies). Solve Prelims PYQs after each chapter — you will notice UPSC tests the same concepts with different framing. For Mains, practice writing answers connecting constitutional provisions to current governance issues (judicial appointments, Governor's role, federalism debates).",
    ],
    books: [
      { title: "Indian Polity", author: "M. Laxmikanth", why: "The single most important book for UPSC Polity — covers every constitutional provision, institution and governance concept tested in the exam." },
      { title: "Introduction to the Constitution of India", author: "DD Basu", why: "A more legalistic reference for understanding constitutional provisions in depth — useful for Mains answer enrichment." },
      { title: "NCERT Political Science (Class 11–12)", author: "NCERT", why: "Indian Constitution at Work and Political Theory provide exam-relevant basics with simple explanations." },
      { title: "Governance in India", author: "Laxmikanth", why: "Focused coverage of governance, public policy and administration topics relevant to GS-II Mains." },
      { title: "The Hindu / Indian Express editorials", author: "Daily newspapers", why: "Critical for linking static polity concepts to current governance debates (judicial independence, federalism, election reforms)." },
    ],
    pyqTrend: {
      insight: "Polity is the most heavily tested static subject in Prelims with 18–22 questions yearly. Constitutional bodies, fundamental rights, amendment provisions and parliamentary procedures are perennial favourites. Post-2019, governance and accountability questions have increased. In Mains GS-II, expect 4–5 questions on polity, governance and social justice combined.",
      frequency: "18–22 questions in Prelims yearly; 4–5 questions in Mains GS-II",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 3. ECONOMY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "economy",
    name: "Economic & Social Development",
    overview:
      "Economy is a dynamic subject in UPSC that blends static macroeconomic concepts with evolving current affairs. It contributes 12–18 questions in Prelims and is central to GS-III Mains (economic development, growth, inclusion). Topics range from monetary and fiscal policy to agriculture, infrastructure, external trade and social sector schemes. The Economic Survey and Union Budget are goldmines for factual questions. Economy rewards candidates who connect theoretical concepts to India's real economic indicators and policy decisions.",
    syllabus: [
      "Indian Economy and issues relating to planning, mobilisation of resources, growth, development and employment",
      "Inclusive growth and issues arising from it",
      "Government budgeting — Union Budget, fiscal policy, taxation (GST), fiscal deficit concepts",
      "Money and banking — RBI functions, monetary policy, inflation targeting, financial inclusion",
      "Effects of liberalisation on the economy, changes in industrial policy and their effects on industrial growth",
      "Infrastructure — energy, ports, roads, airports, railways etc.",
      "Investment models — PPP, FDI policy, bilateral investment treaties",
      "Agriculture — MSP, procurement, food processing, e-technology in agriculture",
      "Food processing and related industries in India — scope, significance, location, upstream and downstream requirements",
      "Issues related to direct and indirect farm subsidies and minimum support prices",
      "Public Distribution System — objectives, functioning, limitations, revamping",
      "Issues of buffer stocks and food security",
      "Technology missions and economics of animal-rearing",
      "Major crops, cropping patterns, irrigation types and systems, agricultural produce storage and marketing",
      "Land reforms in India",
      "External sector — balance of payments, exchange rate, trade policy, WTO",
      "Social sector — health, education, human development, poverty and inequality",
    ],
    strategy: [
      "Begin with NCERT Economics (Class 11–12: Indian Economic Development and Macroeconomics). These build the conceptual scaffolding — GDP, national income accounting, money supply, banking, fiscal and monetary policy. Follow with Ramesh Singh's Indian Economy, which is the standard reference for UPSC economy. Read it section by section, making notes of definitions, committees, and data points that UPSC loves to test.",
      "The Economic Survey (released before the Budget) is essential reading. Focus on Volume 1 chapters that discuss growth outlook, employment, agriculture and social indicators. The Budget speech gives you data on fiscal deficit, tax revenues, allocation priorities and new schemes — all heavily tested in Prelims. For banking and monetary policy, follow RBI's monetary policy statements and understand tools like repo rate, CRR, SLR, OMO and LAF.",
      "Economy is a subject where current affairs and static portions blend seamlessly. Every week, read about 2–3 economic developments (RBI decisions, trade data, new schemes) and connect them to static concepts. For Mains GS-III, practice answer writing on topics like inclusive growth, agrarian distress, GST impact, and disinvestment policy. Use data from the Economic Survey to strengthen your answers — UPSC values evidence-based writing in economy questions.",
    ],
    books: [
      { title: "Indian Economy", author: "Ramesh Singh", why: "The most comprehensive economy book for UPSC — covers macro, micro, agriculture, industry, banking and external sector with exam focus." },
      { title: "NCERT Economics (Class 11–12)", author: "NCERT", why: "Indian Economic Development and Macroeconomics build strong fundamentals tested directly in Prelims." },
      { title: "Economic Survey (latest year)", author: "Ministry of Finance", why: "Essential for data, analysis and government's economic perspective — directly questioned in Prelims and Mains." },
      { title: "Indian Economy: Key Concepts", author: "Sankarganesh Karuppiah", why: "A revision-friendly book that organises economy concepts in an exam-oriented format." },
      { title: "Mrunal.org Economy lectures", author: "Mrunal Patel", why: "Free online resource that simplifies complex economic concepts with UPSC-specific examples." },
    ],
    pyqTrend: {
      insight: "Economy contributes 12–18 questions in Prelims with significant year-to-year variation. Banking, monetary policy and agriculture are the most consistent areas. Post-GST, taxation questions have become more conceptual. Budget and Economic Survey facts are tested every year. In Mains GS-III, economy questions demand data-backed answers on growth, inclusion and reform.",
      frequency: "12–18 questions in Prelims yearly; 3–4 questions in Mains GS-III",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 4. HISTORY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "history",
    name: "History of India & Indian National Movement",
    overview:
      "History for UPSC spans three broad eras: Ancient India, Medieval India and Modern India (including the Indian National Movement). In Prelims, history contributes 12–16 questions with Modern History and Art & Culture being the most tested segments. For Mains GS-I, history questions require analytical answers linking events to their socio-economic context. The Freedom Movement, socio-religious reform movements, and post-independence consolidation are high-priority areas. Art and Culture — architecture, dance, music, literature — adds another 4–6 Prelims questions annually.",
    syllabus: [
      "Indian culture — salient aspects of Art Forms, Literature and Architecture from ancient to modern times",
      "Modern Indian history from about the mid-eighteenth century until the present — significant events, personalities, issues",
      "The Freedom Struggle — its various stages and important contributors/contributions from different parts of the country",
      "Post-independence consolidation and reorganisation within the country",
      "History of the world — events from 18th century: industrial revolution, world wars, redrawing of national boundaries, colonisation, decolonisation",
      "Political philosophies like communism, capitalism, socialism etc. — their forms and effect on the society",
      "Salient features of Indian society, diversity of India",
      "Role of women and women's organisations, population and associated issues",
      "Effects of globalisation on Indian society",
      "Social empowerment, communalism, regionalism & secularism",
    ],
    strategy: [
      "For Ancient and Medieval History, NCERTs (Class 6: Our Pasts I, Class 7: Our Pasts II, Class 11: Themes in Indian History Part I & II) provide the foundation. Supplement with RS Sharma (Ancient India) for Prelims-level facts on Indus Valley, Vedic period, Mauryas, Guptas, and South Indian dynasties. Medieval history requires understanding of Delhi Sultanate, Mughal administration, Bhakti-Sufi movements and regional kingdoms — Satish Chandra is the reference here.",
      "Modern History is the most important segment. Spectrum's Brief History of Modern India is the gold standard — read it twice. Focus on the chronology of the National Movement (1757–1947), socio-religious reform movements (Brahmo Samaj, Arya Samaj, etc.), revolutionary movements, and the role of various organisations (Congress sessions, Muslim League, tribal revolts). UPSC loves testing the sequence of events, the contributions of lesser-known leaders and the ideological differences between moderates, extremists and revolutionaries.",
      "Art and Culture requires a dedicated effort — use Nitin Singhania's book which covers architecture, painting, dance, music, literature and festivals in an exam-friendly format. For World History, Norman Lowe is sufficient for understanding the industrial revolution, world wars, cold war and decolonisation. In Mains, history answers must go beyond chronology — analyse causes, consequences and connect to current socio-political themes.",
    ],
    books: [
      { title: "A Brief History of Modern India", author: "Rajiv Ahir (Spectrum)", why: "The most trusted book for Modern Indian History and the Freedom Movement — covers 1757 to 1947 comprehensively." },
      { title: "India's Ancient Past", author: "RS Sharma", why: "Concise coverage of Ancient Indian history from pre-historic to the Gupta period with exam-relevant details." },
      { title: "History of Medieval India", author: "Satish Chandra", why: "Standard reference for Delhi Sultanate, Mughals and regional kingdoms — detailed yet exam-focused." },
      { title: "Indian Art and Culture", author: "Nitin Singhania", why: "The go-to book for Art & Culture — architecture, dance forms, painting schools, literature and UNESCO sites." },
      { title: "NCERT History (Class 6–12)", author: "NCERT", why: "Essential foundation — especially Class 12 Themes in Indian History Part III for Modern India." },
    ],
    pyqTrend: {
      insight: "History + Art & Culture together contribute 14–18 questions in Prelims. Modern History (especially Freedom Movement phases, Governor-Generals, Acts) gives 6–8 questions. Art & Culture (dance, architecture, UNESCO heritage) gives 4–6 questions. Ancient and Medieval combined give 4–6 questions. In Mains GS-I, expect 2–3 analytical questions on socio-cultural movements and post-independence history.",
      frequency: "14–18 questions in Prelims yearly; 2–3 questions in Mains GS-I",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 5. ENVIRONMENT, ECOLOGY & BIODIVERSITY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "environment",
    name: "Environment, Ecology & Biodiversity",
    overview:
      "Environment & Ecology has become one of the most important subjects in UPSC Prelims, contributing 10–15 questions annually. The subject covers ecology fundamentals (food chains, biomes, biogeochemical cycles), biodiversity (species conservation, protected areas, IUCN classifications), environmental pollution, climate change, international environmental conventions, and environmental legislation. It uniquely blends static ecology concepts with current affairs — new species discoveries, environmental judgments, COP outcomes and government environmental schemes are tested every year.",
    syllabus: [
      "Conservation, environmental pollution and degradation, environmental impact assessment",
      "Biodiversity and its conservation — hotspots, threatened species, national parks, sanctuaries, biosphere reserves",
      "Environmental ecology, bio-diversity and Climate Change — general issues not requiring subject specialisation",
      "Ecology fundamentals — ecosystems, food chains, ecological pyramids, biogeochemical cycles, ecological succession",
      "Biomes of the world and vegetation types",
      "Wildlife conservation — Project Tiger, Project Elephant, species recovery programmes",
      "Environmental legislation — Environment Protection Act, Forest Conservation Act, Wildlife Protection Act, NGT",
      "International agreements — UNFCCC, Kyoto Protocol, Paris Agreement, CBD, CITES, Ramsar Convention, CMS",
      "Climate change — causes, impacts, mitigation, adaptation, India's NDCs, IPCC reports",
      "Pollution — air, water, soil, noise, plastic; causes, effects and remedial measures",
      "Solid waste management, e-waste, biomedical waste",
      "Government environmental schemes and missions — NAPCC, Green India Mission, FAME, Jal Jeevan Mission",
      "Forest types of India, mangrove ecosystems, coral reefs, wetlands",
      "Renewable energy — solar, wind, hydrogen; India's energy transition targets",
    ],
    strategy: [
      "Start with Shankar IAS Environment book — it is the single most important resource for this subject. It covers ecology basics, biodiversity, pollution, climate change and conventions in an exam-oriented format. Read it thoroughly and make short notes. Supplement the biodiversity section with the India State of Forest Report and WWF/IUCN updates for recent additions to the Red List. For ecology fundamentals, Odum's Fundamentals of Ecology is authoritative but Shankar IAS covers enough for the exam.",
      "Environment is a highly current-affairs-dependent subject. Every year, UPSC tests recent developments: new Ramsar sites, species in news, COP outcomes (COP28/29 decisions on loss and damage fund, global stocktake), new environmental legislation or amendments, and Supreme Court environment-related judgments. Maintain a running list of species in news, new protected areas, and international environmental developments throughout your preparation year.",
      "For Prelims, focus on factual recall — which species is in which IUCN category, which convention covers what, specific features of national parks and biosphere reserves. For Mains GS-III, practice analytical answers on climate change policy, renewable energy transition, environmental vs development trade-offs, and India's role in global environmental governance. Use case studies (Western Ghats, Ken-Betwa link, Great Nicobar project) to enrich your answers.",
    ],
    books: [
      { title: "Environment", author: "Shankar IAS", why: "The most popular and comprehensive environment book for UPSC — covers ecology, biodiversity, pollution and conventions in exam format." },
      { title: "NCERT Biology (Class 12) — Ecology chapters", author: "NCERT", why: "Chapters 13–16 on organisms, ecosystems, biodiversity and environmental issues build the scientific foundation." },
      { title: "India State of Forest Report", author: "Forest Survey of India", why: "Essential for forest cover data, mangrove status and recent changes — factual questions appear from this report." },
      { title: "Down to Earth Magazine", author: "CSE (Centre for Science and Environment)", why: "Excellent for environment current affairs — species, pollution, policy and international developments in exam-friendly language." },
      { title: "NIOS Environment Study Material", author: "NIOS", why: "Free, concise and exam-relevant coverage of environmental science fundamentals." },
    ],
    pyqTrend: {
      insight: "Environment contributes 10–15 questions in Prelims with an upward trend since 2015. Biodiversity (species, protected areas, IUCN status) is the most tested area with 4–6 questions yearly. International conventions (especially CITES, Ramsar, CMS) give 2–3 questions. Pollution and climate change together give 3–4 questions. In Mains GS-III, environment gets 2–3 dedicated questions, often requiring policy analysis.",
      frequency: "10–15 questions in Prelims yearly; 2–3 questions in Mains GS-III",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 6. SCIENCE & TECHNOLOGY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "science-tech",
    name: "General Science & Technology",
    overview:
      "Science & Technology is a dynamic, current-affairs-heavy subject contributing 8–12 questions in Prelims. Unlike other subjects, Sci-Tech has no fixed textbook syllabus — UPSC tests awareness of recent developments in space, defence, biotechnology, IT, nanotechnology, health and emerging technologies. The static component covers basics of physics, chemistry and biology relevant to everyday phenomena. For Mains GS-III, S&T questions focus on achievements of Indians in science, new technologies, IPR, and the relationship between science and society.",
    syllabus: [
      "Awareness in the fields of IT, Space, Computers, Robotics, Nano-technology, Bio-technology and issues relating to intellectual property rights",
      "Science and Technology — developments and their applications and effects in everyday life",
      "Achievements of Indians in science & technology; indigenisation of technology and developing new technology",
      "Space technology — ISRO missions, satellite types, launch vehicles, space exploration",
      "Defence technology — missiles, aircraft, naval systems, DRDO developments",
      "Biotechnology — genetic engineering, GM crops, gene therapy, CRISPR, biosafety",
      "Information technology — AI, blockchain, quantum computing, cybersecurity, 5G/6G",
      "Nuclear technology — reactors, India's nuclear programme, thorium cycle",
      "Health and medicine — vaccines, diseases, drug development, digital health",
      "Nanotechnology and its applications",
      "Robotics and automation",
      "Intellectual Property Rights — patents, copyrights, GI tags, TRIPS",
      "Science in news — Nobel prizes, recent discoveries, missions",
    ],
    strategy: [
      "Science & Technology has no single standard textbook — it is primarily a current-affairs-driven subject. Start by building a basic science foundation from NCERT Science (Class 9–10) and selectively from Class 11–12 Biology (genetics, evolution, health). This gives you the vocabulary to understand news developments. For space and defence, maintain a running document tracking ISRO launches, satellite types (communication, navigation, earth observation) and DRDO missile systems.",
      "Your primary preparation tool is regular reading of science news. Follow ISRO updates, DST press releases, and science sections of The Hindu and Indian Express. The monthly compilation of Science Reporter (CSIR publication) is excellent for recent developments. For Prelims, focus on factual recall: which satellite does what, difference between types of missiles, basic biotechnology terms (CRISPR, gene drive, mRNA), and India-specific achievements.",
      "For Mains GS-III, S&T questions are analytical — discuss implications of a technology for society, ethics of GM crops, India's digital infrastructure challenges, or the role of science in governance. Practice 2–3 answers monthly on topics like: AI regulation, space commercialisation, vaccine development ecosystem in India, cyber security challenges, and technology transfer. Connect technology developments to governance and social welfare for higher marks.",
    ],
    books: [
      { title: "Science and Technology", author: "Ravi P. Agrahari", why: "Comprehensive coverage of static and current S&T topics in an exam-oriented format." },
      { title: "NCERT Science (Class 9–10)", author: "NCERT", why: "Builds the basic science vocabulary needed to understand advanced topics in the news." },
      { title: "Science Reporter Magazine", author: "CSIR-NISCAIR", why: "Monthly magazine covering Indian science developments — excellent for current S&T affairs." },
      { title: "NCERT Biology (Class 11–12)", author: "NCERT", why: "Chapters on biotechnology, genetics and human health provide the foundation for biotech questions." },
      { title: "The Hindu Science section", author: "The Hindu", why: "Regular reading of science news is the single most effective strategy for this subject." },
    ],
    pyqTrend: {
      insight: "S&T contributes 8–12 questions in Prelims with high unpredictability. Space (ISRO missions, satellite applications) gives 2–3 questions yearly. Biotechnology and health questions have surged post-COVID. Defence technology and nuclear energy appear intermittently. In Mains GS-III, 2–3 questions on S&T applications and achievements are standard. The subject heavily rewards regular news reading over textbook study.",
      frequency: "8–12 questions in Prelims yearly; 2–3 questions in Mains GS-III",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 7. DISASTER MANAGEMENT
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "disaster-management",
    name: "Disaster Management",
    overview:
      "Disaster Management is a focused GS-III Mains topic that covers the full cycle of disaster preparedness, mitigation, response and recovery. While it appears less frequently in Prelims (2–4 questions), it is a guaranteed 1–2 question topic in Mains GS-III. The subject covers natural disasters (earthquakes, cyclones, floods, landslides, droughts), man-made disasters (industrial, nuclear, chemical), India's institutional framework (NDMA, NDRF, SDMA), international frameworks (Sendai Framework) and the role of technology and community in disaster resilience.",
    syllabus: [
      "Disaster and disaster management — types, causes, consequences",
      "Natural disasters — earthquakes, tsunamis, cyclones, floods, droughts, landslides, avalanches, volcanic eruptions",
      "Man-made disasters — industrial, chemical, biological, nuclear, radiological",
      "National Disaster Management Authority (NDMA) — structure, role, guidelines",
      "National Disaster Response Force (NDRF) — deployment, capabilities",
      "State Disaster Management Authorities (SDMAs) and District Disaster Management Authorities (DDMAs)",
      "Disaster Management Act, 2005 — key provisions",
      "Sendai Framework for Disaster Risk Reduction 2015–2030",
      "Early warning systems — cyclone, tsunami, flood forecasting",
      "Community-based disaster management — role of local bodies, NGOs, volunteers",
      "Disaster risk reduction vs disaster response — paradigm shift",
      "Climate change and disaster linkages — increasing frequency and intensity",
      "Technology in disaster management — remote sensing, GIS, drones, AI",
      "Vulnerability and resilience mapping of India",
      "Recent disasters and lessons learned — Uttarakhand 2013, Kerala 2018, Cyclone Amphan, COVID-19 as disaster",
    ],
    strategy: [
      "Disaster Management is a compact subject that can be prepared quickly. Start with the NDMA guidelines — these are freely available on ndma.gov.in and cover each disaster type with causes, vulnerability, mitigation and response strategies. The guidelines on earthquakes, floods, cyclones, landslides and heat waves are the most important. Follow with a standard textbook (IGNOU material or Tata McGraw-Hill) for the theoretical framework of disaster management cycles.",
      "For UPSC, focus on India's institutional structure (NDMA, NDRF, SDMAs, DDMAs, NIDM) and their roles, the Disaster Management Act 2005 provisions, and the Sendai Framework's four priorities. Understand the shift from reactive disaster response to proactive disaster risk reduction. Map India's vulnerability zones — seismic zones, cyclone-prone coasts, flood-prone basins, drought-prone areas — this spatial understanding helps in both Prelims and Mains.",
      "In Mains GS-III, disaster management questions ask about preparedness, technology use, institutional coordination, or community resilience. Recent patterns show questions on climate-linked disasters, urban flooding, and multi-hazard early warning systems. Always include India-specific examples (Odisha's cyclone preparedness model, community-based flood management in Bihar, earthquake preparedness in NE India) and the role of technology (remote sensing, GIS, drone surveys, AI prediction models) in your answers.",
    ],
    books: [
      { title: "NDMA Guidelines", author: "National Disaster Management Authority", why: "Official disaster-specific guidelines covering all major natural and man-made disasters — the primary source for UPSC content." },
      { title: "Disaster Management (IGNOU)", author: "IGNOU", why: "Free, comprehensive study material covering the full disaster management cycle with Indian case studies." },
      { title: "Disaster Management", author: "Tata McGraw-Hill", why: "Standard textbook providing theoretical framework, institutional structure and disaster-specific details." },
      { title: "ARC Report on Crisis Management", author: "Second Administrative Reforms Commission", why: "Recommendations on improving India's disaster management framework — valued for Mains answers." },
    ],
    pyqTrend: {
      insight: "Disaster Management appears as 2–4 Prelims questions focused on institutional framework (NDMA, NDRF), disaster types, and vulnerability zones. In Mains GS-III, it guarantees 1–2 questions every year — recent focus areas include urban flooding, climate-disaster linkages, role of technology, and community preparedness. Questions often ask about specific disaster events and lessons learned.",
      frequency: "2–4 questions in Prelims; 1–2 guaranteed questions in Mains GS-III",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 8. INTERNAL SECURITY
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "internal-security",
    name: "Internal Security",
    overview:
      "Internal Security is a dedicated GS-III Mains topic that covers challenges to India's internal security from various sources — terrorism, insurgency, Left-Wing Extremism, border management, cyber security, money laundering and organised crime. It also covers the role of various security forces and agencies. While Prelims testing is limited (2–3 questions on security bodies or border issues), Mains GS-III guarantees 2–3 questions on internal security challenges and responses. The subject requires understanding of both the security landscape and the institutional framework managing it.",
    syllabus: [
      "Linkages between development and spread of extremism",
      "Role of external state and non-state actors in creating challenges to internal security",
      "Challenges to internal security through communication networks, role of media and social networking sites",
      "Basics of cyber security; money-laundering and its prevention",
      "Security challenges and their management in border areas",
      "Linkages of organised crime with terrorism",
      "Various Security Forces and agencies and their mandate",
      "Left-Wing Extremism (LWE) — causes, affected areas, government response (SAMADHAN doctrine)",
      "Terrorism — cross-border terrorism, radicalisation, counter-terrorism strategies",
      "Insurgency in North-East India — causes, groups, peace accords, AFSPA debates",
      "Border management — India's borders with Pakistan, China, Bangladesh, Myanmar, Nepal; fencing, technology, BOPs",
      "Cyber security threats — cyber warfare, data protection, critical infrastructure protection, CERT-In",
      "Money laundering — PMLA, FATF, hawala, terror financing",
      "Role of technology in security — surveillance, biometrics, AI in policing, drone threats",
      "Institutional framework — NIA, NSG, CRPF, BSF, ITBP, SSB, Assam Rifles, Coast Guard, RAW, IB",
    ],
    strategy: [
      "Internal Security requires understanding current security challenges alongside institutional knowledge. Start with Ashok Kumar's Internal Security book or the Challenge and Strategy compilation. Understand India's security architecture: which force guards which border (BSF for Pakistan/Bangladesh, ITBP for China, SSB for Nepal/Bhutan, Assam Rifles for Myanmar, Coast Guard for maritime), what NIA/NSG/IB/RAW do, and recent operational doctrines.",
      "Focus on the five pillars of internal security challenges: (1) Left-Wing Extremism — its causes in tribal neglect, geographic spread, SAMADHAN doctrine, development-security approach; (2) North-East insurgency — ethnic dimensions, peace accords (Naga, Bodo, Mizo), AFSPA controversy; (3) J&K and cross-border terrorism — radicalisation, abrogation of Article 370 impacts, ceasefire violations; (4) Cyber security — recent cyber attacks on Indian infrastructure, data protection legislation, social media challenges; (5) Border management — smart fencing, CIBMS, maritime security, Coastal Security Scheme.",
      "For Mains, practice analytical answers that balance security imperatives with human rights and development concerns. UPSC appreciates nuanced answers: discuss root causes of extremism alongside security responses, technology's dual role (surveillance and privacy concerns), or how media freedom and national security can coexist. Use case studies and specific government initiatives (UDAAN for J&K youth, Surrender-cum-Rehabilitation for LWE, BOLD-QIT for border management) to demonstrate depth.",
    ],
    books: [
      { title: "Internal Security and Disaster Management", author: "Ashok Kumar & Vipul Anekant", why: "Comprehensive coverage of all internal security dimensions with institutional details and case studies." },
      { title: "Challenges to Internal Security of India", author: "Challenge and Strategy", why: "Focused compilation of internal security topics with government policy responses and data." },
      { title: "Ministry of Home Affairs Annual Report", author: "MHA", why: "Official source for latest data on LWE incidents, border situation, cyber crimes and security force deployment." },
      { title: "IDSA/MP-IDSA publications", author: "Manohar Parrikar IDSA", why: "Research papers on specific security challenges — excellent for Mains answer enrichment with expert analysis." },
    ],
    pyqTrend: {
      insight: "Internal Security gives 2–3 Prelims questions on security forces, border issues and cyber security. In Mains GS-III, it guarantees 2–3 questions every year — LWE, cyber security, border management and terrorism linkages are the most tested areas. Questions increasingly focus on the technology-security nexus (drone threats, AI in policing, social media regulation) and development-security balance.",
      frequency: "2–3 questions in Prelims; 2–3 guaranteed questions in Mains GS-III",
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 9. ETHICS, INTEGRITY & APTITUDE
  // ──────────────────────────────────────────────────────────────────
  {
    slug: "ethics",
    name: "Ethics, Integrity & Aptitude",
    overview:
      "Ethics is a dedicated Mains paper (GS-IV, 250 marks) that tests moral and ethical reasoning, philosophical foundations of ethics, applied ethics in governance, and case studies requiring ethical decision-making. Unlike other GS papers, Ethics has no Prelims component but is uniquely important because it offers the highest scoring potential in Mains — toppers regularly score 110+ out of 150 in this paper. The paper has two sections: Section A (theory — concepts, thinkers, public service values) and Section B (case studies — ethical dilemmas requiring reasoned solutions).",
    syllabus: [
      "Ethics and Human Interface — essence, determinants and consequences of ethics in human actions",
      "Dimensions of ethics — ethics in private and public relationships",
      "Human Values — lessons from the lives and teachings of great leaders, reformers and administrators",
      "Role of family, society and educational institutions in inculcating values",
      "Attitude — content, structure, function; its influence and relation with thought and behaviour",
      "Moral and political attitudes; social influence and persuasion",
      "Aptitude and foundational values for Civil Service — integrity, impartiality, non-partisanship, objectivity, dedication to public service, empathy, tolerance and compassion towards the weaker sections",
      "Emotional intelligence — concepts and their utilities and application in administration and governance",
      "Contributions of moral thinkers and philosophers from India and world",
      "Public/Civil service values and Ethics in Public Administration — status and problems",
      "Ethical issues in international relations and funding",
      "Corporate governance",
      "Probity in Governance — concept of public service, philosophical basis of governance and probity",
      "Information sharing and transparency in government, RTI, codes of ethics and conduct, citizens' charters",
      "Accountability and ethical governance; strengthening of ethical and moral values in governance",
      "Ethical issues in international relations and funding; corporate governance",
      "Case Studies on above issues (Section B — 125 marks)",
    ],
    strategy: [
      "Ethics is the most 'scoreable' paper if approached correctly. Start by understanding the syllabus structure: Section A tests theoretical knowledge (ethics concepts, thinkers, public service values, emotional intelligence) while Section B presents real-life ethical dilemmas requiring structured, reasoned responses. For Section A, study Lexicon Ethics by Chronicle Publications or Subba Rao & PN Roy Chowdhury — these cover the theoretical framework. Supplement with 2nd ARC 4th Report on Ethics in Governance.",
      "For thinkers and philosophers, prepare a compact sheet: Indian thinkers (Gandhi — truth and non-violence, Vivekananda — service, Ambedkar — social justice, Kautilya — statecraft, Buddha — middle path) and Western thinkers (Aristotle — virtue ethics, Kant — duty/categorical imperative, Mill — utilitarianism, Rawls — justice as fairness). Understand each thinker's core contribution and be able to apply their philosophy to modern governance dilemmas. For emotional intelligence, understand Goleman's model and its application in administration.",
      "Section B (case studies, 125 marks) is where you win or lose this paper. Practice case study writing rigorously — use the framework: (1) identify stakeholders, (2) identify ethical issues, (3) list options with pros/cons, (4) recommend a course of action with justification, (5) discuss values demonstrated. Write at least 30–40 case studies before Mains. Use previous year questions, Drishti IAS case study compilations, and create your own scenarios from news. Your answers should demonstrate empathy, objectivity, integrity and practical wisdom — not just theoretical knowledge.",
    ],
    books: [
      { title: "Lexicon Ethics", author: "Chronicle Publications", why: "The most popular ethics book for UPSC — covers theoretical concepts, thinkers and applied ethics in an exam-friendly format." },
      { title: "Ethics, Integrity and Aptitude", author: "G. Subba Rao & P.N. Roy Chowdhury", why: "Comprehensive coverage of all syllabus topics with case studies and model answers." },
      { title: "ARC 4th Report: Ethics in Governance", author: "Second Administrative Reforms Commission", why: "Official recommendations on ethical governance — directly relevant to probity in governance questions." },
      { title: "Justice by Michael Sandel", author: "Michael Sandel", why: "Accessible introduction to moral philosophy (utilitarianism, libertarianism, virtue ethics) — enriches Section A answers." },
      { title: "Previous Year Ethics Papers (2013–2024)", author: "UPSC", why: "Analysing previous papers reveals the pattern — types of case studies, recurring themes, and expected answer structure." },
    ],
    pyqTrend: {
      insight: "Ethics is exclusively a Mains paper (GS-IV, 250 marks). Section A typically has 8–10 questions on theory (150 words each), testing concepts, thinkers, EI, and governance values. Section B has 6 case studies (250 words each, higher marks). Case study themes recur: conflict of interest, whistleblowing, social media ethics, environmental vs development, tribal rights. Emotional intelligence and attitude questions appear every year. Quoting thinkers appropriately in both sections is rewarded.",
      frequency: "Dedicated Mains Paper (GS-IV) — 250 marks; no Prelims questions",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Utility function                                                     */
/* ------------------------------------------------------------------ */

export function getGsSubjectDetail(slug: string): GsSubjectDetail | undefined {
  return gsSubjectDetails.find((s) => s.slug === slug);
}

export const gsSubjectSlugs = gsSubjectDetails.map((s) => s.slug);
