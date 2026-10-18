import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Radio,
  Navigation,
  Compass
} from 'lucide-react';
import { CARRIER_NETWORKS } from '../data/mockData';

interface RouteMapScreenProps {
  onBack: () => void;
}

export const RouteMapScreen: React.FC<RouteMapScreenProps> = ({ onBack }) => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('vodafone');
  const carrierZones = CARRIER_NETWORKS[selectedCarrier] || {};

  // Sample GPX track points (Leeds / West Yorkshire test route from LON -1.60..-1.48, LAT 53.795..53.815)
  const routePoints = [
    { lon: -1.600, lat: 53.795, time: '08:30:00' },
    { lon: -1.585, lat: 53.798, time: '08:30:45' },
    { lon: -1.565, lat: 53.805, time: '08:31:30' },
    { lon: -1.550, lat: 53.810, time: '08:32:15' },
    { lon: -1.530, lat: 53.815, time: '08:33:00' },
    { lon: -1.510, lat: 53.812, time: '08:33:45' },
    { lon: -1.485, lat: 53.808, time: '08:34:30' },
  ];

  // SVG coordinate transformation for lon [-1.62, -1.47], lat [53.78, 53.83]
  const minLon = -1.62, maxLon = -1.47;
  const minLat = 53.78, maxLat = 53.835;

  const mapX = (lon: number) => ((lon - minLon) / (maxLon - minLon)) * 680 + 30;
  const mapY = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat)) * 360 + 30;

  // Path string for SVG
  const pathD = routePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.lon)} ${mapY(pt.lat)}`).join(' ');

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Main Card */}
      <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#3fb950]" />
              <span>Carrier Coverage & GPX Route Telemetry</span>
            </h2>
            <p className="text-xs text-[#8b949e] mt-1">
              Geospatial telemetry correlation via sweep-line rectangle overlap + Liang-Barsky edge clipping.
            </p>
          </div>

          {/* Carrier Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e]">Select Carrier:</span>
            <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
              {Object.keys(CARRIER_NETWORKS).map((carrier) => (
                <button
                  key={carrier}
                  onClick={() => setSelectedCarrier(carrier)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition-colors cursor-pointer ${
                    selectedCarrier === carrier
                      ? 'bg-[#3fb950]/20 text-[#3fb950] font-semibold'
                      : 'text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  {carrier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map Canvas / SVG Area */}
        <div className="relative rounded-xl overflow-hidden bg-[#0d1117] border border-[#30363d] p-4">
          <div className="flex items-center justify-between text-xs text-[#8b949e] mb-2 font-mono">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Telemetry Coordinates: West Yorkshire Survey Track</span>
            </span>
            <span>Sweep-line O((n+k) log n)</span>
          </div>

          <div className="relative w-full aspect-[16/9] max-h-[460px] bg-[#090d13] rounded-lg overflow-hidden border border-[#30363d]/50">
            {/* SVG Overlay */}
            <svg
              className="w-full h-full"
              viewBox="0 0 740 420"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="740" height="420" fill="url(#grid)" />

              {/* Carrier Zone Bounding Boxes */}
              {Object.entries(carrierZones).map(([zoneName, [lon0, lat0, lon1, lat1]]) => {
                const x0 = mapX(lon0);
                const y0 = mapY(lat1);
                const w = Math.abs(mapX(lon1) - mapX(lon0));
                const h = Math.abs(mapY(lat0) - mapY(lat1));
                const is5G = zoneName.includes('5g');

                return (
                  <g key={zoneName}>
                    <rect
                      x={Math.min(x0, mapX(lon1))}
                      y={Math.min(y0, mapY(lat0))}
                      width={w}
                      height={h}
                      fill={is5G ? 'rgba(163, 113, 247, 0.12)' : 'rgba(63, 185, 80, 0.12)'}
                      stroke={is5G ? '#a371f7' : '#3fb950'}
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      rx="6"
                    />
                    <text
                      x={Math.min(x0, mapX(lon1)) + 8}
                      y={Math.min(y0, mapY(lat0)) + 18}
                      fill={is5G ? '#a371f7' : '#3fb950'}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {selectedCarrier.toUpperCase()} · {zoneName}
                    </text>
                  </g>
                );
              })}

              {/* GPX Route Path Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#58a6ff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Track Waypoints */}
              {routePoints.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={mapX(pt.lon)}
                    cy={mapY(pt.lat)}
                    r={i === 0 ? 6 : i === routePoints.length - 1 ? 6 : 4}
                    fill={i === 0 ? '#3fb950' : i === routePoints.length - 1 ? '#f85149' : '#58a6ff'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={mapX(pt.lon) + 6}
                    y={mapY(pt.lat) - 6}
                    fill="#e6edf3"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {pt.time}
                  </text>
                </g>
              ))}

              {/* Liang-Barsky Crossing Clip Annotations */}
              <g>
                <circle cx={mapX(-1.585)} cy={mapY(53.798)} r="8" fill="none" stroke="#d29922" strokeWidth="2" />
                <text x={mapX(-1.585) + 12} y={mapY(53.798) + 14} fill="#d29922" fontSize="10" fontFamily="sans-serif">
                  Entry Crossing (t=0.8s)
                </text>

                <circle cx={mapX(-1.530)} cy={mapY(53.815)} r="8" fill="none" stroke="#d29922" strokeWidth="2" />
                <text x={mapX(-1.530) + 12} y={mapY(53.815) - 4} fill="#d29922" fontSize="10" fontFamily="sans-serif">
                  Chunk Cut / Exit (t=5.2s)
                </text>
              </g>
            </svg>

            {/* Map Legend Floating Box */}
            <div className="absolute bottom-3 left-3 bg-[#161b22]/90 backdrop-blur border border-[#30363d] rounded-xl p-3 text-xs space-y-1.5 shadow-lg">
              <div className="font-semibold text-white text-[11px] mb-1">Coverage Telemetry Legend</div>
              <div className="flex items-center gap-2 text-[#58a6ff]">
                <span className="w-3 h-1 bg-[#58a6ff] rounded" />
                <span>Vehicle GPX Route</span>
              </div>
              <div className="flex items-center gap-2 text-[#3fb950]">
                <span className="w-3 h-3 rounded border border-[#3fb950] bg-[#3fb950]/20" />
                <span>Urban 4G Coverage Window</span>
              </div>
              <div className="flex items-center gap-2 text-[#d29922]">
                <span className="w-2.5 h-2.5 rounded-full border border-[#d29922]" />
                <span>Liang-Barsky Entry/Exit Crossing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Summary Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <h4 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#58a6ff]" />
              <span>Sweep-Line Candidate Pruning</span>
            </h4>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              GPX track segments are matched against carrier bounding boxes using a 1D segment tree along the Y-axis.
              Limits candidate route edges to `O((n+k) log n)` complexity, avoiding expensive brute-force polygon checks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <h4 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-[#3fb950]" />
              <span>Liang-Barsky Edge Parametrization</span>
            </h4>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Computes exact coordinate entry and exit times by solving parametric line clipping `P(t) = P0 + t*(P1 - P0)`.
              Interpolates timestamp seconds accurately so video frame indexes map exactly to upstream coverage windows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
