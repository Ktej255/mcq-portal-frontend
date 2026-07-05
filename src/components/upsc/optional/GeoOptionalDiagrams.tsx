import type { DiagramId } from "@/lib/upsc/optional/geographyOptionalTypes";

/**
 * Hand-drawn (pencil-style) SVG diagrams for the Geography Optional notes.
 * A single feTurbulence/displacement filter gives every stroke a sketchy,
 * "drawn by hand" wobble to match the personal-notes aesthetic.
 */

function RoughDefs() {
  return (
    <defs>
      <filter id="goRough">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" result="noise" seed="7" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
      </filter>
    </defs>
  );
}

function EndoExoBalance() {
  return (
    <svg viewBox="0 0 420 220" className="h-auto w-full max-w-xl">
      <RoughDefs />
      {/* fulcrum */}
      <path className="go-pencil" d="M210 170 L190 200 L230 200 Z" />
      {/* beam */}
      <path className="go-pencil" d="M70 120 L350 100" />
      {/* left pan - build up */}
      <path className="go-pencil go-pencil-fill-red" d="M55 120 q25 40 50 0 Z" />
      <path className="go-pencil" d="M80 120 L80 150 M80 150 q-15 20 0 25 q15 -5 0 -25" />
      <text x="38" y="95" className="go-ink-label" fontSize="14">ENDOGENETIC ↑</text>
      <text x="40" y="200" className="go-ink-label" fontSize="12">uplift • fold • erupt</text>
      {/* right pan - wear down */}
      <path className="go-pencil go-pencil-fill-blue" d="M315 100 q25 40 50 0 Z" />
      <text x="300" y="78" className="go-ink-label" fontSize="14">EXOGENETIC ↓</text>
      <text x="290" y="200" className="go-ink-label" fontSize="12">weather • erode • deposit</text>
      <text x="150" y="35" className="go-ink-label go-hand" fontSize="20">the relief see-saw</text>
    </svg>
  );
}

function PlateBoundaries() {
  return (
    <svg viewBox="0 0 460 230" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      {/* divergent */}
      <text x="20" y="24" className="go-ink-label go-hand" fontSize="16">Divergent</text>
      <path className="go-pencil go-pencil-fill-amber" d="M20 70 L80 70 L80 95 L20 95 Z" />
      <path className="go-pencil go-pencil-fill-amber" d="M100 70 L160 70 L160 95 L100 95 Z" />
      <path className="go-pencil" d="M82 82 L70 60 M98 82 L110 60" />
      <text x="58" y="55" className="go-ink-label" fontSize="13">ridge</text>
      {/* convergent */}
      <text x="180" y="24" className="go-ink-label go-hand" fontSize="16">Convergent</text>
      <path className="go-pencil go-pencil-fill-green" d="M180 75 L250 75 L250 100 L180 100 Z" />
      <path className="go-pencil go-pencil-fill-blue" d="M255 78 L320 92 L320 108 L255 100 Z" />
      <path className="go-pencil" d="M255 100 L290 130" />
      <path className="go-pencil" d="M214 75 L210 58 L222 64 L214 75" />
      <text x="196" y="52" className="go-ink-label" fontSize="12">fold mtns</text>
      <text x="270" y="128" className="go-ink-label" fontSize="12">trench</text>
      {/* transform */}
      <text x="345" y="24" className="go-ink-label go-hand" fontSize="16">Transform</text>
      <path className="go-pencil" d="M350 85 L440 85" />
      <path className="go-pencil" d="M395 60 L405 60 M395 60 L398 110 M405 60 L402 110" />
      <text x="360" y="130" className="go-ink-label" fontSize="12">slide past →</text>
      <text x="40" y="175" className="go-ink-label" fontSize="13">crust made</text>
      <text x="190" y="175" className="go-ink-label" fontSize="13">crust destroyed</text>
      <text x="350" y="175" className="go-ink-label" fontSize="13">crust conserved</text>
      <text x="120" y="210" className="go-ink-label go-hand" fontSize="18">3 boundaries → 3 landform families</text>
    </svg>
  );
}

function IsostasyAiryPratt() {
  return (
    <svg viewBox="0 0 460 220" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      <text x="20" y="22" className="go-ink-label go-hand" fontSize="16">AIRY</text>
      <text x="20" y="40" className="go-ink-label" fontSize="11">same density, deep roots</text>
      {/* airy blocks of differing heights with roots */}
      <path className="go-pencil go-pencil-fill-green" d="M20 70 L55 70 L55 150 L40 175 L35 175 L20 150 Z" />
      <path className="go-pencil go-pencil-fill-green" d="M65 90 L100 90 L100 140 L92 155 L73 155 L65 140 Z" />
      <path className="go-pencil go-pencil-fill-green" d="M110 105 L150 105 L150 132 L142 142 L118 142 L110 132 Z" />
      <path className="go-pencil" d="M15 70 L160 70" strokeDasharray="3 5" />
      <text x="158" y="68" className="go-ink-label" fontSize="10">sea level</text>
      {/* pratt */}
      <text x="270" y="22" className="go-ink-label go-hand" fontSize="16">PRATT</text>
      <text x="270" y="40" className="go-ink-label" fontSize="11">same base, varying density</text>
      <path className="go-pencil go-pencil-fill-red" d="M270 60 L300 60 L300 150 L270 150 Z" />
      <path className="go-pencil go-pencil-fill-amber" d="M305 78 L335 78 L335 150 L305 150 Z" />
      <path className="go-pencil go-pencil-fill-green" d="M340 92 L370 92 L370 150 L340 150 Z" />
      <path className="go-pencil go-pencil-fill-blue" d="M375 104 L405 104 L405 150 L375 150 Z" />
      <path className="go-pencil" d="M262 150 L412 150" />
      <text x="300" y="170" className="go-ink-label" fontSize="11">level of compensation</text>
      <text x="40" y="205" className="go-ink-label go-hand" fontSize="16">crust floats on denser mantle</text>
    </svg>
  );
}

function DavisPenckCycle() {
  return (
    <svg viewBox="0 0 460 220" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      <text x="20" y="22" className="go-ink-label go-hand" fontSize="16">Davis — slope decline</text>
      <path className="go-pencil" d="M20 90 L60 55 L100 90" />
      <path className="go-pencil" d="M20 110 L60 82 L100 110" strokeDasharray="4 4" />
      <path className="go-pencil" d="M20 130 q40 -12 80 0" strokeDasharray="2 5" />
      <text x="105" y="60" className="go-ink-label" fontSize="11">youth</text>
      <text x="105" y="92" className="go-ink-label" fontSize="11">mature</text>
      <text x="105" y="132" className="go-ink-label" fontSize="11">peneplain</text>
      <path className="go-pencil" d="M150 130 q15 4 30 0" />
      <text x="150" y="150" className="go-ink-label" fontSize="10">monadnock →</text>
      {/* King */}
      <text x="250" y="22" className="go-ink-label go-hand" fontSize="16">King — parallel retreat</text>
      <path className="go-pencil go-pencil-fill-amber" d="M250 90 L290 55 L300 90 Z" />
      <path className="go-pencil" d="M330 90 L370 60 L378 90" strokeDasharray="4 4" />
      <path className="go-pencil" d="M250 110 L440 110" />
      <path className="go-pencil" d="M300 90 q60 18 130 20" />
      <text x="350" y="135" className="go-ink-label" fontSize="11">pediment → pediplain</text>
      <text x="300" y="50" className="go-ink-label" fontSize="10">scarp →</text>
      <text x="40" y="205" className="go-ink-label go-hand" fontSize="15">downwearing vs backwearing</text>
    </svg>
  );
}

function SlopeElements() {
  return (
    <svg viewBox="0 0 420 220" className="h-auto w-full max-w-xl">
      <RoughDefs />
      <path className="go-pencil" d="M40 60 q20 -10 45 -8" />
      <path className="go-pencil" d="M85 52 L120 120" />
      <path className="go-pencil" d="M120 120 L210 165" />
      <path className="go-pencil" d="M210 165 q70 12 160 14" />
      <text x="36" y="48" className="go-ink-label" fontSize="12">waxing crest</text>
      <text x="125" y="92" className="go-ink-label" fontSize="12">free face</text>
      <text x="150" y="160" className="go-ink-label" fontSize="12">debris (constant) slope</text>
      <text x="250" y="195" className="go-ink-label" fontSize="12">waning pediment</text>
      <text x="60" y="210" className="go-ink-label go-hand" fontSize="16">the 4-element hillslope</text>
    </svg>
  );
}

function ChannelPatterns() {
  return (
    <svg viewBox="0 0 460 220" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      <path className="go-pencil go-pencil-fill-blue" d="M20 40 L150 36 L150 50 L20 54 Z" />
      <text x="160" y="50" className="go-ink-label" fontSize="12">straight</text>
      <path className="go-pencil" d="M20 90 q30 -22 60 0 q30 22 60 0 q30 -22 50 0" />
      <text x="200" y="92" className="go-ink-label" fontSize="12">meandering</text>
      <path className="go-pencil" d="M20 140 q30 -14 60 0 q30 14 60 -2" />
      <path className="go-pencil" d="M20 150 q30 14 60 0 q30 -12 60 2" />
      <path className="go-pencil" d="M40 145 q20 -6 40 0" />
      <text x="200" y="148" className="go-ink-label" fontSize="12">braided (high load)</text>
      <path className="go-pencil" d="M20 188 q40 -10 70 0 q40 10 70 0" />
      <path className="go-pencil" d="M40 188 q35 16 70 6" />
      <text x="200" y="192" className="go-ink-label" fontSize="12">anastomosing</text>
      <text x="280" y="120" className="go-ink-label go-hand" fontSize="15">energy / sediment →</text>
    </svg>
  );
}

function HeatBudget() {
  return (
    <svg viewBox="0 0 460 230" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      {/* sun */}
      <path className="go-pencil go-pencil-fill-amber" d="M40 40 a18 18 0 1 0 0.1 0 Z" />
      <text x="24" y="30" className="go-ink-label go-hand" fontSize="14">Sun</text>
      {/* incoming 100 */}
      <path className="go-pencil" d="M58 52 L200 120" />
      <text x="95" y="78" className="go-ink-label" fontSize="12">incoming 100</text>
      {/* earth surface */}
      <path className="go-pencil go-pencil-fill-green" d="M150 150 L430 150 L430 175 L150 175 Z" />
      <text x="250" y="168" className="go-ink-label" fontSize="12">EARTH SURFACE</text>
      {/* reflected (albedo) */}
      <path className="go-pencil" d="M205 120 L300 55" strokeDasharray="4 4" />
      <text x="250" y="50" className="go-ink-label" fontSize="12">reflected 35 (albedo)</text>
      {/* absorbed */}
      <text x="160" y="140" className="go-ink-label" fontSize="11">absorbed 51 (surface)</text>
      <text x="300" y="140" className="go-ink-label" fontSize="11">+14 atmosphere</text>
      {/* outgoing terrestrial */}
      <path className="go-pencil" d="M390 150 L405 70" />
      <text x="395" y="60" className="go-ink-label" fontSize="11">outgoing 65 ↑</text>
      <text x="60" y="210" className="go-ink-label go-hand" fontSize="16">balance: in 100 = out (35 + 65)</text>
    </svg>
  );
}

function TricellularCirculation() {
  return (
    <svg viewBox="0 0 300 240" className="h-auto w-full max-w-md">
      <RoughDefs />
      {/* earth quarter arc */}
      <path className="go-pencil" d="M40 220 A180 180 0 0 1 220 40" />
      {/* latitude ticks + cells */}
      <text x="225" y="210" className="go-ink-label" fontSize="11">0° ITCZ (L)</text>
      <path className="go-pencil" d="M150 165 q22 -18 0 -36" />
      <path className="go-pencil" d="M150 129 l-4 6 m4 -6 l5 4" />
      <text x="120" y="150" className="go-ink-label" fontSize="11">Hadley</text>
      <text x="180" y="150" className="go-ink-label" fontSize="11">30° (H)</text>
      <path className="go-pencil" d="M118 120 q22 -18 0 -34" />
      <text x="80" y="112" className="go-ink-label" fontSize="11">Ferrel</text>
      <text x="135" y="106" className="go-ink-label" fontSize="11">60° (L)</text>
      <path className="go-pencil" d="M86 84 q18 -16 0 -30" />
      <text x="50" y="78" className="go-ink-label" fontSize="11">Polar</text>
      <text x="92" y="56" className="go-ink-label" fontSize="11">90° (H)</text>
      <text x="40" y="235" className="go-ink-label go-hand" fontSize="15">tri-cellular circulation</text>
    </svg>
  );
}

function AirMassFronts() {
  return (
    <svg viewBox="0 0 460 220" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      {/* warm sector */}
      <path className="go-pencil go-pencil-fill-red" d="M60 150 q120 -40 260 0 Z" />
      {/* cold front (triangles) */}
      <path className="go-pencil" d="M60 150 L150 95" />
      <path className="go-pencil go-pencil-fill-blue" d="M85 132 l8 -5 l2 9 Z" />
      <path className="go-pencil go-pencil-fill-blue" d="M110 116 l8 -5 l2 9 Z" />
      <text x="55" y="90" className="go-ink-label" fontSize="11">cold front ▲</text>
      {/* warm front (semicircles) */}
      <path className="go-pencil" d="M150 95 q90 -30 170 5" />
      <path className="go-pencil go-pencil-fill-red" d="M200 80 a5 5 0 0 1 10 0 Z" />
      <path className="go-pencil go-pencil-fill-red" d="M240 78 a5 5 0 0 1 10 0 Z" />
      <text x="250" y="70" className="go-ink-label" fontSize="11">warm front ◗</text>
      <text x="150" y="170" className="go-ink-label" fontSize="12">warm sector</text>
      <text x="320" y="120" className="go-ink-label" fontSize="11">L (low)</text>
      <text x="60" y="205" className="go-ink-label go-hand" fontSize="15">mid-latitude (temperate) cyclone</text>
    </svg>
  );
}

function KoppenClimate() {
  return (
    <svg viewBox="0 0 360 220" className="h-auto w-full max-w-lg">
      <RoughDefs />
      <path className="go-pencil" d="M30 30 L30 190" />
      {[
        ["A", "Tropical", 45, "go-pencil-fill-green"],
        ["B", "Dry", 73, "go-pencil-fill-amber"],
        ["C", "Warm temperate", 101, "go-pencil-fill-green"],
        ["D", "Cold (continental)", 129, "go-pencil-fill-blue"],
        ["E", "Polar", 157, "go-pencil-fill-blue"],
      ].map(([code, name, y, fill]) => (
        <g key={code as string}>
          <path className={`go-pencil ${fill}`} d={`M30 ${(y as number) - 11} L52 ${(y as number) - 11} L52 ${(y as number) + 6} L30 ${(y as number) + 6} Z`} />
          <text x="36" y={(y as number) + 2} className="go-ink-label" fontSize="13">{code as string}</text>
          <text x="64" y={(y as number) + 2} className="go-ink-label" fontSize="12">{name as string}</text>
        </g>
      ))}
      <text x="40" y="210" className="go-ink-label go-hand" fontSize="15">Köppen: 5 climate groups (A–E)</text>
    </svg>
  );
}

function UrbanHeatIsland() {
  return (
    <svg viewBox="0 0 460 210" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      {/* temperature profile curve */}
      <path className="go-pencil go-pencil-fill-red" d="M30 160 L110 150 Q150 150 160 110 L300 110 Q330 110 340 150 L430 158 L430 175 L30 175 Z" />
      {/* skyline */}
      <path className="go-pencil" d="M170 110 L170 80 L185 80 L185 110 M200 110 L200 70 L215 70 L215 110 M235 110 L235 85 L250 85 L250 110" />
      <text x="40" y="148" className="go-ink-label" fontSize="11">rural</text>
      <text x="200" y="60" className="go-ink-label" fontSize="11">city core (warm)</text>
      <text x="380" y="150" className="go-ink-label" fontSize="11">suburb</text>
      <path className="go-pencil" d="M20 175 L20 60" />
      <text x="6" y="55" className="go-ink-label" fontSize="10">°C</text>
      <text x="60" y="200" className="go-ink-label go-hand" fontSize="15">Urban Heat Island profile</text>
    </svg>
  );
}

function OceanRelief() {
  return (
    <svg viewBox="0 0 470 220" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      {/* sea level */}
      <path className="go-pencil" d="M20 40 L450 40" strokeDasharray="3 5" />
      <text x="20" y="34" className="go-ink-label" fontSize="10">sea level</text>
      {/* profile: shelf -> slope -> rise -> abyssal plain -> trench -> ridge */}
      <path className="go-pencil go-pencil-fill-blue" d="M20 40 L20 70 L90 78 L150 150 L210 168 L300 170 L330 200 L360 168 L400 150 L430 165 L450 165 L450 40 Z" />
      <text x="30" y="92" className="go-ink-label" fontSize="11">cont. shelf</text>
      <text x="120" y="120" className="go-ink-label" fontSize="11">slope</text>
      <text x="225" y="160" className="go-ink-label" fontSize="11">abyssal plain</text>
      <text x="310" y="215" className="go-ink-label" fontSize="11">trench</text>
      <text x="385" y="140" className="go-ink-label" fontSize="11">mid-ocean ridge</text>
      <text x="60" y="20" className="go-ink-label go-hand" fontSize="15">ocean-floor relief profile</text>
    </svg>
  );
}

function SalinityProfile() {
  return (
    <svg viewBox="0 0 360 220" className="h-auto w-full max-w-md">
      <RoughDefs />
      <path className="go-pencil" d="M50 30 L50 190 L330 190" />
      <text x="20" y="110" className="go-ink-label" fontSize="11" transform="rotate(-90 20 110)">depth →</text>
      <text x="150" y="208" className="go-ink-label" fontSize="11">temperature →</text>
      {/* warm mixed layer, thermocline, cold deep */}
      <path className="go-pencil go-pencil-fill-red" d="M250 40 L250 80" />
      <path className="go-pencil go-pencil-fill-amber" d="M250 80 Q170 110 90 150" />
      <path className="go-pencil go-pencil-fill-blue" d="M90 150 L90 190" />
      <text x="255" y="60" className="go-ink-label" fontSize="11">mixed layer (warm)</text>
      <text x="150" y="120" className="go-ink-label" fontSize="11">thermocline</text>
      <text x="95" y="175" className="go-ink-label" fontSize="11">deep (cold)</text>
      <text x="70" y="22" className="go-ink-label go-hand" fontSize="15">thermocline / halocline</text>
    </svg>
  );
}

function OceanGyres() {
  return (
    <svg viewBox="0 0 420 230" className="h-auto w-full max-w-lg">
      <RoughDefs />
      {/* basin */}
      <path className="go-pencil" d="M40 30 L380 30 L380 200 L40 200 Z" />
      {/* equator */}
      <path className="go-pencil" d="M40 150 L380 150" strokeDasharray="4 5" />
      <text x="385" y="153" className="go-ink-label" fontSize="10">eq</text>
      {/* N gyre clockwise */}
      <path className="go-pencil go-pencil-fill-red" d="M120 60 Q300 55 300 100 Q300 135 130 130 Q90 95 120 60 Z" />
      <text x="160" y="100" className="go-ink-label" fontSize="11">subtropical gyre (CW)</text>
      <path className="go-pencil" d="M300 80 l6 8 l-9 3" />
      {/* warm/cold labels */}
      <text x="95" y="55" className="go-ink-label" fontSize="10">warm W-boundary →</text>
      <text x="305" y="125" className="go-ink-label" fontSize="10">cold E-boundary</text>
      <text x="60" y="222" className="go-ink-label go-hand" fontSize="15">wind-driven gyre + Coriolis</text>
    </svg>
  );
}

function CoralReefTypes() {
  return (
    <svg viewBox="0 0 460 200" className="h-auto w-full max-w-2xl">
      <RoughDefs />
      {/* fringing */}
      <path className="go-pencil go-pencil-fill-green" d="M40 120 L90 70 L140 120 Z" />
      <path className="go-pencil go-pencil-fill-amber" d="M30 120 L150 120" />
      <text x="55" y="140" className="go-ink-label" fontSize="11">fringing</text>
      {/* barrier */}
      <path className="go-pencil go-pencil-fill-green" d="M190 120 L225 80 L260 120 Z" />
      <path className="go-pencil" d="M170 120 L290 120" />
      <path className="go-pencil go-pencil-fill-amber" d="M175 120 l6 -8 m120 8 l-6 -8" />
      <text x="195" y="140" className="go-ink-label" fontSize="11">barrier (+ lagoon)</text>
      {/* atoll */}
      <path className="go-pencil go-pencil-fill-amber" d="M360 120 a40 16 0 1 0 0.1 0 Z" />
      <path className="go-pencil go-pencil-fill-blue" d="M385 120 a14 6 0 1 0 0.1 0 Z" />
      <text x="345" y="150" className="go-ink-label" fontSize="11">atoll (ring)</text>
      <text x="60" y="185" className="go-ink-label go-hand" fontSize="15">Darwin's subsidence theory</text>
    </svg>
  );
}

function TidesSpringNeap() {
  return (
    <svg viewBox="0 0 440 220" className="h-auto w-full max-w-lg">
      <RoughDefs />
      {/* earth */}
      <path className="go-pencil go-pencil-fill-blue" d="M190 90 a30 30 0 1 0 0.1 0 Z" />
      <text x="205" y="95" className="go-ink-label" fontSize="11">Earth</text>
      {/* spring: sun-moon aligned */}
      <path className="go-pencil go-pencil-fill-amber" d="M40 90 a14 14 0 1 0 0.1 0 Z" />
      <text x="30" y="70" className="go-ink-label" fontSize="10">Sun</text>
      <path className="go-pencil" d="M300 90 a10 10 0 1 0 0.1 0 Z" />
      <text x="300" y="72" className="go-ink-label" fontSize="10">Moon</text>
      <path className="go-pencil" d="M70 90 L160 90 M250 90 L290 90" strokeDasharray="3 4" />
      <text x="60" y="150" className="go-ink-label" fontSize="11">SPRING tide: Sun–Moon aligned (new/full)</text>
      <text x="60" y="200" className="go-ink-label go-hand" fontSize="14">NEAP tide: Sun–Moon at right angles</text>
    </svg>
  );
}

function SoilProfile() {
  return (
    <svg viewBox="0 0 320 250" className="h-auto w-full max-w-md">
      <RoughDefs />
      {[
        ["O", "humus / litter", 40, 22, "go-pencil-fill-green"],
        ["A", "topsoil (eluviation)", 62, 34, "go-pencil-fill-amber"],
        ["E", "leached zone", 96, 22, "go-pencil-fill-amber"],
        ["B", "subsoil (illuviation)", 118, 40, "go-pencil-fill-red"],
        ["C", "weathered parent", 158, 34, "go-pencil-fill-blue"],
        ["R", "bedrock", 192, 26, "go-pencil-fill-blue"],
      ].map(([code, label, y, h, fill]) => (
        <g key={code as string}>
          <path className={`go-pencil ${fill}`} d={`M60 ${y as number} L210 ${y as number} L210 ${(y as number) + (h as number)} L60 ${(y as number) + (h as number)} Z`} />
          <text x="36" y={(y as number) + (h as number) / 2 + 4} className="go-ink-label" fontSize="14">{code as string}</text>
          <text x="218" y={(y as number) + (h as number) / 2 + 4} className="go-ink-label" fontSize="11">{label as string}</text>
        </g>
      ))}
      <text x="50" y="238" className="go-ink-label go-hand" fontSize="15">soil profile — O A E B C R horizons</text>
    </svg>
  );
}

function WorldBiomes() {
  return (
    <svg viewBox="0 0 360 240" className="h-auto w-full max-w-md">
      <RoughDefs />
      <path className="go-pencil" d="M40 30 L40 200 L330 200" />
      <text x="14" y="120" className="go-ink-label" fontSize="11" transform="rotate(-90 14 120)">latitude / altitude →</text>
      {[
        ["Tundra", 48, "go-pencil-fill-blue"],
        ["Taiga (boreal)", 76, "go-pencil-fill-green"],
        ["Temperate forest", 104, "go-pencil-fill-green"],
        ["Grassland / steppe", 132, "go-pencil-fill-amber"],
        ["Desert", 160, "go-pencil-fill-amber"],
        ["Tropical rainforest", 188, "go-pencil-fill-green"],
      ].map(([name, y, fill]) => (
        <g key={name as string}>
          <path className={`go-pencil ${fill}`} d={`M44 ${(y as number) - 10} L120 ${(y as number) - 10} L120 ${(y as number) + 4} L44 ${(y as number) + 4} Z`} />
          <text x="128" y={(y as number)} className="go-ink-label" fontSize="11">{name as string}</text>
        </g>
      ))}
      <text x="50" y="226" className="go-ink-label go-hand" fontSize="14">biomes shift with temperature & rainfall</text>
    </svg>
  );
}

function EcologicalPyramid() {
  return (
    <svg viewBox="0 0 360 230" className="h-auto w-full max-w-md">
      <RoughDefs />
      <path className="go-pencil go-pencil-fill-green" d="M40 190 L320 190 L300 150 L60 150 Z" />
      <text x="120" y="178" className="go-ink-label" fontSize="11">producers (autotrophs)</text>
      <path className="go-pencil go-pencil-fill-amber" d="M70 150 L290 150 L265 110 L95 110 Z" />
      <text x="120" y="138" className="go-ink-label" fontSize="11">primary consumers</text>
      <path className="go-pencil go-pencil-fill-red" d="M105 110 L255 110 L230 75 L130 75 Z" />
      <text x="135" y="98" className="go-ink-label" fontSize="11">secondary consumers</text>
      <path className="go-pencil go-pencil-fill-blue" d="M140 75 L220 75 L195 45 L165 45 Z" />
      <text x="150" y="64" className="go-ink-label" fontSize="10">top carnivores</text>
      <text x="300" y="120" className="go-ink-label" fontSize="11">~10% energy ↑</text>
      <text x="55" y="218" className="go-ink-label go-hand" fontSize="15">trophic energy pyramid</text>
    </svg>
  );
}

function SoilConservation() {
  return (
    <svg viewBox="0 0 380 220" className="h-auto w-full max-w-lg">
      <RoughDefs />
      {/* hill slope */}
      <path className="go-pencil" d="M30 180 Q120 60 350 50" />
      {/* contour terraces (steps) */}
      <path className="go-pencil go-pencil-fill-green" d="M70 150 q40 -6 80 -2" />
      <path className="go-pencil go-pencil-fill-green" d="M110 120 q40 -6 80 -2" />
      <path className="go-pencil go-pencil-fill-green" d="M150 92 q40 -6 80 -2" />
      <text x="190" y="150" className="go-ink-label" fontSize="11">contour bunds / terraces</text>
      {/* shelter trees */}
      <path className="go-pencil go-pencil-fill-green" d="M60 180 l8 -16 l8 16 Z" />
      <path className="go-pencil go-pencil-fill-green" d="M300 60 l8 -16 l8 16 Z" />
      <text x="260" y="40" className="go-ink-label" fontSize="11">afforestation / shelter belt</text>
      <text x="50" y="208" className="go-ink-label go-hand" fontSize="15">soil conservation on slopes</text>
    </svg>
  );
}

function EcosystemStructure() {
  return (
    <svg viewBox="0 0 420 230" className="h-auto w-full max-w-lg">
      <RoughDefs />
      <path className="go-pencil go-pencil-fill-amber" d="M30 40 a16 16 0 1 0 0.1 0 Z" />
      <text x="20" y="28" className="go-ink-label" fontSize="11">Sun</text>
      <path className="go-pencil go-pencil-fill-green" d="M120 70 L240 70 L240 100 L120 100 Z" />
      <text x="132" y="89" className="go-ink-label" fontSize="11">Producers</text>
      <path className="go-pencil go-pencil-fill-red" d="M120 130 L240 130 L240 160 L120 160 Z" />
      <text x="130" y="149" className="go-ink-label" fontSize="11">Consumers</text>
      <path className="go-pencil go-pencil-fill-blue" d="M120 185 L300 185 L300 212 L120 212 Z" />
      <text x="130" y="203" className="go-ink-label" fontSize="11">Decomposers → nutrients recycled</text>
      <path className="go-pencil" d="M46 50 L120 80" />
      <path className="go-pencil" d="M180 100 L180 130" />
      <path className="go-pencil" d="M180 160 L180 185" />
      <path className="go-pencil" d="M300 200 q60 -60 -110 -110" strokeDasharray="3 5" />
      <text x="300" y="120" className="go-ink-label" fontSize="10">nutrient cycle ↺</text>
      <text x="40" y="226" className="go-ink-label go-hand" fontSize="14">ecosystem: energy flows, nutrients cycle</text>
    </svg>
  );
}

function BiogeochemicalCycle() {
  return (
    <svg viewBox="0 0 380 230" className="h-auto w-full max-w-md">
      <RoughDefs />
      <path className="go-pencil" d="M190 120 m-90 0 a90 70 0 1 0 180 0 a90 70 0 1 0 -180 0" />
      <text x="150" y="40" className="go-ink-label" fontSize="11">atmosphere (CO2)</text>
      <text x="60" y="125" className="go-ink-label" fontSize="11">plants ↑</text>
      <text x="250" y="125" className="go-ink-label" fontSize="11">respiration ↓</text>
      <text x="120" y="205" className="go-ink-label" fontSize="11">soil / ocean / fossil store</text>
      <path className="go-pencil" d="M150 55 l-8 6 l9 4" />
      <path className="go-pencil" d="M232 185 l8 -5 l-9 -4" />
      <text x="60" y="226" className="go-ink-label go-hand" fontSize="14">biogeochemical (carbon) cycle</text>
    </svg>
  );
}

function SustainableDevelopment() {
  return (
    <svg viewBox="0 0 380 230" className="h-auto w-full max-w-md">
      <RoughDefs />
      <path className="go-pencil go-pencil-fill-green" d="M190 40 L120 150 L260 150 Z" />
      <text x="155" y="80" className="go-ink-label" fontSize="11">Environment</text>
      <path className="go-pencil go-pencil-fill-amber" d="M120 150 a30 14 0 1 0 0.1 0 Z" />
      <text x="92" y="178" className="go-ink-label" fontSize="11">Economy</text>
      <path className="go-pencil go-pencil-fill-blue" d="M260 150 a30 14 0 1 0 0.1 0 Z" />
      <text x="238" y="178" className="go-ink-label" fontSize="11">Society</text>
      <text x="150" y="130" className="go-ink-label" fontSize="10">equity • viability • bearability</text>
      <text x="40" y="216" className="go-ink-label go-hand" fontSize="14">sustainable development — 3 pillars</text>
    </svg>
  );
}

const REGISTRY: Record<DiagramId, () => React.ReactElement> = {
  "endo-exo-balance": EndoExoBalance,
  "plate-boundaries": PlateBoundaries,
  "isostasy-airy-pratt": IsostasyAiryPratt,
  "davis-penck-cycle": DavisPenckCycle,
  "slope-elements": SlopeElements,
  "channel-patterns": ChannelPatterns,
  "heat-budget": HeatBudget,
  "tricellular-circulation": TricellularCirculation,
  "air-mass-fronts": AirMassFronts,
  "koppen-climate": KoppenClimate,
  "urban-heat-island": UrbanHeatIsland,
  "ocean-relief": OceanRelief,
  "salinity-profile": SalinityProfile,
  "ocean-gyres": OceanGyres,
  "coral-reef-types": CoralReefTypes,
  "tides-spring-neap": TidesSpringNeap,
  "soil-profile": SoilProfile,
  "world-biomes": WorldBiomes,
  "ecological-pyramid": EcologicalPyramid,
  "soil-conservation": SoilConservation,
  "ecosystem-structure": EcosystemStructure,
  "biogeochemical-cycle": BiogeochemicalCycle,
  "sustainable-development": SustainableDevelopment,
};

export function GeoDiagram({ id, caption }: { id: DiagramId; caption: string }) {
  const Drawing = REGISTRY[id];
  if (!Drawing) return null;
  return (
    <figure className="go-card my-5 rounded-md p-4">
      <div className="flex justify-center">
        <Drawing />
      </div>
      <figcaption className="mt-2 text-center text-sm font-semibold text-[#44506b]">
        ✎ {caption}
      </figcaption>
    </figure>
  );
}
