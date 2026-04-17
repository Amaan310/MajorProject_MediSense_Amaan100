import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, ExternalLink, Loader2, MapPin, Globe } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const clinicIcon = L.divIcon({
  html: `<div style="background:#16a34a;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏥</div>`,
  className: "", iconSize: [30, 30], iconAnchor: [15, 15],
});

const userIcon = L.divIcon({
  html: `<div style="background:#ef4444;border-radius:50%;width:24px;height:24px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: "", iconSize: [24, 24], iconAnchor: [12, 12],
});

function dist(lat1, lon1, lat2, lon2) {
  const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
}

// Build Google Search URL for a specific clinic — shows reviews, address, hours, phone
function googleSearchUrl(name, city) {
  const query = encodeURIComponent(`${name} ${city}`);
  return `https://www.google.com/search?q=${query}`;
}

// Build Google Maps directions URL
function googleMapsUrl(lat, lon, name) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`;
}

// Build Google Maps search URL for specialist type
function googleMapsSearchUrl(specialist, lat, lon) {
  const q = encodeURIComponent(`${specialist} near me`);
  return `https://www.google.com/maps/search/${q}/@${lat},${lon},14z`;
}

export default function ClinicMap({ searchTerms, specialist }) {
  const [pos, setPos] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [cityName, setCityName] = useState("your city");

  // Reverse geocode to get city name for JustDial links
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "your city";
      setCityName(city);
    } catch { /* ignore */ }
  };

  const fetchClinics = async (lat, lon) => {
    setLoading(true);
    try {
      const q = `[out:json][timeout:25];(node["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lon});way["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lon}););out center;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list = data.elements
        .filter(el => el.lat || el.center)
        .map(el => ({
          id: el.id,
          name: el.tags?.name || "Medical Facility",
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          amenity: el.tags?.amenity || "clinic",
          phone: el.tags?.phone || null,
          website: el.tags?.website || null,
          address: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", ") || "",
        }))
        .sort((a, b) => {
          const da = parseFloat(dist(lat, lon, a.lat, a.lon));
          const db = parseFloat(dist(lat, lon, b.lat, b.lon));
          return da - db;
        })
        .slice(0, 12);
      setClinics(list);
    } catch {
      setNotice("Could not load clinics. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => {
        const { latitude: lat, longitude: lon } = p.coords;
        setPos({ lat, lon });
        fetchClinics(lat, lon);
        reverseGeocode(lat, lon);
      },
      () => {
        const lat = 26.2183, lon = 78.1828;
        setPos({ lat, lon });
        fetchClinics(lat, lon);
        setCityName("Gwalior");
        setNotice("Using default location (Gwalior). Enable location access for accurate results.");
      }
    );
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", margin: "0 0 4px" }}>Nearby Medical Facilities</h3>
          {specialist && (
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
              Looking for: <strong style={{ color: "var(--brand)" }}>{specialist}</strong>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {specialist && pos && (
            <a
              href={googleMapsSearchUrl(specialist, pos.lat, pos.lon)}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
              style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Google Maps
            </a>
          )}
          {specialist && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(specialist + " near " + cityName)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Globe size={12} />
              Search Google
            </a>
          )}
          <button onClick={() => { if (pos) fetchClinics(pos.lat, pos.lon); }} className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>
            <Navigation size={12} /> Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ fontSize: 12, color: "#d97706", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          ⚠️ {notice}
        </div>
      )}

      {/* Map */}
      <div style={{ height: 280, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 14 }}>
        {pos ? (
          <MapContainer center={[pos.lat, pos.lon]} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={[pos.lat, pos.lon]} radius={5000} pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.04 }} />
            <Marker position={[pos.lat, pos.lon]} icon={userIcon}><Popup>📍 Your Location</Popup></Marker>
            {clinics.map(c => (
              <Marker key={c.id} position={[c.lat, c.lon]} icon={clinicIcon} eventHandlers={{ click: () => setSelected(c) }}>
                <Popup>
                  <strong style={{ fontSize: 13 }}>{c.name}</strong><br />
                  <span style={{ fontSize: 12, color: "#888" }}>{dist(pos.lat, pos.lon, c.lat, c.lon)} away</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg2)" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={24} color="var(--brand)" style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Getting your location...</p>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-3)", marginBottom: 10 }}>
          <Loader2 size={13} color="var(--brand)" style={{ animation: "spin 1s linear infinite" }} /> Loading nearby clinics...
        </div>
      )}

      {/* Clinic Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
        {clinics.map(c => {
          const gmLink = googleMapsUrl(c.lat, c.lon, c.name);
          const gsLink = googleSearchUrl(c.name, cityName);
          const isSelected = selected?.id === c.id;

          return (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: "13px 15px",
                borderRadius: 12,
                border: `1px solid ${isSelected ? "var(--brand)" : "var(--border)"}`,
                background: isSelected ? "var(--brand-light)" : "var(--surface)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    🏥 {c.name}
                  </p>
                  {c.address && (
                    <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 8px" }}>{c.address}</p>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}>{pos && dist(pos.lat, pos.lon, c.lat, c.lon)}</span>
                  <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "capitalize", marginTop: 2 }}>{c.amenity}</div>
                </div>
              </div>

              {/* Action Links */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {/* Directions */}
                <a
                  href={gmLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600,
                    padding: "4px 10px", borderRadius: 20,
                    background: "rgba(22,163,74,0.1)", color: "var(--brand)",
                    border: "1px solid rgba(22,163,74,0.2)", textDecoration: "none",
                    transition: "all 0.15s"
                  }}
                >
                  <MapPin size={10} /> Get Directions
                </a>

                {/* Google Search */}
                <a
                  href={gsLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600,
                    padding: "4px 10px", borderRadius: 20,
                    background: "rgba(66,133,244,0.08)", color: "#1a73e8",
                    border: "1px solid rgba(66,133,244,0.2)", textDecoration: "none",
                    transition: "all 0.15s"
                  }}
                >
                  <Globe size={10} /> Google
                </a>

                {/* Website if available */}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11, fontWeight: 600,
                      padding: "4px 10px", borderRadius: 20,
                      background: "rgba(59,130,246,0.08)", color: "#2563eb",
                      border: "1px solid rgba(59,130,246,0.2)", textDecoration: "none"
                    }}
                  >
                    <ExternalLink size={10} /> Website
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* JustDial bulk search footer */}
      {specialist && (
        <div style={{
          marginTop: 14, padding: "12px 14px",
          background: "rgba(66,133,244,0.05)",
          border: "1px solid rgba(66,133,244,0.15)",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>
              Find more {specialist}s nearby
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
              See ratings, reviews & contact info on Google
            </p>
          </div>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(specialist + " near " + cityName)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ fontSize: 12, padding: "7px 14px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Globe size={12} /> Search on Google
          </a>
        </div>
      )}
    </div>
  );
}
