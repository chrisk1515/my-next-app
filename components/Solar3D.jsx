'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import ChatPanel from './ChatPanel';

/* --------------------------- Global constants --------------------------- */

const STAR_SPHERE = 70; // radius for guide-star “sky sphere”
const ORBIT_EPOCH_MS = Date.UTC(2025, 0, 1, 0, 0, 0); // epoch for planet phases

/* --------------------------- Planet data (teaching orbits) --------------------------- */
/* periods are real-ish (days), orbits are circular & coplanar for clarity */

const PLANETS = [
  {
    name: 'Mercury',
    color: '#c9c9c9',
    size: 0.7,
    orbitRadius: 6,
    periodDays: 88,
    phase: 0.1
  },
  {
    name: 'Venus',
    color: '#ffb9a5',
    size: 1.0,
    orbitRadius: 9,
    periodDays: 224.7,
    phase: 0.3
  },
  {
    name: 'Earth',
    color: '#4ea0ff',
    size: 1.05,
    orbitRadius: 12,
    periodDays: 365.25,
    phase: 0.5
  },
  {
    name: 'Mars',
    color: '#ff6b57',
    size: 0.9,
    orbitRadius: 15,
    periodDays: 687,
    phase: 0.8
  },
  {
    name: 'Jupiter',
    color: '#e8c39e',
    size: 1.9,
    orbitRadius: 19,
    periodDays: 4332.6,
    phase: 0.15
  },
  {
    name: 'Saturn',
    color: '#e7d6a8',
    size: 1.6,
    orbitRadius: 23,
    periodDays: 10759,
    phase: 0.6,
    rings: true
  },
  {
    name: 'Uranus',
    color: '#9adcf7',
    size: 1.3,
    orbitRadius: 27,
    periodDays: 30687,
    phase: 0.9
  },
  {
    name: 'Neptune',
    color: '#6bb2ff',
    size: 1.3,
    orbitRadius: 31,
    periodDays: 60190,
    phase: 0.4
  }
];

const EARTH_DEF = PLANETS.find((p) => p.name === 'Earth');

/* --------------------------- Hawaiian names & star catalog --------------------------- */

const HAWAIIAN_STAR_NAMES = {
  Polaris: 'Hōkūpaʻa (★1)',
  Kochab: 'Holopuni / Hōkūmau (★2)',
  Pherkad: 'Peluakē / Pheka',

  Arcturus: 'Hōkūleʻa',
  Sirius: 'ʻAʻā',
  Capella: 'Hoku Kapaela',
  Aldebaran: 'Kao',
  Betelgeuse: "Hoku-‘ai-‘ai",
  Rigel: 'Hoku-kaupo',
  Deneb: 'Denepa',
  Vega: 'Wika',
  Altair: 'Humu',
  Procyon: 'Pua-i Kona',
  Canopus: "Ke Aliʻi o Kona",
  Spica: 'Hikianalia',
  Regulus: 'Ka Leo',
  Fomalhaut: 'Kawela',
  'Alpha Centauri': 'Kamailehope',
  'Beta Centauri': 'Kamailemua',
  Gacrux: 'Kaulia',
  Acrux: 'Ka Mole Honua',
  'Southern Cross': 'Hānaiakamalama'
};

const STAR_RADEC = [
  { name: 'Polaris', ra: 2.5303, dec: 89.2641, mag: 1.98 },
  { name: 'Kochab', ra: 14.8451, dec: 74.1555, mag: 2.08 },
  { name: 'Pherkad', ra: 15.3459, dec: 71.834, mag: 3.05 },

  // Big Dipper
  { name: 'Dubhe', ra: 11.0621, dec: 61.7508, mag: 1.8 },
  { name: 'Merak', ra: 11.0307, dec: 56.3824, mag: 2.4 },
  { name: 'Phecda', ra: 11.8972, dec: 53.6948, mag: 2.4 },
  { name: 'Megrez', ra: 12.2571, dec: 57.0326, mag: 3.3 },
  { name: 'Alioth', ra: 12.9005, dec: 55.9598, mag: 1.8 },
  { name: 'Mizar', ra: 13.3987, dec: 54.9254, mag: 2.2 },
  { name: 'Alkaid', ra: 13.7923, dec: 49.3133, mag: 1.9 },

  // Orion
  { name: 'Betelgeuse', ra: 5.9195, dec: 7.4071, mag: 0.5 },
  { name: 'Rigel', ra: 5.2423, dec: -8.2017, mag: 0.2 },
  { name: 'Alnitak', ra: 5.6793, dec: -1.9426, mag: 1.7 },
  { name: 'Alnilam', ra: 5.6036, dec: -1.2019, mag: 1.7 },
  { name: 'Mintaka', ra: 5.5334, dec: -0.2991, mag: 2.2 },

  // Summer triangle
  { name: 'Vega', ra: 18.6156, dec: 38.7837, mag: 0.0 },
  { name: 'Deneb', ra: 20.6905, dec: 45.2803, mag: 1.3 },
  { name: 'Altair', ra: 19.8464, dec: 8.8683, mag: 0.8 },

  // Southern & bright
  { name: 'Spica', ra: 13.4199, dec: -11.1614, mag: 1.0 },
  { name: 'Arcturus', ra: 14.261, dec: 19.1825, mag: -0.05 },
  { name: 'Alpha Centauri', ra: 14.6601, dec: -60.8339, mag: -0.3 },
  { name: 'Beta Centauri', ra: 14.0637, dec: -60.373, mag: 0.6 },
  { name: 'Gacrux', ra: 12.4433, dec: -57.1132, mag: 1.6 },
  { name: 'Acrux', ra: 12.4433, dec: -63.0991, mag: 0.8 },

  { name: 'Capella', ra: 5.2782, dec: 45.9979, mag: 0.1 },
  { name: 'Aldebaran', ra: 4.5987, dec: 16.5093, mag: 0.9 },
  { name: 'Procyon', ra: 7.655, dec: 5.225, mag: 0.4 },
  { name: 'Sirius', ra: 6.7525, dec: -16.7161, mag: -1.46 },
  { name: 'Canopus', ra: 6.3992, dec: -52.6957, mag: -0.74 },
  { name: 'Regulus', ra: 10.1395, dec: 11.9672, mag: 1.35 },
  { name: 'Fomalhaut', ra: 22.9608, dec: -29.6222, mag: 1.16 }
];

const CONSTELLATION_LINES = {
  'Ursa Major (Nā Hiku)': [
    ['Dubhe', 'Merak'],
    ['Merak', 'Phecda'],
    ['Phecda', 'Megrez'],
    ['Megrez', 'Alioth'],
    ['Alioth', 'Mizar'],
    ['Mizar', 'Alkaid']
  ],
  'Ursa Minor': [
    ['Kochab', 'Polaris'],
    ['Kochab', 'Pherkad']
  ],
  Orion: [
    ['Betelgeuse', 'Alnitak'],
    ['Alnitak', 'Alnilam'],
    ['Alnilam', 'Mintaka'],
    ['Mintaka', 'Rigel'],
    ['Rigel', 'Betelgeuse']
  ],
  'Crux + Pointers': [
    ['Gacrux', 'Acrux'],
    ['Beta Centauri', 'Alpha Centauri']
  ]
};

const IWIK_CHAIN = [
  'Polaris',
  'Kochab',
  'Dubhe',
  'Merak',
  'Arcturus',
  'Spica',
  'Beta Centauri',
  'Alpha Centauri',
  'Gacrux',
  'Acrux'
];

/* --------------------------- Zodiac & Hawaiian hale --------------------------- */

const ZODIAC = [
  { name: 'Aries', start: 0, season: 'Spring' },
  { name: 'Taurus', start: 30, season: 'Spring' },
  { name: 'Gemini', start: 60, season: 'Spring' },
  { name: 'Cancer', start: 90, season: 'Summer' },
  { name: 'Leo', start: 120, season: 'Summer' },
  { name: 'Virgo', start: 150, season: 'Summer' },
  { name: 'Libra', start: 180, season: 'Autumn' },
  { name: 'Scorpius', start: 210, season: 'Autumn' },
  { name: 'Sagittarius', start: 240, season: 'Autumn' },
  { name: 'Capricornus', start: 270, season: 'Winter' },
  { name: 'Aquarius', start: 300, season: 'Winter' },
  { name: 'Pisces', start: 330, season: 'Winter' }
];

const SEASON_COLORS = {
  Spring: '#9fe8c9',
  Summer: '#ffd27f',
  Autumn: '#ffb4a2',
  Winter: '#9fb6ff'
};

const HAWAIIAN_HALE = [
  { name: 'HIKINA', start: 90 },
  { name: 'KOʻOLAU', start: 45 },
  { name: 'ʻĀKAU', start: 0 },
  { name: 'HOʻOLUA', start: 315 },
  { name: 'KOMOHANA', start: 270 },
  { name: 'KONA', start: 225 },
  { name: 'HEMA', start: 180 },
  { name: 'MALANI', start: 135 }
];

/* --------------------------- Math helpers --------------------------- */

function normalizeDeg(x) {
  x %= 360;
  return x < 0 ? x + 360 : x;
}
function toRad(d) {
  return (d * Math.PI) / 180;
}
function toDeg(r) {
  return (r * 180) / Math.PI;
}
function toJulian(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start; // ms since Jan 0
  return Math.floor(diff / 86400000);
}
function localSiderealTime(date, lonDeg) {
  const JD = toJulian(date);
  const T = (JD - 2451545.0) / 36525.0;
  let GMST =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  return normalizeDeg(GMST + lonDeg);
}
function radecToAltAz(HA_deg, Dec_deg, Lat_deg) {
  const HA = toRad(HA_deg);
  const Dec = toRad(Dec_deg);
  const Lat = toRad(Lat_deg);
  const sinAlt =
    Math.sin(Dec) * Math.sin(Lat) +
    Math.cos(Dec) * Math.cos(Lat) * Math.cos(HA);
  const alt = Math.asin(sinAlt);
  const cosAz =
    (Math.sin(Dec) - Math.sin(alt) * Math.sin(Lat)) /
    (Math.cos(alt) * Math.cos(Lat));
  let az = Math.acos(Math.min(1, Math.max(-1, cosAz)));
  if (Math.sin(HA) > 0) az = 2 * Math.PI - az;
  return { alt: toDeg(alt), az: toDeg(az) };
}
// y=up, x=East, -z=North
function altAzToXYZ(altDeg, azDeg) {
  const alt = toRad(altDeg);
  const az = toRad(azDeg);
  const r = Math.cos(alt);
  const y = Math.sin(alt);
  const x = r * Math.sin(az);
  const zSouth = r * Math.cos(az);
  return new THREE.Vector3(x, y, -zSouth);
}

function polarOnXZ(r, deg) {
  const rad = toRad(deg);
  return new THREE.Vector3(r * Math.cos(rad), 0, r * Math.sin(rad));
}
function arcPoints(r, startDeg, endDeg, segments = 48) {
  const pts = [];
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  for (let i = 0; i <= segments; i++) {
    const t = s + (i / segments) * (e - s);
    pts.push(new THREE.Vector3(r * Math.cos(t), 0, r * Math.sin(t)));
  }
  return pts;
}

function eclipticVectorOnSky(r, lonDeg, tiltDeg = 23.4) {
  const lambda = toRad(lonDeg);
  const eps = toRad(tiltDeg);
  const x = Math.cos(lambda);
  const y = Math.sin(lambda) * Math.sin(eps);
  const z = Math.sin(lambda) * Math.cos(eps);
  return new THREE.Vector3(x, y, z).setLength(r);
}

function eclipticArcPointsOnSky(r, startDeg, endDeg, segments = 48, tiltDeg = 23.4) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = startDeg + (i / segments) * (endDeg - startDeg);
    pts.push(eclipticVectorOnSky(r, t, tiltDeg));
  }
  return pts;
}

/* --------------------------- Season & Moon info --------------------------- */

function getSeasonInfo(now = new Date()) {
  const y = now.getUTCFullYear();
  const MAR_EQ = new Date(Date.UTC(y, 2, 20));
  const JUN_SOL = new Date(Date.UTC(y, 5, 21));
  const SEP_EQ = new Date(Date.UTC(y, 8, 22));
  const DEC_SOL = new Date(Date.UTC(y, 11, 21));

  let current = 'Winter';
  let next = 'March Equinox';
  let nextDate = MAR_EQ;

  if (now < MAR_EQ) {
    current = 'Winter';
    next = 'March Equinox';
    nextDate = MAR_EQ;
  } else if (now < JUN_SOL) {
    current = 'Spring';
    next = 'June Solstice';
    nextDate = JUN_SOL;
  } else if (now < SEP_EQ) {
    current = 'Summer';
    next = 'September Equinox';
    nextDate = SEP_EQ;
  } else if (now < DEC_SOL) {
    current = 'Autumn';
    next = 'December Solstice';
    nextDate = DEC_SOL;
  } else {
    current = 'Winter';
    next = 'March Equinox';
    nextDate = new Date(Date.UTC(y + 1, 2, 20));
  }

  const days = Math.max(
    0,
    Math.ceil((nextDate.getTime() - now.getTime()) / 86400000)
  );

  const subsolar =
    next === 'June Solstice'
      ? 'Sun overhead near Tropic of Cancer (≈ 23.4° N)'
      : next === 'December Solstice'
      ? 'Sun overhead near Tropic of Capricorn (≈ 23.4° S)'
      : 'Sun crosses the equator (0° latitude)';

  return { current, next, days, subsolar };
}

function getMoonInfo(date = new Date()) {
  const synodic = 29.530588853;
  const knownNew = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const days = (date - knownNew) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const phase = age / synodic;
  const illum = 0.5 * (1 - Math.cos(2 * Math.PI * phase));

  let phaseName = 'New Moon';
  if (age < 1.8457) phaseName = 'New Moon';
  else if (age < 5.5369) phaseName = 'Waxing Crescent';
  else if (age < 9.2283) phaseName = 'First Quarter';
  else if (age < 12.9196) phaseName = 'Waxing Gibbous';
  else if (age < 16.611) phaseName = 'Full Moon';
  else if (age < 20.3023) phaseName = 'Waning Gibbous';
  else if (age < 23.9936) phaseName = 'Last Quarter';
  else if (age < 27.6849) phaseName = 'Waning Crescent';

  const marks = [
    { name: 'New Moon', at: 0.0 },
    { name: 'First Quarter', at: 0.25 * synodic },
    { name: 'Full Moon', at: 0.5 * synodic },
    { name: 'Last Quarter', at: 0.75 * synodic },
    { name: 'New Moon', at: 1.0 * synodic }
  ];
  let next = marks.find((m) => m.at > age);
  if (!next) next = marks[0];
  const daysToNext = next.at - age;
  const nextDate = new Date(date.getTime() + daysToNext * 86400000);

  return { age, illum, phaseName, nextMajor: next.name, daysToNext, nextDate };
}

/* --------------------------- Star position computations --------------------------- */

function computeStarPositions({ when, lat, lon, radius }) {
  const lst = localSiderealTime(when, lon);
  const out = [];
  for (const s of STAR_RADEC) {
    const raDeg = s.ra * 15;
    const HA = normalizeDeg(lst - raDeg);
    const { alt, az } = radecToAltAz(HA, s.dec, lat);
    if (alt <= 0) continue;
    const vec = altAzToXYZ(alt, az).setLength(radius);
    out.push({ ...s, alt, az, vec });
  }
  return out;
}

/* --------------------------- Orbits & planets --------------------------- */

function makeOrbitPoints(r, segments = 128) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
  }
  return pts;
}

function computePlanetPosition(def, when) {
  const days = (when.getTime() - ORBIT_EPOCH_MS) / 86400000;
  const phase = ((days / def.periodDays) + (def.phase || 0)) % 1;
  const angle = phase * Math.PI * 2;
  const x = Math.cos(angle) * def.orbitRadius;
  const z = Math.sin(angle) * def.orbitRadius;
  return new THREE.Vector3(x, 0, z);
}

function Planet({ def, when, onSelect, earthPosRef }) {
  const pos = useMemo(() => computePlanetPosition(def, when), [def, when]);
  const orbitPoints = useMemo(
    () => makeOrbitPoints(def.orbitRadius),
    [def.orbitRadius]
  );

  const isEarth = def.name === 'Earth';

  let earthDateLabel = null;
  let earthDayOfYearLabel = null;
  let moonInfo = null;

  if (isEarth) {
    const opts = { month: 'short', day: 'numeric' };
    earthDateLabel = when.toLocaleDateString(undefined, opts);
    const doy = dayOfYear(when);
    earthDayOfYearLabel = `Day ${doy} of ${when.getFullYear()}`;
    moonInfo = getMoonInfo(when);
  }

  // Simple teaching Moon orbit around Earth (not ephemeris-precise)
  const { moonOrbitPointsLocal, moonLocalPos, moonWorldPos } = useMemo(() => {
    if (!isEarth) {
      return { moonOrbitPointsLocal: null, moonLocalPos: null, moonWorldPos: null };
    }

    const moonRadius = 2.1; // distance from Earth in scene units
    const moonDays = (when.getTime() - ORBIT_EPOCH_MS) / 86400000;
    const moonPhase = ((moonDays / 27.3) % 1 + 1) % 1;
    const moonAngle = moonPhase * Math.PI * 2;

    const localPos = new THREE.Vector3(
      Math.cos(moonAngle) * moonRadius,
      0.7,
      Math.sin(moonAngle) * moonRadius
    );

    return {
      moonOrbitPointsLocal: makeOrbitPoints(moonRadius, 96),
      moonLocalPos: localPos,
      moonWorldPos: pos.clone().add(localPos)
    };
  }, [isEarth, pos, when]);

  // Opt-in moon position logging to avoid noisy console output by default.
  useEffect(() => {
    if (
      !isEarth ||
      process.env.NEXT_PUBLIC_DEBUG_MOON !== 'true' ||
      !moonLocalPos ||
      !moonWorldPos
    ) {
      return;
    }

    console.debug(
      'Moon debug:',
      'moonHelio=',
      moonWorldPos.toArray(),
      'earthHelio=',
      pos.toArray(),
      'moonRel=',
      moonLocalPos.toArray()
    );

    console.debug(
      'moonPos calc:',
      'earthPlanet.pos=',
      pos.toArray(),
      'moonRel=',
      moonLocalPos.toArray(),
      'final moonPos=',
      moonWorldPos.toArray()
    );
  }, [isEarth, moonLocalPos, moonWorldPos, pos]);

  useEffect(() => {
    if (earthPosRef && isEarth && earthPosRef.current) {
      earthPosRef.current.copy(pos);
    }
  }, [earthPosRef, isEarth, pos]);

  return (
    <group>
      {/* Planet orbit around Sun */}
      <Line
        points={orbitPoints}
        color="#4b5563"
        transparent
        opacity={0.75}
        lineWidth={1}
      />

      {/* Planet + optional Moon, all positioned at planet location */}
      <group position={pos.toArray()}>
        {/* Planet sphere */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(def);
          }}
        >
          <sphereGeometry args={[def.size, 32, 32]} />
          <meshStandardMaterial
            color={def.color}
            roughness={0.5}
            metalness={0.1}
          />

          {/* Label above planet */}
          <Html
            distanceFactor={10}
            position={[0, def.size + 1.4, 0]}
            style={{
              padding: '4px 8px',
              background: 'rgba(15,23,42,.9)',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.8)',
              fontSize: 11,
              color: '#e5e7eb',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              textAlign: 'center'
            }}
          >
            {isEarth ? (
              <>
                <span style={{ fontWeight: 700 }}>Earth</span>
                <span style={{ fontSize: 11, opacity: 0.95 }}>
                  {earthDateLabel}
                </span>
                <span style={{ fontSize: 10, opacity: 0.85 }}>
                  {earthDayOfYearLabel}
                </span>
                {moonInfo && (
                  <span style={{ fontSize: 10, opacity: 0.9 }}>
                    🌙 {moonInfo.phaseName} • {Math.round(moonInfo.illum * 100)}%
                  </span>
                )}
              </>
            ) : (
              def.name
            )}
          </Html>

          {/* Saturn rings, etc. */}
          {def.rings && (
            <mesh rotation={[Math.PI / 2.3, 0, 0]}>
              <ringGeometry args={[def.size * 1.8, def.size * 3.0, 64]} />
              <meshBasicMaterial
                color="#facc6b"
                transparent
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </mesh>

        {/* Earth’s Moon (teaching orbit) */}
        {isEarth && moonOrbitPointsLocal && moonLocalPos && (
          <>
            <Line
              points={moonOrbitPointsLocal}
              color="#cbd5f5"
              transparent
              opacity={0.55}
            />
            <mesh position={moonLocalPos.toArray()}>
              <sphereGeometry args={[0.35, 24, 24]} />
              <meshStandardMaterial color="#d4d4d8" roughness={1} />
              <Html
                distanceFactor={12}
                position={[0, 0.9, 0]}
                style={{
                  padding: '2px 6px',
                  background: 'rgba(15,23,42,.9)',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.8)',
                  fontSize: 10,
                  color: '#e5e7eb',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}
              >
                Moon
              </Html>
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

function Sun() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.6, 48, 48]} />
        <meshStandardMaterial
          color="#ffd362"
          emissive="#ffbf3a"
          emissiveIntensity={1.2}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={0} decay={2} />
    </group>
  );
}

/* --------------------------- Overlays --------------------------- */

function RealGuideStars({ when, lat, lon, radius, onSelect }) {
  const stars = useMemo(
    () => computeStarPositions({ when, lat, lon, radius }),
    [when, lat, lon, radius]
  );

  return (
    <group>
      {stars.map((s) => {
        const haw = HAWAIIAN_STAR_NAMES[s.name];
        const label = haw ? `${haw} • ${s.name}` : s.name;
        return (
          <group
            key={s.name}
            position={s.vec.toArray()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.({ ...s, hawaiian: haw || null });
            }}
          >
            <mesh>
              <sphereGeometry args={[1.2, 10, 10]} />
              <meshBasicMaterial color="#cfe4ff" />
            </mesh>
            <Text
              position={[0, 3, 0]}
              fontSize={3}
              color="#e6eeff"
              anchorX="center"
              anchorY="middle"
              depthTest={false}
              outlineWidth={0.7}
              outlineColor="#020617"
              billboard
            >
              {label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function ConstellationLinesOverlay({ when, lat, lon, radius }) {
  const stars = useMemo(
    () => computeStarPositions({ when, lat, lon, radius }),
    [when, lat, lon, radius]
  );
  const map = useMemo(() => {
    const m = new Map();
    stars.forEach((s) => m.set(s.name, s));
    return m;
  }, [stars]);

  const entries = Object.entries(CONSTELLATION_LINES);

  return (
    <group>
      {entries.map(([name, pairs], gi) => (
        <group key={name}>
          {pairs.map(([aName, bName], i) => {
            const a = map.get(aName);
            const b = map.get(bName);
            if (!a || !b) return null;
            return (
              <Line
                key={`${gi}-${i}`}
                points={[a.vec, b.vec]}
                color="#9fb6ff"
                transparent
                opacity={0.75}
              />
            );
          })}
        </group>
      ))}
      <Text
        position={[0, radius * 0.04, radius * 1.05]}
        fontSize={3}
        color="#9fb6ff"
        anchorX="center"
        anchorY="middle"
        depthTest={false}
        billboard
      >
        Constellation lines (live sky)
      </Text>
    </group>
  );
}

function IwikuamooOverlay({ when, lat, lon, radius }) {
  const stars = useMemo(
    () => computeStarPositions({ when, lat, lon, radius }),
    [when, lat, lon, radius]
  );
  const map = useMemo(() => {
    const m = new Map();
    stars.forEach((s) => m.set(s.name, s));
    return m;
  }, [stars]);

  const segments = [];
  for (let i = 1; i < IWIK_CHAIN.length; i++) {
    const a = map.get(IWIK_CHAIN[i - 1]);
    const b = map.get(IWIK_CHAIN[i]);
    if (a && b) segments.push([a.vec, b.vec]);
  }

  return (
    <group>
      {segments.map(([a, b], i) => (
        <Line
          key={i}
          points={[a, b]}
          color="#22c55e"
          transparent
          opacity={0.95}
        />
      ))}
      <Text
        position={[0, 0, -radius * 1.08]}
        fontSize={4}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
        depthTest={false}
        billboard
      >
        Ka Iwikuamoʻo
      </Text>
    </group>
  );
}

function EclipticRing({ r, color = '#ffcc80', opacity = 0.25 }) {
  const pts = useMemo(() => makeOrbitPoints(r, 192), [r]);
  return (
    <Line points={pts} color={color} transparent opacity={opacity} lineWidth={1} />
  );
}

function ZodiacBelt({ r, currentSeason, mode = 'flat', center, tiltDeg = 23.4 }) {
  const isSkyMode = mode === 'sky';
  return (
    <group position={center ? center.toArray() : undefined}>
      {ZODIAC.map((z) => {
        const color = SEASON_COLORS[z.season] || '#ddd';
        const pts = isSkyMode
          ? eclipticArcPointsOnSky(r, z.start, z.start + 30, 72, tiltDeg)
          : arcPoints(r, z.start, z.start + 30, 48);
        const strong = z.season === currentSeason;
        return (
          <Line
            key={`arc-${z.name}`}
            points={pts}
            color={color}
            transparent
            opacity={strong ? 0.55 : 0.22}
          />
        );
      })}
      {ZODIAC.map((z) => {
        const mid = z.start + 15;
        const posVec = isSkyMode
          ? eclipticVectorOnSky(r + 2, mid, tiltDeg)
          : polarOnXZ(r + 2, mid);
        const strong = z.season === currentSeason;
        return (
          <Text
            key={`lbl-${z.name}`}
            position={posVec.toArray()}
            fontSize={strong ? 3 : 2.4}
            color={SEASON_COLORS[z.season] || '#e6eeff'}
            anchorX="center"
            anchorY="middle"
            depthTest={false}
            billboard
          >
            {z.name}
          </Text>
        );
      })}
    </group>
  );
}

function HaleBelt({ r }) {
  return (
    <group>
      {HAWAIIAN_HALE.map((h) => {
        const pts = arcPoints(r, h.start, h.start + 45, 48);
        return (
          <Line
            key={`hale-arc-${h.name}`}
            points={pts}
            color="#9fe8c9"
            transparent
            opacity={0.45}
          />
        );
      })}
      {HAWAIIAN_HALE.map((h) => {
        const mid = h.start + 22.5;
        const p = polarOnXZ(r + 2, mid);
        return (
          <Text
            key={`hale-lbl-${h.name}`}
            position={[p.x, 0, p.z]}
            fontSize={3}
            color="#9fe8c9"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
            billboard
          >
            {h.name}
          </Text>
        );
      })}
    </group>
  );
}

/* Tiny, simplified “star compass” – ecliptic ring + houses + Iwikuamoʻo chain */

function StarCompassKaIwikuamoo({ r, when, lat, lon }) {
  return (
    <group>
      <EclipticRing r={r} color="#335a9f" opacity={0.45} />
      <HaleBelt r={r} />
      <IwikuamooOverlay when={when} lat={lat} lon={lon} radius={r * 0.98} />
      <Text
        position={[0, r * 0.06, -r * 1.02]}
        fontSize={3}
        color="#9fb6ff"
        anchorX="center"
        anchorY="middle"
        depthTest={false}
        billboard
      >
        Hawaiian star compass (Ka Iwikuamoʻo spine)
      </Text>
    </group>
  );
}

/* Wayfinding: Little Dipper focus */

function starAltAzToVec(name, when, lat, lon, radius) {
  const s = STAR_RADEC.find((x) => x.name === name);
  if (!s) return null;
  const lst = localSiderealTime(when, lon);
  const HA = normalizeDeg(lst - s.ra * 15);
  const { alt, az } = radecToAltAz(HA, s.dec, lat);
  if (alt <= 0) return null;
  return altAzToXYZ(alt, az).setLength(radius);
}

function WayfindLittleDipper({ when, lat, lon, r }) {
  const pol = starAltAzToVec('Polaris', when, lat, lon, r);
  const koc = starAltAzToVec('Kochab', when, lat, lon, r);
  const phe = starAltAzToVec('Pherkad', when, lat, lon, r);

  return (
    <group>
      {pol && (
        <group position={pol.toArray()}>
          <mesh>
            <sphereGeometry args={[1.6, 12, 12]} />
            <meshBasicMaterial color="#e7f0ff" />
          </mesh>
          <Text
            position={[0, 3, 0]}
            fontSize={3}
            color="#e5e7eb"
            depthTest={false}
            outlineWidth={0.7}
            outlineColor="#020617"
            billboard
          >
            {HAWAIIAN_STAR_NAMES['Polaris'] ?? 'Polaris'}
          </Text>
        </group>
      )}
      {koc && (
        <group position={koc.toArray()}>
          <mesh>
            <sphereGeometry args={[1.4, 12, 12]} />
            <meshBasicMaterial color="#cfe4ff" />
          </mesh>
          <Text
            position={[0, 3, 0]}
            fontSize={3}
            color="#e5e7eb"
            depthTest={false}
            outlineWidth={0.7}
            outlineColor="#020617"
            billboard
          >
            {HAWAIIAN_STAR_NAMES['Kochab'] ?? 'Kochab'}
          </Text>
        </group>
      )}
      {phe && (
        <group position={phe.toArray()}>
          <mesh>
            <sphereGeometry args={[1.2, 12, 12]} />
            <meshBasicMaterial color="#cfe4ff" />
          </mesh>
          <Text
            position={[0, 3, 0]}
            fontSize={3}
            color="#e5e7eb"
            depthTest={false}
            outlineWidth={0.7}
            outlineColor="#020617"
            billboard
          >
            {HAWAIIAN_STAR_NAMES['Pherkad'] ?? 'Pherkad'}
          </Text>
        </group>
      )}
      {pol && koc && (
        <Line
          points={[koc, pol]}
          color="#7fb3ff"
          transparent
          opacity={0.8}
        />
      )}
      {koc && phe && (
        <Line
          points={[phe, koc]}
          color="#7fb3ff"
          transparent
          opacity={0.5}
        />
      )}
      {pol && (
        <Text
          position={pol.clone().setLength(r + 4).toArray()}
          fontSize={3}
          color="#22c55e"
          depthTest={false}
          billboard
        >
          Heading ʻĀkau (north) via Hōkūpaʻa
        </Text>
      )}
      <Text
        position={[0, 0, -r * 1.06]}
        fontSize={3}
        color="#9fe8c9"
        depthTest={false}
        billboard
      >
        Wayfinding: Little Dipper focus
      </Text>
    </group>
  );
}

/* Teaching-scale 3I/ATLAS path (stylized, not ephemeris-accurate) */

function I3AtlasPath({ speed }) {
  const pathPoints = useMemo(() => {
    const raw = [
      new THREE.Vector3(-90, 18, -110),
      new THREE.Vector3(-60, 12, -60),
      new THREE.Vector3(-20, 6, -15),
      new THREE.Vector3(16, 4, 5),
      new THREE.Vector3(48, 6, 60),
      new THREE.Vector3(90, 12, 120)
    ];
    const pts = [];
    const stepsPerSegment = 10;
    for (let i = 0; i < raw.length - 1; i++) {
      const a = raw[i];
      const b = raw[i + 1];
      for (let j = 0; j < stepsPerSegment; j++) {
        const t = j / stepsPerSegment;
        const v = new THREE.Vector3().copy(a).lerp(b, t);
        pts.push(v);
      }
    }
    pts.push(raw[raw.length - 1].clone());
    return pts;
  }, []);

  const headRef = useRef();
  const progressRef = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    if (!headRef.current || pathPoints.length < 2) return;
    const baseSpeed = 0.03;
    progressRef.current =
      (progressRef.current + dt * baseSpeed * speed) % 1;
    const t = progressRef.current * (pathPoints.length - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(pathPoints.length - 1, i0 + 1);
    const alpha = t - i0;
    const p0 = pathPoints[i0];
    const p1 = pathPoints[i1];
    tmp.copy(p0).lerp(p1, alpha);
    headRef.current.position.copy(tmp);
  });

  return (
    <group>
      <Line
        points={pathPoints}
        color="#22d3ee"
        transparent
        opacity={0.9}
        lineWidth={2}
      />
      <group ref={headRef}>
        <mesh>
          <sphereGeometry args={[0.7, 24, 24]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#22d3ee"
            emissiveIntensity={0.7}
          />
        </mesh>
        <Html
          distanceFactor={12}
          position={[0, 2.2, 0]}
          style={{
            padding: '2px 6px',
            background: 'rgba(15,23,42,.9)',
            borderRadius: 999,
            border: '1px solid rgba(45,212,191,0.6)',
            fontSize: 11,
            color: '#a5f3fc',
            whiteSpace: 'nowrap'
          }}
        >
          3I/ATLAS (teaching path)
        </Html>
      </group>
    </group>
  );
}

/* --------------------------- Camera follower --------------------------- */

function CameraFollower({ followEarth, controlsRef, earthPosRef }) {
  useFrame(() => {
    if (!followEarth || !controlsRef.current || !earthPosRef.current) return;
    const controls = controlsRef.current;
    controls.target.lerp(earthPosRef.current, 0.15);
    controls.update();
  });
  return null;
}

/* --------------------------- Main component --------------------------- */

export default function Solar3D() {
  const [speed, setSpeed] = useState(1.0); // sim hours per real second
  const [paused, setPaused] = useState(false);
  const [followEarth, setFollowEarth] = useState(false);
  const [overlay, setOverlay] = useState('zodiac'); // "zodiac" | "hale" | "iwik" | "compass" | "wayfind" | "constellations"
  const [earthView, setEarthView] = useState(false);
  const [showI3, setShowI3] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const [simOffsetHours, setSimOffsetHours] = useState(0);
  const baseTimeRef = useRef(new Date()); // sim=now at mount

  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [toolbarHover, setToolbarHover] = useState(false);

  const earthPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const controlsRef = useRef();

  const [geo, setGeo] = useState({
    lat: 21.3069,
    lon: -157.8583,
    status: 'init',
    error: null
  });

  const [latInput, setLatInput] = useState(21.3069);
  const [lonInput, setLonInput] = useState(-157.8583);

  useEffect(() => {
    setLatInput(geo.lat);
    setLonInput(geo.lon);
  }, [geo.lat, geo.lon]);

  // Location
  const requestGeolocation = React.useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo((g) => ({ ...g, status: 'unsupported' }));
      return;
    }
    setGeo((g) => ({ ...g, status: 'loading', error: null }));
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setGeo({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          status: 'ready',
          error: null
        }),
      (err) =>
        setGeo((g) => ({
          ...g,
          status: 'error',
          error: err.message || 'Location error'
        })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  const applyManualLocation = () => {
    const latVal = parseFloat(latInput);
    const lonVal = parseFloat(lonInput);
    if (Number.isFinite(latVal) && Number.isFinite(lonVal)) {
      setGeo({ lat: latVal, lon: lonVal, status: 'manual', error: null });
    } else {
      setGeo((g) => ({
        ...g,
        status: 'manual-error',
        error: 'Enter valid numeric coordinates'
      }));
    }
  };

  // Simulation time loop
  useEffect(() => {
    let frame;
    let last = performance.now();
    let acc = 0;
    const step = 1 / 20; // ~20 fps state updates

    const loop = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused) {
        acc += dt;
        if (acc >= step) {
          const steps = Math.floor(acc / step);
          acc -= steps * step;
          setSimOffsetHours((h) => h + speed * step * steps);
        }
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [paused, speed]);

  const simTime = useMemo(() => {
    return new Date(baseTimeRef.current.getTime() + simOffsetHours * 3600000);
  }, [simOffsetHours]);

  const season = getSeasonInfo(simTime);
  const moon = getMoonInfo(simTime);
  const simDayOfYear = dayOfYear(simTime);

  const earthPos = useMemo(() => {
    return EARTH_DEF ? computePlanetPosition(EARTH_DEF, simTime) : new THREE.Vector3();
  }, [simTime]);

  const lat = geo.lat;
  const lon = geo.lon;

  const beltRadius = PLANETS[PLANETS.length - 1].orbitRadius + 4;
  const zodiacRadius = earthView ? STAR_SPHERE * 0.9 : beltRadius + 2;

  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'local time';

  const toolbarButton = {
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(148,163,184,0.6)',
    background: 'rgba(15,23,42,0.95)',
    color: '#e5e7eb',
    fontSize: '0.78rem',
    cursor: 'pointer'
  };

  const overlayChip = (key, label) => (
    <button
      key={key}
      type="button"
      style={{
        ...toolbarButton,
        padding: '4px 9px',
        borderColor:
          overlay === key ? 'rgba(96,165,250,0.9)' : 'rgba(75,85,99,0.9)',
        background:
          overlay === key ? 'rgba(30,64,175,0.95)' : 'rgba(15,23,42,0.96)',
        color: overlay === key ? '#e5e7eb' : '#9ca3af'
      }}
      onClick={() => setOverlay(key)}
    >
      {label}
    </button>
  );

  const geoStatusLabel = (() => {
    if (geo.status === 'ready') return 'Using your location';
    if (geo.status === 'manual') return 'Using manual coordinates';
    if (geo.status === 'manual-error') return 'Manual coordinates invalid';
    if (geo.status === 'loading') return 'Requesting location…';
    if (geo.status === 'error') return 'Location blocked or unavailable';
    if (geo.status === 'unsupported') return 'Geolocation not supported';
    return 'Location not yet requested';
  })();

  function resetCameraAndTime() {
    setFollowEarth(false);
    baseTimeRef.current = new Date();
    setSimOffsetHours(0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 30, 70);
      controlsRef.current.update();
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        background: '#020617',
        color: '#e5e7eb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      {/* Toolbar */}
      <div
        style={{ position: 'fixed', left: 12, top: 10, zIndex: 10 }}
        onMouseEnter={() => toolbarCollapsed && setToolbarHover(true)}
        onMouseLeave={() => toolbarCollapsed && setToolbarHover(false)}
      >
        {toolbarCollapsed && !toolbarHover && (
          <button
            type="button"
            style={{
              ...toolbarButton,
              padding: '6px 12px',
              borderColor: 'rgba(96,165,250,0.9)',
              background: 'rgba(15,23,42,0.9)'
            }}
          >
            Controls (hover to open)
          </button>
        )}

        {(!toolbarCollapsed || toolbarHover) && (
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(15,23,42,0.95)',
              borderRadius: 12,
              border: '1px solid rgba(30,64,175,0.8)',
              boxShadow: '0 18px 40px rgba(15,23,42,0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap'
            }}
          >
            <strong style={{ fontSize: '0.9rem' }}>Solar System 3D</strong>

            <label style={{ fontSize: '0.78rem' }}>
              Speed{' '}
              <input
                type="range"
                min="0.1"
                max="24"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: 160, verticalAlign: 'middle' }}
              />
            </label>
            <span style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
              {speed.toFixed(2)} h/s
            </span>

            <button
              type="button"
              style={toolbarButton}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? '▶ Play' : '⏸ Pause'}
            </button>

            <button type="button" style={toolbarButton} onClick={resetCameraAndTime}>
              🎯 Reset cam + time
            </button>

            <label
              style={{
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <input
                type="checkbox"
                checked={followEarth}
                onChange={(e) => setFollowEarth(e.target.checked)}
              />
              Follow Earth
            </label>

            <div
              style={{
                display: 'inline-flex',
                gap: 6,
                marginLeft: 4,
                flexWrap: 'wrap'
              }}
            >
              {overlayChip('zodiac', 'Zodiac')}
              {overlayChip('hale', 'Hawaiian Hale')}
              {overlayChip('iwik', 'Ka Iwikuamoʻo')}
              {overlayChip('compass', 'Star Compass')}
              {overlayChip('wayfind', 'Wayfind (Little Dipper)')}
              {overlayChip('constellations', 'Constellations')}
              <button
                type="button"
                style={{
                  ...toolbarButton,
                  padding: '4px 9px',
                  borderColor: earthView
                    ? 'rgba(110,231,183,0.9)'
                    : 'rgba(75,85,99,0.9)',
                  color: earthView ? '#bbf7d0' : '#9ca3af'
                }}
                onClick={() => {
                  setEarthView((v) => !v);
                  if (overlay !== 'zodiac') setOverlay('zodiac');
                }}
              >
                {earthView ? 'Earth view on' : 'Earth view (sky arc)'}
              </button>
              <button
                type="button"
                style={{
                  ...toolbarButton,
                  padding: '4px 9px',
                  borderColor: showI3
                    ? 'rgba(56,189,248,0.9)'
                    : 'rgba(75,85,99,0.9)',
                  color: showI3 ? '#e0f2fe' : '#9ca3af'
                }}
                onClick={() => setShowI3((v) => !v)}
              >
                3I/ATLAS path
              </button>
              <button
                type="button"
                style={{
                  ...toolbarButton,
                  padding: '4px 9px',
                  borderColor: showChat ? 'rgba(52,211,153,0.9)' : 'rgba(75,85,99,0.9)',
                  color: showChat ? '#bbf7d0' : '#9ca3af'
                }}
                onClick={() => setShowChat((v) => !v)}
              >
                {showChat ? 'Hide ChatGPT' : 'Ask ChatGPT'}
              </button>
            </div>

            {/* Ground view / location controls */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '6px 10px',
                border: '1px solid rgba(148,163,184,0.7)',
                borderRadius: 9,
                background: 'rgba(15,23,42,0.96)',
                minWidth: 230
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Ground view</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5f5' }}>{geoStatusLabel}</div>
              {geo.error && (
                <div style={{ fontSize: '0.72rem', color: '#fda4af' }}>{geo.error}</div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.76rem' }}>
                  Lat
                  <input
                    type="number"
                    step="0.0001"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    style={{
                      marginLeft: 4,
                      width: 96,
                      background: '#0f172a',
                      color: '#e5e7eb',
                      border: '1px solid rgba(148,163,184,0.8)',
                      borderRadius: 6,
                      padding: '2px 6px'
                    }}
                  />
                </label>
                <label style={{ fontSize: '0.76rem' }}>
                  Lon
                  <input
                    type="number"
                    step="0.0001"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    style={{
                      marginLeft: 4,
                      width: 96,
                      background: '#0f172a',
                      color: '#e5e7eb',
                      border: '1px solid rgba(148,163,184,0.8)',
                      borderRadius: 6,
                      padding: '2px 6px'
                    }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" style={toolbarButton} onClick={applyManualLocation}>
                  Use manual lat/lon
                </button>
                <button type="button" style={toolbarButton} onClick={requestGeolocation}>
                  Use my device location
                </button>
              </div>
            </div>

            {/* Season widget */}
            <span
              style={{
                marginLeft: 6,
                padding: '6px 10px',
                border: '1px solid rgba(148,163,184,0.7)',
                borderRadius: 9,
                background: 'rgba(15,23,42,0.96)',
                fontSize: '0.78rem'
              }}
            >
              <strong>{season.current}</strong> • Next: {season.next} in {season.days}{' '}
              day{season.days === 1 ? '' : 's'}
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                {season.subsolar}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: 2 }}>
                {season.current} signs:{' '}
                {ZODIAC.filter((z) => z.season === season.current)
                  .map((z) => z.name)
                  .join(' • ')}
              </div>
            </span>

            {/* Moon widget */}
            <span
              style={{
                padding: '6px 10px',
                border: '1px solid rgba(148,163,184,0.7)',
                borderRadius: 9,
                background: 'rgba(15,23,42,0.96)',
                fontSize: '0.78rem'
              }}
            >
              🌙 {moon.phaseName} • {(moon.illum * 100).toFixed(0)}% • age {moon.age.toFixed(1)} d
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                Next: {moon.nextMajor} in {moon.daysToNext.toFixed(1)} d —{' '}
                {moon.nextDate.toLocaleDateString()}
              </div>
            </span>

            <button
              type="button"
              style={{
                ...toolbarButton,
                padding: '6px 10px',
                borderColor: 'rgba(148,163,184,0.8)'
              }}
              onClick={() => {
                setToolbarCollapsed((v) => !v);
                setToolbarHover(false);
              }}
            >
              {toolbarCollapsed ? 'Pin controls' : 'Hide controls (hover to peek)'}
            </button>
          </div>
        )}
      </div>

      {/* Star / planet info panel (right) */}
      {(selectedStar || selectedPlanet) && (
        <div
          style={{
            position: 'fixed',
            right: 12,
            top: 12,
            zIndex: 11,
            maxWidth: 320,
            background: 'rgba(15,23,42,0.96)',
            border: '1px solid rgba(148,163,184,0.8)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: '0.85rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 4
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                {selectedStar
                  ? selectedStar.hawaiian
                    ? `${selectedStar.hawaiian} (${selectedStar.name})`
                    : selectedStar.name
                  : selectedPlanet.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {selectedStar
                  ? 'Guide star'
                  : 'Planet (orbits are scaled & circular for teaching)'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedStar(null);
                setSelectedPlanet(null);
              }}
              style={{
                border: '1px solid rgba(148,163,184,0.8)',
                background: 'rgba(15,23,42,0.95)',
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {selectedStar && (
            <div style={{ lineHeight: 1.5 }}>
              RA: {selectedStar.ra.toFixed(3)} h • Dec: {selectedStar.dec.toFixed(2)}°
              <br />
              Alt: {selectedStar.alt.toFixed(1)}° • Az: {selectedStar.az.toFixed(1)}°
              <br />
              Mag: {selectedStar.mag ?? '—'}
              {IWIK_CHAIN.includes(selectedStar.name) && (
                <div style={{ marginTop: 6, color: '#4ade80' }}>
                  Member of Ka Iwikuamoʻo backbone star line.
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                Star positions use the simulation time (
                {simTime.toLocaleString()} – {tz}) and your latitude to compute altitude
                & azimuth.
              </div>
            </div>
          )}

          {selectedPlanet && !selectedStar && (
            <div style={{ lineHeight: 1.5 }}>
              Orbit radius (scaled): {selectedPlanet.orbitRadius} units
              <br />
              Orbital period: {selectedPlanet.periodDays.toFixed(1)} days
              <br />
              Visual radius in scene: {selectedPlanet.size}
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                Orbits are circular & coplanar, tuned so you can see the real
                **relative speeds** of Mercury, Earth, Jupiter, etc. For truly precise
                ephemerides you’d pull in a dedicated astronomy library, but this is
                perfect for teaching paths over a year.
              </div>
            </div>
          )}
        </div>
      )}
      {/* Sim time info (bottom-left) */}
      <div
        style={{
          position: 'fixed',
          left: 12,
          bottom: 10,
          zIndex: 9,
          padding: '6px 10px',
          background: 'rgba(15,23,42,0.96)',
          borderRadius: 8,
          border: '1px solid rgba(30,64,175,0.8)',
          fontSize: '0.78rem'
        }}
      >
        <div>
          <strong>Simulation time</strong>
        </div>
        <div>
          {simTime.toLocaleString()} — {tz}
        </div>
        <div>
          Day {simDayOfYear} of {simTime.getFullYear()}
        </div>
      </div>

      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 30, 70], fov: 45, near: 0.1, far: 500 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.18} />
        <directionalLight position={[30, 40, 10]} intensity={0.8} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={10}
          maxDistance={120}
        />
        <CameraFollower
          followEarth={followEarth}
          controlsRef={controlsRef}
          earthPosRef={earthPosRef}
        />

        <Stars
          radius={140}
          depth={60}
          count={2400}
          factor={2.6}
          saturation={0}
          fade
        />

        {/* “Floor” hint */}
        <gridHelper
          args={[90, 24, '#1f2937', '#111827']}
          position={[0, -0.01, 0]}
        />

        {/* Sun + orbits */}
        <Sun />
        {PLANETS.map((p) => (
          <Planet
            key={p.name}
            def={p}
            when={simTime}
            onSelect={(def) => {
              setSelectedPlanet(def);
              setSelectedStar(null);
            }}
            earthPosRef={earthPosRef}
          />
        ))}

        {/* Ecliptic ring */}
        <EclipticRing r={beltRadius} />

        {/* Overlays driven by toolbar mode */}
        {overlay === 'zodiac' && (
          <ZodiacBelt
            r={zodiacRadius}
            currentSeason={season.current}
            mode={earthView ? 'sky' : 'flat'}
            center={earthView ? earthPos : undefined}
          />
        )}
        {overlay === 'hale' && <HaleBelt r={beltRadius + 2} />}
        {overlay === 'iwik' && (
          <IwikuamooOverlay
            when={simTime}
            lat={lat}
            lon={lon}
            radius={STAR_SPHERE * 0.96}
          />
        )}
        {overlay === 'compass' && (
          <StarCompassKaIwikuamoo
            r={beltRadius + 2}
            when={simTime}
            lat={lat}
            lon={lon}
          />
        )}
        {overlay === 'wayfind' && (
          <WayfindLittleDipper
            when={simTime}
            lat={lat}
            lon={lon}
            r={STAR_SPHERE * 0.9}
          />
        )}
        {overlay === 'constellations' && (
          <ConstellationLinesOverlay
            when={simTime}
            lat={lat}
            lon={lon}
            radius={STAR_SPHERE}
          />
        )}

        {/* Always show labeled guide stars */}
        <RealGuideStars
          when={simTime}
          lat={lat}
          lon={lon}
          radius={STAR_SPHERE}
          onSelect={(s) => {
            setSelectedStar(s);
            setSelectedPlanet(null);
          }}
        />

        {/* Interstellar comet 3I/ATLAS teaching track */}
        {showI3 && <I3AtlasPath speed={speed} />}
      </Canvas>
    </div>
  );
}
