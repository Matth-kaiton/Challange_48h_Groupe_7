import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./style.css";

const API_BASE = "http://127.0.0.1:8000";

document.querySelector("#app").innerHTML = `
  <div class="layout">
    <h1>Carte Pollution</h1>

    <div class="filters">
      <select id="polluant">
        <option value="">Tous les polluants</option>
        <option value="NO">NO</option>
        <option value="NO2">NO2</option>
        <option value="O3">O3</option>
        <option value="NOX as NO2">NOX as NO2</option>
        <option value="PM10">PM10</option>
        <option value="PM2.5">PM2.5</option>
        <option value="C6H6">C6H6</option>
        <option value="SO2">SO2</option>
        <option value="CO">CO</option>
      </select>
      <input id="minValue" type="number" placeholder="Valeur min" />
      <input id="maxValue" type="number" placeholder="Valeur max" />
      <button id="refresh">Refresh</button>
      <button id="reset">Reset</button>
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

const clusterLayer = L.markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
});

const markerLayer = L.layerGroup();

map.addLayer(clusterLayer);

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
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

function clearMapLayers() {
  clusterLayer.clearLayers();
  markerLayer.clearLayers();

  if (map.hasLayer(clusterLayer)) {
    map.removeLayer(clusterLayer);
  }

  if (map.hasLayer(markerLayer)) {
    map.removeLayer(markerLayer);
  }
}

function buildMarker(station) {
  // On crée le marqueur avec l'icône de couleur basée sur la moyenne
  const marker = L.marker([station.lat, station.lon], {
    icon: circleIcon(station.avgValue),
  });

  // Construction de la popup avec les données groupées
  marker.bindPopup(`
    <div style="font-family: sans-serif; min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; color: #2c3e50;">${station.station}</h3>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      
      <p><strong>Moyenne Pollution:</strong> <span style="color: ${colorForValue(station.avgValue)}; font-weight: bold;">${station.avgValue.toFixed(2)}</span></p>
      
      <p><strong>Polluants détectés:</strong><br/> 
         <small>${station.polluants.join(", ") || "Aucun"}</small>
      </p>
      
      <p><strong>Mesures :</strong> ${station.count} relevé(s)</p>
      
      ${station.latestDate ? `<p><small><i>Dernière mise à jour: ${new Date(station.latestDate).toLocaleString()}</i></small></p>` : ""}
      
      <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 0.85em;">
        <strong>Détails Météo :</strong><br/>
        ${station.meteo ? `
          🌡️ Temp: ${station.meteo.temperature ?? "-"} °C<br/>
          💧 Humidité: ${station.meteo.humidity ?? "-"} %<br/>
          🌬️ Vent: ${station.meteo.wind_speed ?? "-"} km/h
        ` : "Données météo indisponibles"}
      </div>
    </div>
  `);

  return marker;
}
document.querySelector("#polluant").addEventListener("change", () => {
  refresh(true);
});

document.querySelector("#minValue").addEventListener("change", () => {
  refresh(true);
});


document.querySelector("#maxValue").addEventListener("change", () => {
  refresh(true);
});




async function refresh(fitBounds = true) {
  const status = document.querySelector("#status");
  const polluant = document.querySelector("#polluant").value.trim().toUpperCase();
  const minValue = document.querySelector("#minValue").value;
  const maxValue = document.querySelector("#maxValue").value;

  status.textContent = "Chargement...";
  clearMapLayers();

  try {
    const params = new URLSearchParams();
    if (polluant) params.append("polluant", polluant);

    // URL propre sans le bug de syntaxe
    const url = `${API_BASE}/api/pollution?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    let stations = groupByStation(data);

    // Filtrage par valeur min/max (si ton API ne le fait pas déjà)
    if (minValue !== "") {
      stations = stations.filter(s => s.avgValue >= parseFloat(minValue));
    }
    if (maxValue !== "") {
      stations = stations.filter(s => s.avgValue <= parseFloat(maxValue));
    }

    const hasValueFilter = minValue !== "" || maxValue !== "";

    if (hasValueFilter) {
      map.addLayer(markerLayer);
      stations.forEach((station) => {
        markerLayer.addLayer(buildMarker(station));
      });
    } else {
      map.addLayer(clusterLayer);
      stations.forEach((station) => {
        clusterLayer.addLayer(buildMarker(station));
      });
    }

    if (fitBounds && stations.length > 0) {
      const bounds = L.latLngBounds(
        stations.map((station) => [station.lat, station.lon])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    status.textContent = `${data.length} mesures reçues - ${stations.length} stations affichées`;
  } catch (error) {
    console.error("Erreur chargement données :", error);
    status.textContent = "Erreur chargement données";
  }
}

document.querySelector("#refresh").addEventListener("click", () => {
  refresh(true);
});

document.querySelector("#reset").addEventListener("click", () => {
  document.querySelector("#polluant").value = "";
  document.querySelector("#dateStart").value = "";
  document.querySelector("#dateEnd").value = "";
  document.querySelector("#minValue").value = "";
  document.querySelector("#maxValue").value = "";
  refresh(true);
});

refresh(true);