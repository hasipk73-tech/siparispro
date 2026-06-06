const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

function buildFullAddress(address, neighborhood) {
  const parts = [address];
  if (neighborhood && neighborhood !== "Gel Al" && neighborhood !== "Belirtilmemiş") {
    parts.push(neighborhood);
  }
  parts.push("İstanbul", "Türkiye");
  return parts.join(", ");
}

export function buildMapsUrl(address, neighborhood) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildFullAddress(address, neighborhood))}`;
}

export default function MapView({ address, neighborhood }) {
  const fullAddress = buildFullAddress(address, neighborhood);
  const mapsLink    = buildMapsUrl(address, neighborhood);
  const encoded     = encodeURIComponent(fullAddress);

  if (!MAPS_KEY) {
    return (
      <div className="map-btn-card">
        <div className="map-btn-card__info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="map-btn-card__addr">{fullAddress}</span>
        </div>
        <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn-maps-open">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Google Maps'te Aç
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    );
  }

  const staticUrl =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${encoded}&zoom=17&size=480x220&maptype=satellite` +
    `&markers=color:red%7Clabel:%7C${encoded}&key=${MAPS_KEY}`;

  return (
    <div className="map-container">
      <img src={staticUrl} alt={`Uydu görüntüsü: ${fullAddress}`} className="map-image" loading="lazy" />
      <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="map-open-link map-open-link--overlay">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Google Maps'te Aç
      </a>
    </div>
  );
}
