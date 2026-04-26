// Ephemeris calculations using astronomia
// Calculates planetary positions for daily forecasts

// eslint-disable-next-line @typescript-eslint/no-require-imports
const astronomia = require("astronomia");

const { solar, moonphase, julian, planetposition } = astronomia;

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const ALCHEMICAL_SIGN_MEANINGS: Record<string, string> = {
  Aries: "cardinal Fire — Mars rules — action, initiation, iron, sulfur ignited",
  Taurus: "fixed Earth — Venus rules — patience, consolidation, copper, salt of earth",
  Gemini: "mutable Air — Mercury rules — duality, separation, quicksilver, volatile principle",
  Cancer: "cardinal Water — Moon rules — dissolution, nurturing, silver, the vessel",
  Leo: "fixed Fire — Sun rules — purification, gold, the heart, the solar tincture",
  Virgo: "mutable Earth — Mercury rules — discrimination, analysis, refinement, dross removed",
  Libra: "cardinal Air — Venus rules — equilibration, the scales, conjunction, marriage of opposites",
  Scorpio: "fixed Water — Mars/Pluto rules — putrefaction, nigredo, death and rebirth, iron in darkness",
  Sagittarius: "mutable Fire — Jupiter rules — expansion, the arrow of spirit, tin, philosophical fire",
  Capricorn: "cardinal Earth — Saturn rules — contraction, lead, time, the alchemist's patience",
  Aquarius: "fixed Air — Saturn/Uranus rules — elevation, universal solvent, the waters above",
  Pisces: "mutable Water — Jupiter/Neptune rules — dissolution, mystical union, salt of the sea",
};

const PLANET_ALCHEMICAL: Record<string, string> = {
  Sun: "Gold (Sol) — the heart, vital fire, the masculine principle, the red tincture",
  Moon: "Silver (Luna) — the brain, fluids, the feminine principle, the white tincture",
  Mercury: "Quicksilver (Mercurius) — the lungs and nerves, volatile spirit, the messenger",
  Venus: "Copper (Venus) — the kidneys, desire, harmonious conjunction, the green lion",
  Mars: "Iron (Mars) — the gall bladder, will, calcination, the red sulfur",
  Jupiter: "Tin (Jupiter) — the liver, expansion, philosophical gold, the multiplication",
  Saturn: "Lead (Saturnus) — the spleen, time, putrefaction, the black crow",
};

function eclipticToZodiac(lon: number): { sign: string; degree: number; minutes: number } {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degInSign = normalized - signIndex * 30;
  const degree = Math.floor(degInSign);
  const minutes = Math.floor((degInSign - degree) * 60);
  return {
    sign: ZODIAC_SIGNS[signIndex] ?? "Unknown",
    degree,
    minutes,
  };
}

function getMoonPhase(jde: number): string {
  // Known new moon: Jan 29, 2025 @ JD 2460704.7 (approx)
  // Use synodic period to find phase
  const knownNewMoon = 2460704.7;
  const synodicPeriod = 29.53059;
  const diff = jde - knownNewMoon;
  const phase = ((diff % synodicPeriod) + synodicPeriod) % synodicPeriod;

  if (phase < 1.85) return "New Moon";
  if (phase < 7.38) return "Waxing Crescent";
  if (phase < 9.22) return "First Quarter";
  if (phase < 14.77) return "Waxing Gibbous";
  if (phase < 16.61) return "Full Moon";
  if (phase < 22.15) return "Waning Gibbous";
  if (phase < 23.99) return "Last Quarter";
  return "Waning Crescent";
}

export interface PlanetData {
  name: string;
  sign: string;
  degree: number;
  minutes: number;
  alchemical: string;
}

export interface EphemerisData {
  date: string;
  julianDay: number;
  sun: PlanetData;
  moon: { sign: string; degree: number; minutes: number; phase: string; alchemical: string };
  planets: PlanetData[];
  alchemicalSummary: string;
}

export function getEphemeris(date?: Date): EphemerisData {
  const d = date ?? new Date();

  // Julian Day
  const jd = julian.CalendarGregorianToJD(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate() + d.getHours() / 24
  );

  // Sun position
  let sunLon = 0;
  try {
    const sunPos = solar.apparentLongitude(jd);
    sunLon = (sunPos * 180) / Math.PI;
  } catch {
    // fallback: approximate solar longitude
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000
    );
    sunLon = ((dayOfYear - 80) / 365.25) * 360;
  }

  const sunZodiac = eclipticToZodiac(sunLon);
  const sunData: PlanetData = {
    name: "Sun",
    ...sunZodiac,
    alchemical: PLANET_ALCHEMICAL["Sun"],
  };

  // Moon phase
  const moonPhase = getMoonPhase(jd);

  // Moon position (approximate using simplified calculation)
  // Mean lunar longitude (degrees)
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
  const moonMeanLon = (218.3165 + 481267.8813 * T) % 360;
  const moonAnomaly = (((134.9634 + 477198.8676 * T) % 360) + 360) % 360;
  const moonArg = (((93.2721 + 483202.0175 * T) % 360) + 360) % 360;
  const sunMeanLon = (280.4665 + 36000.7698 * T) % 360;
  const sunAnomaly = (((357.5291 + 35999.0503 * T) % 360) + 360) % 360;

  // Main corrections (simplified)
  const moonLon =
    moonMeanLon +
    6.2886 * Math.sin((moonAnomaly * Math.PI) / 180) +
    1.2740 * Math.sin(((2 * moonMeanLon - moonAnomaly) * Math.PI) / 180) +
    0.6583 * Math.sin(((2 * sunMeanLon - sunAnomaly) * Math.PI) / 180) +
    0.2136 * Math.sin(((2 * moonAnomaly) * Math.PI) / 180);

  const moonZodiac = eclipticToZodiac(moonLon);
  const moonData = {
    ...moonZodiac,
    phase: moonPhase,
    alchemical: PLANET_ALCHEMICAL["Moon"],
  };

  // Outer planets (approximate with mean motions from J2000)
  const planets: PlanetData[] = [
    {
      name: "Mercury",
      ...eclipticToZodiac(
        ((252.2509 + 149472.6749 * T) % 360 + 360) % 360
      ),
      alchemical: PLANET_ALCHEMICAL["Mercury"],
    },
    {
      name: "Venus",
      ...eclipticToZodiac(
        ((181.9798 + 58517.8156 * T) % 360 + 360) % 360
      ),
      alchemical: PLANET_ALCHEMICAL["Venus"],
    },
    {
      name: "Mars",
      ...eclipticToZodiac(
        ((355.4330 + 19140.2993 * T) % 360 + 360) % 360
      ),
      alchemical: PLANET_ALCHEMICAL["Mars"],
    },
    {
      name: "Jupiter",
      ...eclipticToZodiac(
        ((34.3515 + 3034.9057 * T) % 360 + 360) % 360
      ),
      alchemical: PLANET_ALCHEMICAL["Jupiter"],
    },
    {
      name: "Saturn",
      ...eclipticToZodiac(
        ((50.0774 + 1222.1138 * T) % 360 + 360) % 360
      ),
      alchemical: PLANET_ALCHEMICAL["Saturn"],
    },
  ];

  // Alchemical summary
  const sunSignMeaning = ALCHEMICAL_SIGN_MEANINGS[sunZodiac.sign] ?? sunZodiac.sign;
  const moonSignMeaning = ALCHEMICAL_SIGN_MEANINGS[moonZodiac.sign] ?? moonZodiac.sign;

  const alchemicalSummary = [
    `Sol stands at ${sunZodiac.degree}° ${sunZodiac.sign} — ${sunSignMeaning}.`,
    `Luna is ${moonPhase} at ${moonZodiac.degree}° ${moonZodiac.sign} — ${moonSignMeaning}.`,
    planets
      .map((p) => `${p.name} transits ${p.degree}°${p.sign}.`)
      .join(" "),
  ].join(" ");

  return {
    date: d.toISOString().split("T")[0],
    julianDay: Math.round(jd * 10) / 10,
    sun: sunData,
    moon: moonData,
    planets,
    alchemicalSummary,
  };
}

export function formatForecastText(ephem: EphemerisData): string {
  const lines: string[] = [
    `⚗ HERMES TRISMEGISTUS — DAILY ALCHEMICAL FORECAST`,
    `${ephem.date} · Julian Day ${ephem.julianDay}`,
    ``,
    `☉ SOL — ${ephem.sun.degree}°${ephem.sun.minutes}' ${ephem.sun.sign}`,
    `   ${ephem.sun.alchemical}`,
    ``,
    `☽ LUNA — ${ephem.moon.degree}°${ephem.moon.minutes}' ${ephem.moon.sign} · ${ephem.moon.phase}`,
    `   ${ephem.moon.alchemical}`,
    ``,
    `PLANETARY POSITIONS:`,
  ];

  const PLANET_SYMBOL: Record<string, string> = {
    Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄",
  };
  for (const p of ephem.planets) {
    const sym = PLANET_SYMBOL[p.name] ?? "★";
    lines.push(`  ${sym} ${p.name}: ${p.degree}°${p.minutes}' ${p.sign}`);
  }

  lines.push(``);
  lines.push(`ALCHEMICAL READING:`);
  lines.push(ephem.alchemicalSummary);
  lines.push(``);
  lines.push(`As above, so below. As within, so without. — Emerald Tablet`);

  return lines.join("\n");
}
