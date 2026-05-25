import * as Astronomy from 'astronomy-engine';
import { calculateHouses } from './houses.js';

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const normalizeAngle = (angle) => {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
};

export const getPlanetLongitude = (planet, date) => {
  const t = Astronomy.MakeTime(date);

  // Sun requires special handling - use geocentric position
  if (planet === 'Sun') {
    const sun = Astronomy.SunPosition(t);
    return sun.elon;
  }

  // Moon also needs geocentric coordinates
  if (planet === 'Moon') {
    const moon = Astronomy.EclipticGeoMoon(t);
    return moon.lon;
  }

  // For other planets, use heliocentric longitude
  const body = Astronomy.Body[planet];
  return Astronomy.EclipticLongitude(body, t);
};

export const isRetrograde = (planet, date) => {
  // Basic retrograde detection: compare longitude today vs tomorrow
  try {
    const lon0 = normalizeAngle(getPlanetLongitude(planet, date));
    const next = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const lon1 = normalizeAngle(getPlanetLongitude(planet, next));
    let diff = lon1 - lon0;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff < 0;
  } catch (e) {
    return false;
  }
};

export const getAscendant = (date, latitude, longitude) => {
  const time = Astronomy.MakeTime(date);
  const gmst = Astronomy.SiderealTime(time) * 15; // GMST in degrees
  const lst = (gmst + longitude) % 360; // Local sidereal time in degrees
  const obliq = Astronomy.e_tilt(time);
  const obliquity = obliq.tobl; // true obliquity in degrees

  const latRad = latitude * Math.PI / 180;
  const lstRad = lst * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  
  const ascRad = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(lstRad) * Math.sin(latRad) + Math.tan(oblRad) * Math.cos(latRad)
  );
  
  let asc = ascRad * 180 / Math.PI;
  if (asc < 0) asc += 360;
  
  return asc;
};

export const getNatalChart = async (birthDate, birthTime, latitude = 0, longitude = 0, houseSystem = 'equal') => {
  const date = new Date(`${birthDate}T${birthTime}`);
  const positions = {};

  for (const planet of PLANETS) {
    const lon = normalizeAngle(getPlanetLongitude(planet, date));
    const signIndex = Math.floor(lon / 30) % 12;
    const degree = +(lon - signIndex * 30).toFixed(2);
    const retrograde = isRetrograde(planet, date);
    positions[planet] = { longitude: lon, signIndex, degree, retrograde };
  }

  const ascendant = getAscendant(date, latitude, longitude);
  let houses = null;
  try {
    const { calculateHousesWithSystem } = await import('./houses.js');
    houses = await calculateHousesWithSystem(ascendant, houseSystem, latitude, longitude, date);
  } catch (e) {
    houses = calculateHouses(ascendant);
  }

  return { positions, ascendant, houses };
};