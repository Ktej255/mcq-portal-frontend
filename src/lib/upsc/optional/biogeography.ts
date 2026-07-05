import type { OptionalTopic } from "./geographyOptionalTypes";

/**
 * UPSC Geography Optional — Paper I, Section A (Physical Geography)
 * Topic 4: BIOGEOGRAPHY
 *
 * Personal-notes register, exam-grade depth. Syllabus mapping grounded in the
 * official UPSC Geography Optional Paper I syllabus and 25-year PYQ patterns.
 */
export const biogeography: OptionalTopic = {
  slug: "biogeography",
  title: "Biogeography",
  paper: "Paper I",
  section: "Section A — Physical Geography",
  order: 4,
  status: "ready",
  summary:
    "Soils — their genesis, profile, classification, erosion & conservation — plus the distribution of plants and animals, deforestation, social & agro-forestry, wildlife and gene-pool centres.",
  readMinutes: 38,
  syllabus: {
    official: [
      "Genesis of soils.",
      "Classification and distribution of soils.",
      "Soil profile.",
      "Soil erosion, degradation and conservation.",
      "Factors influencing world distribution of plants and animals.",
      "Problems of deforestation and conservation measures.",
      "Social forestry; agro-forestry.",
      "Wildlife; major gene pool centres.",
    ],
    trendSays: [
      {
        theme: "Soil genesis, profile & classification",
        insight:
          "Core, repeatedly-asked block. Examiner wants soil-forming factors and pedogenic processes (laterization, podzolization, etc.), the horizon profile, and a classification basis (zonal/azonal or USDA).",
        frequency: "Very High",
      },
      {
        theme: "Soil erosion, degradation & conservation",
        insight:
          "High and current. Causes (water/wind), types, desertification, and conservation (contour bunding, terracing, agro-forestry, watershed) — a strong applied 15-marker.",
        frequency: "High",
      },
      {
        theme: "Factors of plant & animal distribution (biomes)",
        insight:
          "High. Climatic, edaphic, topographic and biotic controls; the major biomes; and ecological succession to a climax.",
        frequency: "High",
      },
      {
        theme: "Deforestation, social & agro-forestry",
        insight:
          "Current-affairs friendly. Causes/consequences of deforestation and the design of social forestry & agro-forestry as remedies.",
        frequency: "High",
      },
      {
        theme: "Wildlife, biodiversity & gene-pool centres",
        insight:
          "Rising. Vavilov centres of crop origin, biodiversity hotspots, in-situ/ex-situ conservation, and threats to wildlife.",
        frequency: "High",
      },
      {
        theme: "Ecosystem concepts (energy flow, cycles)",
        insight:
          "Medium but foundational. Trophic levels, the 10% energy law, food webs and biogeochemical cycles underpin distribution and conservation answers.",
        frequency: "Medium",
      },
    ],
    hiddenTopics: [
      {
        topic: "Soil-forming factors — Jenny's CLORPT model",
        why: "'Genesis of soils' assumes climate, organisms, relief, parent material and time as the controlling factors, plus the pedogenic regimes.",
      },
      {
        topic: "Pedogenic processes (laterization, podzolization, calcification, gleization, salinization)",
        why: "Needed to explain why specific soils form in specific climates — the link between climate and the soil map.",
      },
      {
        topic: "Ecological succession (sere, pioneer, climax)",
        why: "'Distribution of plants' implicitly needs primary/secondary succession and the climatic-climax concept.",
      },
      {
        topic: "Biodiversity hotspots (Myers) & Vavilov centres of origin",
        why: "'Major gene pool centres' = Vavilov's centres; conservation answers expect Myers' hotspots and India's hotspots.",
      },
      {
        topic: "Zoogeographic realms (Wallace)",
        why: "Animal distribution answers improve with the six faunal realms and Wallace's line.",
      },
      {
        topic: "Ecosystem energy flow & biogeochemical cycles",
        why: "Trophic pyramids, the 10% law and nutrient cycles are assumed background for biome and conservation questions.",
      },
    ],
  },
  subtopics: [
    {
      id: "soil-genesis-profile",
      title: "Genesis of soils & the soil profile",
      syllabusTag: "Genesis of soils; soil profile",
      hook: "Soil is the bridge between rock and life — master how it forms and you can read any soil map.",
      blocks: [
        {
          type: "para",
          text: "Soil is a dynamic natural body formed at the rock–atmosphere–life interface by PEDOGENESIS — the combined action of weathering and biological activity on parent material over time. Hans Jenny captured its controls in the CLORPT model: soil is a function of CLimate, Organisms, Relief, Parent material and Time. Climate and organisms are the 'active' factors; relief, parent material and time are 'passive'.",
        },
        {
          type: "points",
          heading: "Key pedogenic processes (link climate → soil)",
          items: [
            "Laterization — intense leaching in hot, wet tropics leaves iron/aluminium oxides (laterite).",
            "Podzolization — acid leaching under cool coniferous forests produces an ashy, bleached horizon.",
            "Calcification — calcium accumulates in semi-arid grasslands (pedocals).",
            "Salinization — salts rise and concentrate under aridity/poor drainage (saline/alkaline soils).",
            "Gleization — waterlogging produces grey, reduced gley soils.",
          ],
        },
        {
          type: "para",
          text: "A vertical section through the soil reveals a SOIL PROFILE of horizons: O (organic litter/humus), A (mineral topsoil rich in organic matter, zone of eluviation), E (leached, light-coloured), B (subsoil of illuviation where clays/oxides accumulate), C (weathered parent material), and R (bedrock).",
        },
        {
          type: "diagram",
          id: "soil-profile",
          caption: "The soil profile: O → A → E → B → C → R horizons.",
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary the examiner rewards",
          items: [
            "pedogenesis, CLORPT, active vs passive soil-forming factors",
            "eluviation, illuviation, leaching, humus",
            "laterization, podzolization, calcification, salinization, gleization",
            "soil horizon, solum, regolith, soil profile",
          ],
        },
        {
          type: "callout",
          tone: "trap",
          title: "Common traps",
          items: [
            "Weathering produces regolith; soil needs the added biological/organic dimension — don't equate the two.",
            "Eluviation (loss from A/E) vs illuviation (gain in B) — keep the direction right.",
          ],
        },
      ],
      examKeywords: ["pedogenesis", "CLORPT", "soil profile", "laterization", "podzolization", "eluviation", "illuviation"],
      answerLanguage: [
        "\"Soil is a function of climate, organisms, relief, parent material and time (Jenny's CLORPT).\"",
        "\"Pedogenic processes translate the prevailing climate into a characteristic soil profile.\"",
      ],
      pyq: [
        { q: "Explain the factors and processes of soil formation (pedogenesis)." },
        { q: "Draw a generalized soil profile and describe its horizons." },
      ],
    },
    {
      id: "soil-classification-distribution",
      title: "Classification & distribution of soils",
      syllabusTag: "Classification and distribution of soils",
      hook: "Tie each soil to its climate and you can both classify and locate it on the world map.",
      blocks: [
        {
          type: "para",
          text: "Soils can be grouped genetically into ZONAL soils (mature, reflecting climate & vegetation — e.g., podzols, laterites, chernozems), AZONAL soils (young, poorly developed — e.g., alluvial, regosols), and INTRAZONAL soils (reflecting local conditions of relief/parent material/drainage — e.g., saline, peaty, calcareous). The modern USDA Soil Taxonomy classifies soils into orders (Entisols, Inceptisols, Mollisols, Alfisols, Ultisols, Oxisols, Aridisols, Spodosols, Vertisols, etc.) on measurable properties.",
        },
        {
          type: "points",
          heading: "World distribution (climate-linked)",
          items: [
            "Tropical wet: laterites/Oxisols — leached, low fertility.",
            "Equatorial & temperate forests: podzols/Spodosols under conifers; brown forest soils under deciduous.",
            "Mid-latitude grasslands: chernozems/Mollisols — deep, dark, very fertile.",
            "Arid lands: aridisols/grey desert soils — saline, low organic matter.",
            "River valleys & deltas: alluvial (azonal) — renewed, highly productive.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Indian link to deploy",
          items: [
            "Black (regur) soils of the Deccan — cotton soils, moisture-retentive, derived from basalt.",
            "Alluvial soils of the Indo-Gangetic plain — the agricultural backbone.",
            "Laterite soils of the Western Ghats/plateau margins — leached, need management.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "zonal / azonal / intrazonal soils",
            "USDA Soil Taxonomy, soil order, Mollisol, Oxisol, Aridisol, Spodosol",
            "chernozem, podzol, laterite, regur (black soil), alluvial soil",
          ],
        },
      ],
      examKeywords: ["zonal soils", "azonal soils", "intrazonal soils", "USDA soil taxonomy", "chernozem", "laterite", "regur"],
      answerLanguage: [
        "\"Zonal soils mirror the regional climate and vegetation, whereas azonal soils remain immature.\"",
        "\"The fertile chernozems of the mid-latitude grasslands are the world's great grain soils.\"",
      ],
      pyq: [
        { q: "Discuss the genetic classification of soils with world examples." },
        { q: "Account for the world distribution of major soil types in relation to climate." },
      ],
    },
    {
      id: "soil-erosion-conservation",
      title: "Soil erosion, degradation & conservation",
      syllabusTag: "Soil erosion, degradation and conservation",
      hook: "A high-yield applied head — connect process to a named conservation measure and an Indian example.",
      blocks: [
        {
          type: "para",
          text: "SOIL EROSION is the accelerated removal of topsoil by water and wind, usually triggered by the loss of protective vegetation (deforestation, overgrazing, faulty cultivation). DEGRADATION is the broader decline in soil quality — through erosion, salinization/waterlogging (often from over-irrigation), nutrient depletion, acidification and desertification.",
        },
        {
          type: "points",
          heading: "Types & processes",
          items: [
            "Water erosion: sheet, rill, gully (badlands), and stream-bank erosion.",
            "Wind erosion: deflation, saltation and abrasion in arid lands.",
            "Mass movement on steep, deforested slopes.",
          ],
        },
        {
          type: "diagram",
          id: "soil-conservation",
          caption: "Slope conservation: contour bunds/terraces plus afforestation and shelter belts.",
        },
        {
          type: "points",
          heading: "Conservation measures",
          items: [
            "Agronomic: contour ploughing, strip cropping, cover crops, crop rotation, mulching.",
            "Mechanical: contour bunding, terracing, gully plugging, check-dams.",
            "Biological/forestry: afforestation, shelter belts, agro-forestry, watershed management.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Indian examples",
          items: [
            "Chambal/Yamuna ravines (gully badlands) — reclamation and check-dams.",
            "Watershed-development programmes in the semi-arid Deccan and Rajasthan.",
            "Shelter belts against wind erosion in the Thar margins.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "sheet / rill / gully erosion, deflation, saltation",
            "salinization, waterlogging, desertification, land degradation",
            "contour bunding, terracing, shelter belt, watershed management",
          ],
        },
      ],
      examKeywords: ["soil erosion", "gully erosion", "desertification", "contour bunding", "watershed management", "shelter belt"],
      answerLanguage: [
        "\"Soil erosion is fundamentally a vegetation-cover problem; conservation therefore begins with cover and contour.\"",
        "\"Watershed-based treatment integrates agronomic, mechanical and forestry measures across the slope.\"",
      ],
      pyq: [
        { year: "2020", q: "Discuss the causes and consequences of soil erosion and suggest conservation measures." },
        { q: "Examine land degradation and desertification as global environmental problems." },
      ],
    },
    {
      id: "plant-animal-distribution",
      title: "Factors influencing world distribution of plants & animals",
      syllabusTag: "Factors influencing world distribution of plants and animals",
      hook: "The biome question — anchor distribution to climate, soil, relief and biotic factors, plus succession.",
      blocks: [
        {
          type: "para",
          text: "The global pattern of life reflects four sets of ecological factors: CLIMATIC (temperature, moisture, light, wind), EDAPHIC (soil), TOPOGRAPHIC (altitude, slope, aspect) and BIOTIC (competition, grazing, humans). Because climate dominates, vegetation forms broad latitudinal belts — BIOMES — that repeat with altitude on mountains.",
        },
        {
          type: "diagram",
          id: "world-biomes",
          caption: "Biomes shift from tropical rainforest to tundra with temperature and rainfall (and with altitude).",
        },
        {
          type: "points",
          heading: "Major biomes (poleward sequence)",
          items: [
            "Tropical rainforest — hot, wet, hyper-diverse, evergreen, stratified.",
            "Savanna — tropical grassland with scattered trees, wet–dry seasons.",
            "Desert — xerophytic, sparse, adapted to aridity.",
            "Mediterranean — sclerophyll shrub (chaparral), summer-dry.",
            "Temperate grassland (prairie/steppe) and temperate forest.",
            "Taiga (boreal conifers) and Tundra (cold, treeless).",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Ecological succession (the hidden layer)",
          items: [
            "Succession is the orderly change of communities at a site, from pioneers to a stable climax.",
            "Primary succession starts on bare substrate (lava, rock); secondary on disturbed land (after fire/clearance).",
            "The CLIMATIC CLIMAX is in equilibrium with the regional climate — hence climate ultimately sets the biome.",
          ],
        },
        {
          type: "callout",
          tone: "link",
          title: "Animal distribution",
          items: [
            "Animals track vegetation/biomes for food and shelter; barriers (oceans, mountains) isolate faunas.",
            "Wallace's six zoogeographic realms describe the great faunal divisions of the world.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "climatic / edaphic / topographic / biotic factors",
            "biome, ecotone, xerophyte, sclerophyll, halophyte",
            "ecological succession, sere, pioneer, climatic climax, zoogeographic realm",
          ],
        },
      ],
      examKeywords: ["biome", "ecological factors", "ecological succession", "climatic climax", "edaphic", "zoogeographic realm"],
      answerLanguage: [
        "\"The world distribution of vegetation is primarily a response to the climatic gradient, modified by edaphic and biotic factors.\"",
        "\"Through succession, communities converge on a climatic climax in equilibrium with the regional climate.\"",
      ],
      pyq: [
        { q: "Examine the factors controlling the world distribution of natural vegetation." },
        { q: "Explain the concept of ecological succession and the climatic climax." },
      ],
    },
    {
      id: "deforestation-forestry",
      title: "Deforestation, social forestry & agro-forestry",
      syllabusTag: "Problems of deforestation and conservation measures; social forestry; agro-forestry",
      hook: "Current-affairs gold — pair the causes/consequences of deforestation with the forestry remedies.",
      blocks: [
        {
          type: "para",
          text: "DEFORESTATION — the permanent loss of forest cover for agriculture, logging, mining, infrastructure and shifting cultivation — drives biodiversity loss, soil erosion, hydrological disruption, and carbon release that worsens climate change. The remedies blend protection with people-centred planting.",
        },
        {
          type: "points",
          heading: "Consequences (to write crisply)",
          items: [
            "Biodiversity & habitat loss; disruption of food webs.",
            "Accelerated soil erosion and siltation of rivers/reservoirs.",
            "Altered hydrology — reduced infiltration, more floods and droughts.",
            "Carbon emission and loss of a key carbon sink → climate feedback.",
          ],
        },
        {
          type: "points",
          heading: "Forestry remedies",
          items: [
            "Social forestry — raising trees on community/public/wastelands for fuelwood, fodder and small timber, to relieve pressure on natural forests (farm forestry, community woodlots, strip plantations).",
            "Agro-forestry — deliberately combining trees with crops/livestock on the same land (alley cropping, silvopasture) for soil protection, income and resilience.",
            "Joint Forest Management, afforestation drives, protected areas and REDD+ style incentives.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Indian angle",
          items: [
            "Joint Forest Management and community forestry models.",
            "National agro-forestry policy; shelter-belt and farm-forestry schemes.",
            "Western Ghats / North-East forest pressures as case studies.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "deforestation, shifting cultivation, carbon sink",
            "social forestry, farm forestry, community woodlot",
            "agro-forestry, alley cropping, silvopasture, joint forest management",
          ],
        },
      ],
      examKeywords: ["deforestation", "social forestry", "agro-forestry", "silvopasture", "joint forest management", "carbon sink"],
      answerLanguage: [
        "\"Social forestry shifts the fuelwood-and-fodder burden away from natural forests onto community and farm lands.\"",
        "\"Agro-forestry integrates trees with crops to deliver soil protection, income and climate resilience together.\"",
      ],
      pyq: [
        { q: "Discuss the causes and consequences of deforestation and the role of social forestry as a remedy." },
        { q: "Distinguish between social forestry and agro-forestry with examples." },
      ],
    },
    {
      id: "wildlife-gene-pool",
      title: "Wildlife & major gene-pool centres",
      syllabusTag: "Wildlife; major gene pool centres",
      hook: "Own Vavilov's centres and biodiversity hotspots — they convert a wildlife answer into a conservation-strategy answer.",
      blocks: [
        {
          type: "para",
          text: "Wildlife conservation protects faunal and floral diversity against habitat loss, poaching, invasive species and climate change. The genetic foundation of crops lies in MAJOR GENE-POOL CENTRES — N. I. Vavilov's centres of origin, regions of exceptional crop genetic diversity from which domesticated plants spread.",
        },
        {
          type: "points",
          heading: "Vavilov centres & biodiversity hotspots",
          items: [
            "Vavilov identified several primary centres of crop origin (e.g., Central/South-West Asian, Mediterranean, Ethiopian/Abyssinian, Central American, Andean, Chinese, and the Indian/Hindustani centre).",
            "Myers' biodiversity hotspots: regions with exceptional endemism under severe threat (India hosts the Western Ghats, the Himalaya, the Indo-Burma and Sundaland margins).",
            "These centres/hotspots are priorities for safeguarding the wild relatives of crops and endangered species.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Conservation strategies",
          items: [
            "In-situ — national parks, wildlife sanctuaries, biosphere reserves, sacred groves (protect species in their habitat).",
            "Ex-situ — gene banks, seed vaults, botanical gardens, zoos, cryopreservation.",
            "Legal/global frameworks — CITES, the Convention on Biological Diversity (CBD), Ramsar wetlands.",
          ],
        },
        {
          type: "diagram",
          id: "ecological-pyramid",
          caption: "Energy thins up the trophic pyramid (~10% per level) — why top predators are few and vulnerable.",
        },
        {
          type: "callout",
          tone: "link",
          title: "Links for extra marks",
          items: [
            "Connect gene-pool conservation to food security and climate-resilient agriculture.",
            "Tie wildlife loss to ecosystem services, the trophic-pyramid logic and Environment/GS-III.",
          ],
        },
        {
          type: "callout",
          tone: "keyword",
          title: "Vocabulary",
          items: [
            "Vavilov centres of origin, crop wild relatives, gene bank",
            "biodiversity hotspot, endemism, in-situ / ex-situ conservation",
            "biosphere reserve, CITES, Convention on Biological Diversity, trophic level",
          ],
        },
      ],
      examKeywords: ["Vavilov centres", "gene pool", "biodiversity hotspot", "in-situ conservation", "ex-situ conservation", "endemism"],
      answerLanguage: [
        "\"Vavilov's centres of origin are the genetic reservoirs from which the world's crops were domesticated.\"",
        "\"Effective biodiversity strategy combines in-situ protection of habitats with ex-situ gene banking.\"",
      ],
      pyq: [
        { q: "What are the major gene-pool centres? Discuss their significance for crop diversity and food security." },
        { q: "Examine the strategies of wildlife and biodiversity conservation with reference to hotspots." },
      ],
    },
  ],
};
