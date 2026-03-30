import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

const DATA_URL = "/storage/pollution_gps.json";

document.querySelector("#app").innerHTML = `
  <div class="layout">
    <h1>Carte Pollution</h1>
    <div class="filters">
      <input id="polluant" placeholder="Polluant (ex: NO2, PM10, O3)" />
      <button id="refresh">Refresh</button>
    </div>
    <div id="map"></div>
    <p id="status"></p>
  </div>
`;

const map = L.map("map").setView([47.0, 2.0], 6);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const layer = L.layerGroup().addTo(map);

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function colorForValue(v) {
  if (v < 20) return "#2ecc71";
  if (v < 40) return "#f1c40f";
  if (v < 60) return "#e67e22";
  return "#e74c3c";
}

function circleIcon(value) {
  const color = colorForValue(value);

  return L.divIcon({
    className: "index-marker",
    html: `<div style="background:${color}">${Math.round(value)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function groupByStation(items) {
  const grouped = new Map();

  for (const item of items) {
    const station = item.station || "Station inconnue";
    const lat = parseNumber(item.lat);
    const lon = parseNumber(item.lon);
    const valeur = parseNumber(item.valeur);

    if (lat === null || lon === null || valeur === null) continue;

    const key = `${station}_${lat}_${lon}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        station,
        lat,
        lon,
        values: [],
        polluants: new Set(),
        latestDate: item.date || null,
      });
    }

    const entry = grouped.get(key);
    entry.values.push(valeur);

    if (item.polluant) {
      entry.polluants.add(item.polluant);
    }

    if (item.date && (!entry.latestDate || item.date > entry.latestDate)) {
      entry.latestDate = item.date;
    }
  }

  return Array.from(grouped.values()).map((entry) => {
    const sum = entry.values.reduce((a, b) => a + b, 0);
    const avg = sum / entry.values.length;

    return {
      station: entry.station,
      lat: entry.lat,
      lon: entry.lon,
      avgValue: avg,
      count: entry.values.length,
      polluants: Array.from(entry.polluants),
      latestDate: entry.latestDate,
    };
  });
}

async function refresh() {
  const status = document.querySelector("#status");
  const polluant = document.querySelector("#polluant").value.trim().toUpperCase();

  status.textContent = "Chargement...";
  layer.clearLayers();

  try {
    const res = await fetch(DATA_URL);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    const filtered = data.filter((item) => {
      if (polluant && String(item.polluant || "").toUpperCase() !== polluant) {
        return false;
      }

      return parseNumber(item.lat) !== null &&
             parseNumber(item.lon) !== null &&
             parseNumber(item.valeur) !== null;
    });

    const stations = groupByStation(filtered);

    stations.forEach((station) => {
      const marker = L.marker([station.lat, station.lon], {
        icon: circleIcon(station.avgValue),
      });

      marker.bindPopup(`
        <b>${station.station}</b><br/>
        Moyenne: ${station.avgValue.toFixed(2)}<br/>
        Nb mesures: ${station.count}<br/>
        Polluants: ${station.polluants.join(", ") || "-"}<br/>
        Dernière date: ${station.latestDate || "-"}
      `);

      layer.addLayer(marker);
    });

    if (stations.length > 0) {
      const bounds = L.latLngBounds(
        stations.map((station) => [station.lat, station.lon])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    status.textContent = `${stations.length} stations affichées`;
  } catch (error) {
    console.error("Erreur chargement données :", error);
    status.textContent = "Erreur chargement données";
  }
}

document.querySelector("#refresh").addEventListener("click", refresh);

refresh();