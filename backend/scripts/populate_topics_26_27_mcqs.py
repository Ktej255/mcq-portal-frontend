#!/usr/bin/env python3
"""Populate verified 15-MCQ banks for Topics 26 & 27 and fix Topic 27 PYQ explanation."""

import json
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE.parent / "app" / "core" / "gs_lms" / "data"
UPGRADED_DIR = DATA_DIR / "upgraded_topics"
SYLLABUS_FILE = DATA_DIR / "gs_geography_syllabus.json"

MCQS_TOPIC_26 = [
  {
    "question_text": "Consider the following statements regarding the Airy model of isostasy:\n1. Crustal blocks of varying elevations have the same uniform density throughout.\n2. Higher mountains are supported by proportionally deeper crustal roots extending into the denser mantle.\n3. The mechanism of compensation is analogous to icebergs floating in water.\nWhich of the statements given above are correct?",
    "options": [
      {"label": "A", "text": "1 and 2 only"},
      {"label": "B", "text": "2 and 3 only"},
      {"label": "C", "text": "1 and 3 only"},
      {"label": "D", "text": "1, 2 and 3"}
    ],
    "correct_option": "D",
    "explanation": "All three statements are correct. In Airy's model (1855), continental crust has uniform density (typically ~2.7 g/cm³), and topographical differences are compensated by differences in crustal thickness—mountains have deep roots (crustal roots exceeding 70 km under the Himalayas), exactly like icebergs floating in water.",
    "question_type": "STATEMENT_BASED",
    "display_order": 1,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "With reference to the Pratt model of isostasy, consider the following statements:\n1. All crustal columns reach a uniform depth of compensation.\n2. Higher topographic blocks have lower rock densities compared to lower blocks.\n3. Mountain belts are compensated by deep crustal roots projecting into the asthenosphere.\nWhich of the statements given above is/are correct?",
    "options": [
      {"label": "A", "text": "1 and 2 only"},
      {"label": "B", "text": "2 only"},
      {"label": "C", "text": "1 and 3 only"},
      {"label": "D", "text": "1, 2 and 3"}
    ],
    "correct_option": "A",
    "explanation": "Statements 1 and 2 are correct. In Pratt's model (1855), isostatic equilibrium is achieved by lateral density variations: higher topography is composed of lower-density rock, and all columns terminate at the same depth of compensation. Statement 3 is WRONG because deep roots are the defining feature of the Airy model, not Pratt.",
    "question_type": "STATEMENT_BASED",
    "display_order": 2,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Why do the Himalayas exhibit strongly negative Bouguer gravity anomalies (reaching up to −500 mGal)?",
    "options": [
      {"label": "A", "text": "Due to the absence of the asthenosphere beneath northern India"},
      {"label": "B", "text": "Due to a massive mass deficit caused by thick, low-density crustal roots displacing denser mantle material"},
      {"label": "C", "text": "Because the Himalayas are composed predominantly of ultra-dense basaltic lava"},
      {"label": "D", "text": "Due to gravitational interference from the Tibetan Plateau's volcanic lakes"}
    ],
    "correct_option": "B",
    "explanation": "A negative Bouguer anomaly signifies a mass deficit beneath the landform. The Himalayas possess a crustal root extending >70 km deep. Because continental crustal rock (~2.7 g/cm³) is significantly less dense than the mantle rock (~3.3 g/cm³) it displaces, there is a net mass deficiency beneath the mountains, producing a large negative Bouguer anomaly.",
    "question_type": "FACTUAL",
    "display_order": 3,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "The Indo-Gangetic Plain is geomorphologically classified as an isostatic foreland basin. Which mechanism best accounts for its formation?",
    "options": [
      {"label": "A", "text": "Rifting of the Eurasian plate during the Triassic period"},
      {"label": "B", "text": "Thermal contraction of ancient volcanic calderas across north India"},
      {"label": "C", "text": "Downward flexure of the rigid Indian lithosphere under the colossal tectonic load of the rising Himalayan orogen"},
      {"label": "D", "text": "Massive glacial scour during the Pleistocene epoch followed by marine transgression"}
    ],
    "correct_option": "C",
    "explanation": "Under Vening Meinesz's flexural isostasy theory, the lithosphere acts as an elastic plate. The immense tectonic load of the Himalayas causes the Indian lithospheric plate to bend downward ahead of the mountain belt, forming an asymmetrical flexural depression (foreland basin) which rivers filled with alluvium.",
    "question_type": "FACTUAL",
    "display_order": 4,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements regarding 'post-glacial rebound' (isostatic uplift):\n1. It is the slow, continuous rise of land masses following the melting of massive Pleistocene ice sheets.\n2. Scandinavia and parts of Canada are currently undergoing measurable isostatic uplift at rates of up to 1 cm/year.\n3. The rate of rebound is controlled primarily by the viscoelastic flow of the underlying asthenosphere.\nHow many of the above statements are correct?",
    "options": [
      {"label": "A", "text": "Only one"},
      {"label": "B", "text": "Only two"},
      {"label": "C", "text": "All three"},
      {"label": "D", "text": "None"}
    ],
    "correct_option": "C",
    "explanation": "All three statements are correct. When ice sheets melt, the removal of the downward surface load causes the lithosphere to rebound towards gravitational equilibrium. Scandinavia is uplifting at ~1 cm/year, and this recovery rate directly reflects the viscoelastic viscosity of the asthenosphere.",
    "question_type": "STATEMENT_BASED",
    "display_order": 5,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "What historical discrepancy in the Great Trigonometrical Survey of India led Sir George Airy and Archdeacon Pratt to formulate the theories of isostasy?",
    "options": [
      {"label": "A", "text": "The deflection of the plumb-line towards the Himalayas was substantially less than calculated from the visible mass of the mountains"},
      {"label": "B", "text": "The speed of sound measured across the Gangetic plain deviated from atmospheric models"},
      {"label": "C", "text": "The measured circumference of the Earth across the Indian peninsula exceeded theoretical geoid values by 10%"},
      {"label": "D", "text": "The magnetic declination at Madras showed reverse polarity relative to Greenwich"}
    ],
    "correct_option": "A",
    "explanation": "During triangulation measurements between Kaliana and Kalianpur near the Himalayan foothills, the plumb-line's gravitational deflection toward the Himalayas was far less than expected from their colossal visible mass. This proved that a mass deficiency existed beneath the mountains compensating their weight.",
    "question_type": "FACTUAL",
    "display_order": 6,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "In isostasy, the 'depth of compensation' is best defined as:",
    "options": [
      {"label": "A", "text": "The boundary between the outer core and the lower mantle"},
      {"label": "B", "text": "The maximum depth to which seismic S-waves can penetrate the continental crust"},
      {"label": "C", "text": "The horizontal level beneath which the total lithostatic pressure exerted by overlying columns of rocks becomes equal"},
      {"label": "D", "text": "The shallowest focal depth at which deep-focus earthquakes occur"}
    ],
    "correct_option": "C",
    "explanation": "The depth of compensation (typically ~100–120 km in continental regions) is the theoretical horizontal surface below which all vertical columns of rock exert equal hydrostatic pressure, maintaining gravitational balance across the planet.",
    "question_type": "FACTUAL",
    "display_order": 7,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "How does Vening Meinesz's model of regional isostasy differ fundamentally from the classical Airy and Pratt models?",
    "options": [
      {"label": "A", "text": "It assumes that the Earth's crust is entirely fluid without any solid mantle"},
      {"label": "B", "text": "It treats the lithosphere as an elastic plate that distributes topographical loads regionally through flexural rigidity, rather than purely local vertical columns"},
      {"label": "C", "text": "It denies that gravity plays any role in crustal equilibrium"},
      {"label": "D", "text": "It applies exclusively to oceanic trenches and excludes continental landmasses"}
    ],
    "correct_option": "B",
    "explanation": "Airy and Pratt models assume local compensation (individual free vertical columns). Vening Meinesz introduced regional or flexural isostasy, where the lithosphere possesses flexural rigidity and behaves like an elastic sheet that bends under load, spreading compensation over broad regional wavelengths.",
    "question_type": "STATEMENT_BASED",
    "display_order": 8,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements regarding the feedback loop between isostasy and mountain erosion:\n1. As weathering and erosion remove mass from the summit of a mountain range, the crust rebounds upward isostatically.\n2. Isostatic rebound can restore approximately 80% of the elevation lost to erosion.\n3. This rebound process facilitates the continuous exhumation of deep metamorphic rocks to the surface.\nWhich of the statements given above are correct?",
    "options": [
      {"label": "A", "text": "1 and 2 only"},
      {"label": "B", "text": "2 and 3 only"},
      {"label": "C", "text": "1 and 3 only"},
      {"label": "D", "text": "1, 2 and 3"}
    ],
    "correct_option": "D",
    "explanation": "All three statements are correct. When erosion strips rock mass from a mountain (density ~2.7 g/cm³), the buoyancy of the mantle (~3.3 g/cm³) pushes the root upward, recovering ~80% (2.7/3.3) of the eroded thickness. This prolonged isostatic uplift prolongs mountain longevity and brings deep metamorphic granulites and migmatites to the surface.",
    "question_type": "STATEMENT_BASED",
    "display_order": 9,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Which of the following oceanographic features is best explained by thermal isostasy (a Pratt-like density variation)?",
    "options": [
      {"label": "A", "text": "The subsidence of oceanic crust as it moves away from mid-oceanic ridges, cools, and becomes denser"},
      {"label": "B", "text": "The formation of submarine canyons by turbidity currents"},
      {"label": "C", "text": "The occurrence of tsunamis at transform fault boundaries"},
      {"label": "D", "text": "The deposition of calcareous ooze below the Carbonate Compensation Depth (CCD)"}
    ],
    "correct_option": "A",
    "explanation": "At mid-ocean ridges, hot asthenosphere upwells; the young oceanic lithosphere is warm and low in density, floating high. As it moves away, it cools conductively, thickens, and densifies, subsiding isostatically into deeper abyssal plains. This is the primary example of thermal isostasy in modern geophysics.",
    "question_type": "FACTUAL",
    "display_order": 10,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "An area characterized by a strong positive isostatic gravity anomaly indicates which of the following?",
    "options": [
      {"label": "A", "text": "The region has completely achieved static isostatic equilibrium"},
      {"label": "B", "text": "There is excess mass supported dynamically by tectonic forces, with a tendency for the crust to subside when stresses relax"},
      {"label": "C", "text": "The crust has an excessively deep root extending to the core-mantle boundary"},
      {"label": "D", "text": "The underlying mantle has zero viscosity"}
    ],
    "correct_option": "B",
    "explanation": "A positive isostatic anomaly indicates that measured gravity exceeds theoretical compensated gravity—meaning there is excess mass held up by tectonic or dynamic forces. Such areas are in disequilibrium and tend to subside when tectonic compression ceases.",
    "question_type": "STATEMENT_BASED",
    "display_order": 11,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements:\nAssertion (A): High mountain ranges like the Alps and Himalayas do not sink into the asthenosphere.\nReason (R): Low-density crustal roots displace denser mantle rock, generating an upward buoyant force equal to the mountain's weight.\nIn the context of the statements above, which one of the following is correct?",
    "options": [
      {"label": "A", "text": "Both A and R are true and R is the correct explanation of A"},
      {"label": "B", "text": "Both A and R are true but R is NOT the correct explanation of A"},
      {"label": "C", "text": "A is true but R is false"},
      {"label": "D", "text": "A is false but R is true"}
    ],
    "correct_option": "A",
    "explanation": "Both A and R are true, and R explains A. Mountain belts achieve hydrostatic balance in accordance with Archimedes' principle: their deep sialic roots displace denser simatic mantle material, providing the hydrostatic buoyancy needed to support high topography.",
    "question_type": "ASSERTION_REASON",
    "display_order": 12,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "During an ice age, what is the isostatic response of a continental landmass when covered by an ice sheet several kilometers thick?",
    "options": [
      {"label": "A", "text": "The crust immediately uplifts due to increased atmospheric pressure"},
      {"label": "B", "text": "The crust sags and subsides into the asthenosphere, causing outward lateral displacement of mantle material"},
      {"label": "C", "text": "The Moho boundary completely dissolves under the thermal blanket of ice"},
      {"label": "D", "text": "The continental plate fractures permanently into oceanic crust"}
    ],
    "correct_option": "B",
    "explanation": "Under the load of an ice sheet (such as in Greenland and Antarctica today), glacial loading depresses the lithosphere by hundreds of meters. The underlying asthenospheric mantle material flows laterally away from the depression, creating peripheral forebulges.",
    "question_type": "FACTUAL",
    "display_order": 13,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Which modern satellite mission has been extensively used by geophysicists to map temporal changes in Earth's gravity field caused by post-glacial isostatic rebound and ice sheet mass loss?",
    "options": [
      {"label": "A", "text": "GRACE (Gravity Recovery and Climate Experiment)"},
      {"label": "B", "text": "Hubble Space Telescope"},
      {"label": "C", "text": "Mars Reconnaissance Orbiter"},
      {"label": "D", "text": "INSAT-3DR"}
    ],
    "correct_option": "A",
    "explanation": "NASA-DLR's GRACE and GRACE-FO twin satellite missions measure minute fluctuations in Earth's gravity field caused by groundwater movement, melting glaciers, and post-glacial isostatic rebound across Fennoscandia and North America.",
    "question_type": "FACTUAL",
    "display_order": 14,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Arrange the following crustal environments in increasing order of typical crustal thickness (from thinnest to thickest):\n1. Continental shield/craton\n2. Oceanic basin crust\n3. Orogenic mountain belt (e.g., High Himalayas)\n4. Continental rift valley\nSelect the correct sequence:",
    "options": [
      {"label": "A", "text": "2 → 4 → 1 → 3"},
      {"label": "B", "text": "4 → 2 → 1 → 3"},
      {"label": "C", "text": "2 → 1 → 4 → 3"},
      {"label": "D", "text": "1 → 2 → 4 → 3"}
    ],
    "correct_option": "A",
    "explanation": "Oceanic crust is the thinnest (~5–8 km), followed by stretched continental crust in rift valleys (~20–25 km), stable continental shields/cratons (~35–40 km), and collision mountain belts like the Himalayas (>70 km thick due to deep crustal roots). Hence: 2 → 4 → 1 → 3.",
    "question_type": "CHRONOLOGICAL",
    "display_order": 15,
    "review_status": "REVIEWED"
  }
]

MCQS_TOPIC_27 = [
  {
    "question_text": "Consider the following gases present in Earth's atmosphere:\n1. Argon\n2. Carbon dioxide\n3. Neon\n4. Helium\nWhich of the following represents the correct descending order of their abundance by volume in dry air?",
    "options": [
      {"label": "A", "text": "Argon > Carbon dioxide > Neon > Helium"},
      {"label": "B", "text": "Carbon dioxide > Argon > Neon > Helium"},
      {"label": "C", "text": "Argon > Neon > Carbon dioxide > Helium"},
      {"label": "D", "text": "Carbon dioxide > Argon > Helium > Neon"}
    ],
    "correct_option": "A",
    "explanation": "The descending order of abundance by volume in dry air is: Nitrogen (78.08%) > Oxygen (20.95%) > Argon (0.93%) > Carbon dioxide (~0.04% / 420 ppm) > Neon (0.0018%) > Helium (0.0005%). Argon is the third most abundant gas, far exceeding CO₂.",
    "question_type": "FACTUAL",
    "display_order": 1,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements regarding the troposphere:\n1. Its thickness is greatest at the equator (16–18 km) and least at the poles (6–8 km).\n2. The environmental lapse rate in the troposphere is approximately 6.5°C per 1000 meters of ascent.\n3. Virtually all weather phenomena, including convection, cloud formation, and precipitation, are confined to this layer.\nWhich of the statements given above are correct?",
    "options": [
      {"label": "A", "text": "1 and 2 only"},
      {"label": "B", "text": "2 and 3 only"},
      {"label": "C", "text": "1 and 3 only"},
      {"label": "D", "text": "1, 2 and 3"}
    ],
    "correct_option": "D",
    "explanation": "All three statements are correct. Strong convectional currents transport heated air to greater heights at the equator, giving the troposphere a thickness of 16–18 km there versus only 6–8 km at the poles. The normal lapse rate is ~6.5°C/km, and 99% of atmospheric water vapour resides here, confining all weather events to the troposphere.",
    "question_type": "STATEMENT_BASED",
    "display_order": 2,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Why does temperature increase with increasing altitude in the stratosphere?",
    "options": [
      {"label": "A", "text": "Due to gravitational friction of descending meteorite fragments"},
      {"label": "B", "text": "Due to absorption of solar ultraviolet radiation by ozone molecules in the ozonosphere"},
      {"label": "C", "text": "Because the stratosphere is heated directly by conduction from Earth's core"},
      {"label": "D", "text": "Due to latent heat released during continuous cloud condensation"}
    ],
    "correct_option": "B",
    "explanation": "In the stratosphere, ozone (O₃) absorbs harmful ultraviolet radiation (UV-B and UV-C) from the Sun. This photochemical absorption releases heat, causing a temperature inversion where temperature rises from about −60°C at the tropopause to near 0°C at the stratopause.",
    "question_type": "FACTUAL",
    "display_order": 3,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Commercial jet aircraft typically prefer to cruise in the lower stratosphere. Which of the following best explains this preference?",
    "options": [
      {"label": "A", "text": "The presence of dense cumulus clouds provides aerodynamic lift"},
      {"label": "B", "text": "The absence of turbulent convective weather systems and presence of smooth, dry, stable air"},
      {"label": "C", "text": "The oxygen content is higher in the stratosphere than at sea level"},
      {"label": "D", "text": "The gravitational pull of the Earth is 50% weaker in the stratosphere"}
    ],
    "correct_option": "B",
    "explanation": "Because temperature increases with height in the stratosphere (temperature inversion), vertical convection is strongly suppressed. As a result, the stratosphere is free from convective clouds and turbulent weather, providing optimal flying conditions and fuel efficiency for jet aircraft.",
    "question_type": "STATEMENT_BASED",
    "display_order": 4,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements regarding the mesosphere:\n1. It extends between 50 km and 80 km above sea level.\n2. It is the coldest layer of the Earth's atmosphere, with temperatures dropping to nearly −100°C.\n3. Most meteors burn up in this layer due to atmospheric friction and compressional heating.\nHow many of the above statements are correct?",
    "options": [
      {"label": "A", "text": "Only one"},
      {"label": "B", "text": "Only two"},
      {"label": "C", "text": "All three"},
      {"label": "D", "text": "None"}
    ],
    "correct_option": "C",
    "explanation": "All three statements are correct. The mesosphere lies directly above the stratopause (50 km) up to the mesopause (80 km). Lacking ozone, temperature decreases continuously with height to ~−100°C (coldest atmospheric zone). Incoming meteors ignite and disintegrate here due to atmospheric ram pressure and friction.",
    "question_type": "STATEMENT_BASED",
    "display_order": 5,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "With reference to the thermosphere, consider the following statements:\n1. Temperatures can reach up to 1500°C or higher due to absorption of intense solar X-rays and short-wave UV radiation.\n2. An astronaut extending their hand into the thermosphere would experience intense scorching heat.\nWhich of the statements given above is/are correct?",
    "options": [
      {"label": "A", "text": "1 only"},
      {"label": "B", "text": "2 only"},
      {"label": "C", "text": "Both 1 and 2"},
      {"label": "D", "text": "Neither 1 nor 2"}
    ],
    "correct_option": "A",
    "explanation": "Statement 1 is correct: kinetic temperature is very high (>1500°C). Statement 2 is WRONG: temperature measures average kinetic energy of molecules, but because the air density is so near-vacuum, there are too few molecules colliding with an object to transfer measurable sensible heat. It would feel extremely cold to human touch.",
    "question_type": "STATEMENT_BASED",
    "display_order": 6,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "The ionosphere plays a crucial role in long-distance telecommunications on Earth because it:",
    "options": [
      {"label": "A", "text": "Absorbs solar wind completely to shield terrestrial radio transmitters"},
      {"label": "B", "text": "Contains electrically charged ions and free electrons that reflect medium and shortwave radio waves back to Earth"},
      {"label": "C", "text": "Converts infrared radiation into microwave signals"},
      {"label": "D", "text": "Generates permanent geomagnetic waves that guide optical fiber pulses"}
    ],
    "correct_option": "B",
    "explanation": "The ionosphere (extending across parts of the mesosphere and thermosphere from ~80 to 400 km) contains ionised gas layers (D, E, and F layers). These charged particles refract and reflect high-frequency radio waves back to Earth, enabling global skywave radio transmission.",
    "question_type": "FACTUAL",
    "display_order": 7,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements regarding atmospheric water vapour:\n1. Its concentration varies from almost zero in cold polar deserts to up to 4% by volume in warm, humid tropics.\n2. It decreases rapidly with increasing altitude; nearly half of all water vapour lies within 2 km of the surface.\n3. Water vapour acts as a powerful greenhouse gas by absorbing outgoing terrestrial infrared radiation.\nWhich of the statements given above are correct?",
    "options": [
      {"label": "A", "text": "1 and 2 only"},
      {"label": "B", "text": "2 and 3 only"},
      {"label": "C", "text": "1 and 3 only"},
      {"label": "D", "text": "1, 2 and 3"}
    ],
    "correct_option": "D",
    "explanation": "All three statements are correct. Water vapour is the most variable atmospheric constituent (0–4%), concentrated in the lowest 2 km. It is the single largest natural contributor to Earth's natural greenhouse effect and stores latent heat that drives atmospheric storms.",
    "question_type": "STATEMENT_BASED",
    "display_order": 8,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "What is the primary meteorological significance of solid aerosol and dust particles in the lower atmosphere?",
    "options": [
      {"label": "A", "text": "They convert atmospheric nitrogen into usable nitrates directly in clouds"},
      {"label": "B", "text": "They act as hygroscopic condensation nuclei around which water vapour condenses to form clouds and fog"},
      {"label": "C", "text": "They reflect 100% of solar radiation back into space, causing perpetual winter"},
      {"label": "D", "text": "They prevent the formation of tropical cyclones in coastal areas"}
    ],
    "correct_option": "B",
    "explanation": "Dust particles, sea salt crystals, and smoke particles function as hygroscopic (water-attracting) condensation nuclei. Without these nuclei, cloud droplet formation and precipitation would be impossible under normal atmospheric supersaturations.",
    "question_type": "FACTUAL",
    "display_order": 9,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "What is the internationally recognized 'Kármán line', and at what altitude does it lie?",
    "options": [
      {"label": "A", "text": "The boundary between the troposphere and stratosphere at 18 km"},
      {"label": "B", "text": "The altitude at 100 km above sea level, defining the conventional legal boundary between Earth's atmosphere and outer space"},
      {"label": "C", "text": "The deepest oceanic trench level at 11 km"},
      {"label": "D", "text": "The altitude of the maximum ozone concentration at 25 km"}
    ],
    "correct_option": "B",
    "explanation": "The Kármán line, established by the Fédération Aéronautique Internationale (FAI) at an altitude of 100 km (in the lower thermosphere), represents the threshold where atmospheric air is too thin to provide aerodynamic lift for conventional aeronautical flight, designating the boundary of outer space.",
    "question_type": "FACTUAL",
    "display_order": 10,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Rare and luminous 'noctilucent clouds' (night-shining clouds) are observed during summer twilight at high latitudes. In which layer of the atmosphere do they form?",
    "options": [
      {"label": "A", "text": "Troposphere"},
      {"label": "B", "text": "Lower Stratosphere"},
      {"label": "C", "text": "Upper Mesosphere near the mesopause"},
      {"label": "D", "text": "Exosphere"}
    ],
    "correct_option": "C",
    "explanation": "Noctilucent clouds are the highest clouds in Earth's atmosphere, forming in the upper mesosphere at altitudes of 75–85 km. They consist of tiny ice crystals nucleated on micrometeoritic dust at temperatures below −120°C and are illuminated by sunlight from below the horizon.",
    "question_type": "FACTUAL",
    "display_order": 11,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Consider the following statements regarding auroral displays (Aurora Borealis and Aurora Australis):\n1. They occur predominantly in the thermosphere/ionosphere at high geomagnetic latitudes.\n2. They are produced when charged solar wind particles collide with atmospheric oxygen and nitrogen atoms.\nWhich of the statements given above is/are correct?",
    "options": [
      {"label": "A", "text": "1 only"},
      {"label": "B", "text": "2 only"},
      {"label": "C", "text": "Both 1 and 2"},
      {"label": "D", "text": "Neither 1 nor 2"}
    ],
    "correct_option": "C",
    "explanation": "Both statements are correct. Auroras occur between 90 and 300 km altitude (thermosphere/ionosphere) when solar wind electrons guided along Earth's geomagnetic field lines excite nitrogen (emitting blue/violet) and oxygen atoms (emitting green/red).",
    "question_type": "STATEMENT_BASED",
    "display_order": 12,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Why does carbon dioxide (CO₂) function as a major greenhouse gas despite being transparent to visible light?",
    "options": [
      {"label": "A", "text": "It absorbs incoming shortwave solar radiation and reflects it sideways"},
      {"label": "B", "text": "It is transparent to incoming shortwave solar radiation but strongly absorbs outgoing longwave terrestrial infrared radiation"},
      {"label": "C", "text": "It combines chemically with nitrogen to produce thermal plasma"},
      {"label": "D", "text": "It accelerates the speed of solar wind particles inside clouds"}
    ],
    "correct_option": "B",
    "explanation": "Carbon dioxide is selective in radiation absorption: it allows shortwave solar radiation (visible and near-UV) to pass through to heat the surface, but strongly absorbs outgoing longwave infrared radiation emitted by the Earth, re-radiating heat back towards the surface.",
    "question_type": "STATEMENT_BASED",
    "display_order": 13,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Approximately what percentage of the total mass of the Earth's atmosphere is concentrated within the lowest 32 kilometers from sea level?",
    "options": [
      {"label": "A", "text": "50%"},
      {"label": "B", "text": "75%"},
      {"label": "C", "text": "90%"},
      {"label": "D", "text": "99%"}
    ],
    "correct_option": "D",
    "explanation": "Because atmospheric gases are highly compressible and held by Earth's gravity, atmospheric density decreases exponentially with altitude. Approximately 50% of atmospheric mass lies within the first 5.6 km, and 99% of total mass is confined within 32 km.",
    "question_type": "FACTUAL",
    "display_order": 14,
    "review_status": "REVIEWED"
  },
  {
    "question_text": "Arrange the thermal layers of the Earth's atmosphere in order from the surface upward:\n1. Mesosphere\n2. Stratosphere\n3. Troposphere\n4. Thermosphere\nSelect the correct sequence:",
    "options": [
      {"label": "A", "text": "3 → 2 → 1 → 4"},
      {"label": "B", "text": "3 → 1 → 2 → 4"},
      {"label": "C", "text": "2 → 3 → 1 → 4"},
      {"label": "D", "text": "3 → 2 → 4 → 1"}
    ],
    "correct_option": "A",
    "explanation": "The order of thermal layers starting from sea level upward is: Troposphere (0 to 12–18 km) → Stratosphere (18 to 50 km) → Mesosphere (50 to 80 km) → Thermosphere (80 to ~700 km). Hence: 3 → 2 → 1 → 4.",
    "question_type": "CHRONOLOGICAL",
    "display_order": 15,
    "review_status": "REVIEWED"
  }
]

def update_topic_26():
    file_path = UPGRADED_DIR / "26_isostasy.json"
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["mcq_questions"] = MCQS_TOPIC_26
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {file_path.name} with {len(MCQS_TOPIC_26)} MCQs.")

def update_topic_27():
    file_path = UPGRADED_DIR / "27_atmosphere_structure_composition.json"
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["mcq_questions"] = MCQS_TOPIC_27
    for pyq in data.get("pyqs", []):
        if pyq.get("exam_type") == "MAINS" and not pyq.get("explanation"):
            pyq["explanation"] = (
                "Key Mains answer structure: Introduce with definition of atmosphere and total mass distribution "
                "(99% within 32 km) → Detail major permanent constituents (N₂, O₂, Ar) and variable constituents "
                "(CO₂, water vapour, ozone, dust) with their biological and meteorological significance → Link "
                "composition directly to human life (respiration, UV protection, natural greenhouse warming) and "
                "weather systems (cyclones, precipitation, albedo) → Conclude with anthropogenic impacts like "
                "global warming, air pollution, and ozone depletion."
            )
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {file_path.name} with {len(MCQS_TOPIC_27)} MCQs and fixed Mains PYQ explanation.")

def update_compiled_syllabus():
    with open(SYLLABUS_FILE, "r", encoding="utf-8") as f:
        syllabus = json.load(f)

    def walk(nodes):
        for n in nodes:
            yield n
            yield from walk(n.get("children", []))

    for node in walk(syllabus["tree"]):
        title = node.get("title", "")
        if "Isostasy" in title:
            node["mcq_questions"] = MCQS_TOPIC_26
            print("Updated Isostasy in compiled syllabus.")
        elif "Atmosphere" in title:
            node["mcq_questions"] = MCQS_TOPIC_27
            for pyq in node.get("pyqs", []):
                if pyq.get("exam_type") == "MAINS" and not pyq.get("explanation"):
                    pyq["explanation"] = (
                        "Key Mains answer structure: Introduce with definition of atmosphere and total mass distribution "
                        "(99% within 32 km) → Detail major permanent constituents (N₂, O₂, Ar) and variable constituents "
                        "(CO₂, water vapour, ozone, dust) with their biological and meteorological significance → Link "
                        "composition directly to human life (respiration, UV protection, natural greenhouse warming) and "
                        "weather systems (cyclones, precipitation, albedo) → Conclude with anthropogenic impacts like "
                        "global warming, air pollution, and ozone depletion."
                    )
            print("Updated Atmosphere in compiled syllabus.")

    with open(SYLLABUS_FILE, "w", encoding="utf-8") as f:
        json.dump(syllabus, f, ensure_ascii=False, indent=2)
    print("Compiled syllabus updated successfully.")

if __name__ == "__main__":
    update_topic_26()
    update_topic_27()
    update_compiled_syllabus()
