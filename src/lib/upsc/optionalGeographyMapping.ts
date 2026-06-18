// Mapping points for the Geography optional interactive India map.
// Positions are % of the map container (x = left%, y = top%) over /india-map.svg.
// Seeded from recurring map-based PYQ themes; founder/team can extend & verify.

export type MapType = "river" | "range" | "place" | "ca";
export type MapPoint = {
  id: string;
  name: string;
  type: MapType;
  x: number; // 0-100 (% left)
  y: number; // 0-100 (% top)
  note: string;
  pyq?: string;
  isNew?: boolean;
};

export const mapTabs: Array<{ id: MapType; label: string }> = [
  { id: "river", label: "Rivers" },
  { id: "range", label: "Mountains & Ranges" },
  { id: "place", label: "Places & Sites" },
  { id: "ca", label: "Current Affairs" },
];

export const geographyMapPoints: MapPoint[] = [
  // Rivers
  { id: "ganga", name: "Ganga", type: "river", x: 47, y: 36, note: "Largest river basin of India; Gangetic plains.", pyq: "Repeatedly mapped (basins, pollution, Namami Gange)." },
  { id: "brahmaputra", name: "Brahmaputra", type: "river", x: 80, y: 22, note: "Braided river; Assam floods; NE drainage.", pyq: "Asked with floods & inter-state/transboundary issues." },
  { id: "yamuna", name: "Yamuna", type: "river", x: 41, y: 31, note: "Major Ganga tributary; Delhi.", pyq: "Pollution & river-front PYQs." },
  { id: "indus", name: "Indus", type: "river", x: 33, y: 17, note: "Ladakh/J&K; Indus Waters Treaty.", pyq: "Transboundary water PYQs." },
  { id: "godavari", name: "Godavari", type: "river", x: 53, y: 58, note: "Largest peninsular river ('Dakshin Ganga').", pyq: "Peninsular drainage mapping." },
  { id: "krishna", name: "Krishna", type: "river", x: 50, y: 64, note: "Inter-state water dispute (KWDT).", pyq: "Water-dispute PYQs." },
  { id: "narmada", name: "Narmada", type: "river", x: 37, y: 47, note: "West-flowing rift valley river.", pyq: "Rift-valley & dam PYQs." },
  { id: "kaveri", name: "Kaveri", type: "river", x: 57, y: 73, note: "Kaveri water dispute.", pyq: "Inter-state dispute PYQs." },
  // Mountains & ranges
  { id: "himalaya", name: "Himalayas", type: "range", x: 55, y: 14, note: "Young fold mountains; orogeny, monsoon barrier.", pyq: "Geomorphology & climate PYQs." },
  { id: "karakoram", name: "Karakoram / Ladakh (incl. Aksai Chin)", type: "range", x: 56, y: 8, note: "Trans-Himalaya; Siachen, Aksai Chin.", pyq: "Strategic geography PYQs." },
  { id: "aravalli", name: "Aravalli", type: "range", x: 31, y: 37, note: "Oldest fold mountains; NW-SE.", pyq: "Denudation/oldest-range PYQs." },
  { id: "western-ghats", name: "Western Ghats", type: "range", x: 44, y: 62, note: "Biodiversity hotspot; orographic rainfall.", pyq: "Ecology + climate PYQs." },
  { id: "eastern-ghats", name: "Eastern Ghats", type: "range", x: 62, y: 57, note: "Discontinuous; lower than Western Ghats.", pyq: "Comparative relief PYQs." },
  { id: "vindhya-satpura", name: "Vindhya–Satpura", type: "range", x: 44, y: 46, note: "Narmada–Tapi rift between them.", pyq: "Peninsular relief PYQs." },
  { id: "purvanchal", name: "Purvanchal (NE hills)", type: "range", x: 82, y: 28, note: "Patkai, Naga, Mizo hills; Arunachal.", pyq: "NE geography PYQs." },
  // Places & sites
  { id: "delhi", name: "Delhi", type: "place", x: 40, y: 30, note: "Capital; urban geography.", pyq: "Settlement/urban PYQs." },
  { id: "mumbai", name: "Mumbai", type: "place", x: 38, y: 58, note: "Port & industrial node.", pyq: "Industrial location PYQs." },
  { id: "kolkata", name: "Kolkata", type: "place", x: 72, y: 42, note: "Riverine port; jute belt.", pyq: "Port/industry PYQs." },
  { id: "kanyakumari", name: "Kanyakumari", type: "place", x: 55, y: 81, note: "Southern tip; confluence of seas.", pyq: "Locational PYQs." },
  { id: "itanagar", name: "Itanagar (Arunachal Pradesh)", type: "place", x: 87, y: 20, note: "NE frontier; Arunachal is integral India.", pyq: "Border-geography PYQs." },
  // Current affairs
  { id: "joshimath", name: "Joshimath", type: "ca", x: 47, y: 23, note: "Land subsidence; Himalayan fragility.", pyq: "Disaster + geomorphology link.", isNew: true },
  { id: "great-nicobar", name: "Great Nicobar", type: "ca", x: 80, y: 87, note: "Mega infra project vs ecology debate.", pyq: "Island development PYQ angle.", isNew: true },
  { id: "sela-tunnel", name: "Sela Tunnel (Arunachal)", type: "ca", x: 85, y: 19, note: "Strategic connectivity; high-altitude.", pyq: "Strategic geography.", isNew: true },
  { id: "lakshadweep", name: "Lakshadweep", type: "ca", x: 25, y: 70, note: "Coral atolls; tourism vs ecology.", pyq: "Coral/island PYQs.", isNew: true },
  { id: "katchatheevu", name: "Katchatheevu", type: "ca", x: 57, y: 79, note: "Palk Strait islet; fishing rights.", pyq: "Maritime geography." },
];


// Topic-wise diagram bank (AI handwritten / 3D versions render per card later).
export type DiagramItem = { id: string; title: string; topic: string; note: string };
export const geographyDiagrams: DiagramItem[] = [
  { id: "geomorphic-cycle", title: "Davisian cycle of erosion", topic: "Geomorphology", note: "Youth → mature → old stages; label peneplain & monadnock." },
  { id: "atm-circulation", title: "Tri-cellular atmospheric circulation", topic: "Climatology", note: "Hadley, Ferrel, Polar cells + global pressure belts." },
  { id: "monsoon", title: "Indian monsoon mechanism", topic: "Climatology", note: "ITCZ shift, jet streams, SW monsoon branches." },
  { id: "ocean-currents", title: "World ocean currents", topic: "Oceanography", note: "Warm & cold currents; subtropical gyres." },
  { id: "central-place", title: "Christaller's central place", topic: "Settlement", note: "Hexagonal hinterlands; k = 3, 4, 7." },
  { id: "dem-transition", title: "Demographic transition", topic: "Population", note: "Stages I–V; birth, death & growth-rate curves." },
];
