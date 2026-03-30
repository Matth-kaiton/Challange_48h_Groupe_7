import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./style.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

document.querySelector("#app").innerHTML = `
  <div class="layout">
    <h1>Pollution Map</h1>
    <div class="filters">
      <input id="from" type="datetime-local" />
      <input id="to" type="datetime-local" />
      <input id="polluant" placeholder="polluant (ex: NO2, PM10)" />
      <input id="minIndex" type="number" step="0.1" placeholder="min index" />
      <input id="maxIndex" type="number" step="0.1" placeholder="max index" />
      <select id="mode">
        <option value="points">Points (cluster client)</option>
        <option value="clusters">Clusters serveur</option>
      </select>
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

const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);
let clusterLayer = L.layerGroup().addTo(map);

function toIsoFromLocalDateTime(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function colorForIndex(v) {
  if (v < 20) return "#2ecc71";
  if (v < 40) return "#f1c40f";
  if (v < 60) return "#e67e22";
  return "#e74c3c";
}

function readFilters() {
  const bounds = map.getBounds();
  const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
  const from = toIsoFromLocalDateTime(document.querySelector("#from").value);
  const to = toIsoFromLocalDateTime(document.querySelector("#to").value);
  const polluant = document.querySelector("#polluant").value.trim();
  const minIndex = document.querySelector("#minIndex").value;
  const maxIndex = document.querySelector("#maxIndex").value;
  const mode = document.querySelector("#mode").value;

  const params = new URLSearchParams({ bbox });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (polluant) params.set("polluant", polluant);
  if (minIndex) params.set("min_index", minIndex);
  if (maxIndex) params.set("max_index", maxIndex);
  if (mode === "clusters") params.set("zoom", String(map.getZoom()));

  return { mode, query: params.toString() };
}

function circleIcon(indexValue) {
  const color = colorForIndex(indexValue);
  return L.divIcon({
    className: "index-marker",
    html: `<div style="background:${color}">${Math.round(indexValue)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

async function refresh() {
  const status = document.querySelector("#status");
  const { mode, query } = readFilters();
  const endpoint = mode === "clusters" ? "/api/indices/clusters" : "/api/indices";
  status.textContent = "Loading...";
  markerCluster.clearLayers();
  clusterLayer.clearLayers();

  const res = await fetch(`${API_BASE}${endpoint}?${query}`);
  const data = await res.json();

  if (mode === "clusters") {
    data.items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], { icon: circleIcon(item.index_value_avg) });
      marker.bindPopup(
        `<b>Cluster serveur</b><br/>Points: ${item.count}<br/>Index moyen: ${item.index_value_avg}`
      );
      clusterLayer.addLayer(marker);
    });
  } else {
    data.items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], { icon: circleIcon(item.index_value_avg) });
      marker.bindPopup(
        `<b>${item.station_name}</b><br/>Index: ${item.index_value_avg}<br/>Mesure: ${item.measured_at}<br/>Polluants: ${item.polluants.join(", ")}`
      );
      markerCluster.addLayer(marker);
    });
  }

  status.textContent = `${data.total} éléments`;
}

document.querySelector("#refresh").addEventListener("click", refresh);
map.on("moveend", refresh);
map.on("zoomend", refresh);

refresh();
