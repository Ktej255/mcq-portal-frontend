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

const REGISTRY: Record<DiagramId, () => React.ReactElement> = {
  "endo-exo-balance": EndoExoBalance,
  "plate-boundaries": PlateBoundaries,
  "isostasy-airy-pratt": IsostasyAiryPratt,
  "davis-penck-cycle": DavisPenckCycle,
  "slope-elements": SlopeElements,
  "channel-patterns": ChannelPatterns,
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
