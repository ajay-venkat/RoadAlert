"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix standard marker icons for routing machine (it uses default Leaflet icons)
// Leaflet requires marker icon images to be properly mapped when used with webpack/next.js
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function NavigationControl() {
  const map = useMap();
  const [start, setStart] = useState<string>("15.45,73.88"); // Default Goa
  const [end, setEnd] = useState<string>("");
  const [routingControl, setRoutingControl] = useState<L.Routing.Control | null>(null);

  const calculateRoute = () => {
    if (!start || !end) return;

    const startCoords = start.split(",").map(Number);
    const endCoords = end.split(",").map(Number);

    if (startCoords.length !== 2 || endCoords.length !== 2) {
      alert("Please enter valid coordinates in format: lat,lon");
      return;
    }

    if (routingControl) {
      map.removeControl(routingControl);
    }

    const control = L.Routing.control({
      waypoints: [
        L.latLng(startCoords[0], startCoords[1]),
        L.latLng(endCoords[0], endCoords[1]),
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#6366f1", weight: 6, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10,
      },
      fitSelectedRoutes: true,
      show: true,
    }).addTo(map);

    setRoutingControl(control);
  };

  const clearRoute = () => {
    if (routingControl) {
      map.removeControl(routingControl);
      setRoutingControl(null);
    }
    setStart("");
    setEnd("");
  };

  return (
    <div className="navigation-panel">
      <div className="nav-header">
        <h3>Real-time Navigation</h3>
      </div>
      <div className="nav-inputs">
        <div className="input-group">
          <label>Start (Lat, Lon)</label>
          <input
            type="text"
            placeholder="15.45, 73.88"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Destination (Lat, Lon)</label>
          <input
            type="text"
            placeholder="15.55, 73.75"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="nav-buttons">
          <button className="nav-btn primary" onClick={calculateRoute}>
            Navigate
          </button>
          <button className="nav-btn secondary" onClick={clearRoute}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
