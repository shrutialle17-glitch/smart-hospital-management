import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MapZone = ({ id, x, y, width, height, label, colorClass, queueCount, onHover, onLeave }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(true);
    if (onHover) onHover(id);
  };

  const handleLeave = () => {
    setIsHovered(false);
    if (onLeave) onLeave();
  };

  return (
    <g onMouseEnter={handleHover} onMouseLeave={handleLeave} style={{ cursor: 'pointer' }} className="text-gray-900 dark:text-white">
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="8"
        strokeWidth="2"
        className={`fill-current ${colorClass}`}
        initial={{ opacity: 0.9 }}
        animate={{ opacity: isHovered ? 1 : 0.9, scale: isHovered ? 1.02 : 1 }}
        style={{ transformOrigin: `${x + width / 2}px ${y + height / 2}px` }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-bold pointer-events-none"
        style={{ fill: 'currentColor', fontSize: '18px' }}
      >
        {label}
      </text>
      
      {/* Live Queue Badge Indicator */}
      {queueCount !== undefined && queueCount > 0 && (
        <g>
          <circle 
            cx={x + width - 15} 
            cy={y + 15} 
            r="12" 
            className="fill-red-500" 
          />
          <text 
            x={x + width - 15} 
            y={y + 16} 
            textAnchor="middle" 
            alignmentBaseline="middle" 
            className="fill-white font-bold text-xs pointer-events-none"
          >
            {queueCount}
          </text>
        </g>
      )}
    </g>
  );
};

const HospitalMap = ({ queuesData = [], isPublic = false }) => {
  const [activeZone, setActiveZone] = useState(null);

  // Map queue counts by department/zone
  const getQueueCount = (zoneId) => {
    if (isPublic) return undefined; // Don't show counts on public map
    const q = queuesData.find(q => q.department && q.department.toLowerCase().includes(zoneId));
    if (q) return q.tokensWaiting;
    return 0;
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto glass-panel p-8 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Facility Floorplan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Main Level – Interactive Wayfinding</p>
        </div>
        {!isPublic && (
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span> Live Queue Active
          </div>
        )}
      </div>

      <div className="w-full aspect-[16/9] relative bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner">
        {/* Subtle grid background for architectural feel */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <svg viewBox="0 0 1000 562" className="w-full h-full drop-shadow-sm relative z-10">
          <defs>
            <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="10" height="10">
              <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-gray-800" opacity="0.5"/>
            </pattern>
          </defs>

          {/* Building Outer Shell */}
          <rect x="40" y="40" width="920" height="482" rx="4" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-300 dark:text-gray-700" />
          
          {/* Main Corridors (Filled with hatching for texture) */}
          <rect x="280" y="40" width="120" height="482" fill="url(#diagonalHatch)" />
          <rect x="40" y="220" width="920" height="120" fill="url(#diagonalHatch)" />

          {/* Entrance Indicators */}
          <path d="M 40 260 L 20 260 M 40 300 L 20 300" stroke="currentColor" strokeWidth="4" className="text-gray-400" />
          <text x="15" y="280" textAnchor="end" alignmentBaseline="middle" className="fill-gray-500 font-bold text-xs" transform="rotate(-90 15 280)">MAIN ENTRANCE</text>

          {/* Zones */}
          <MapZone 
            id="reception" x="60" y="60" width="200" height="140" 
            label="Reception & Waiting" colorClass="text-blue-50 dark:text-blue-900/30 stroke-blue-200 dark:stroke-blue-800" 
            onHover={setActiveZone} onLeave={() => setActiveZone(null)} 
          />
          <MapZone 
            id="emergency" x="60" y="360" width="200" height="140" 
            label="Emergency (ER)" colorClass="text-red-50 dark:text-red-900/30 stroke-red-200 dark:stroke-red-800" 
            onHover={setActiveZone} onLeave={() => setActiveZone(null)} 
          />
          <MapZone 
            id="cardiology" x="420" y="60" width="240" height="140" 
            label="Cardiology Ward" colorClass="text-emerald-50 dark:text-emerald-900/30 stroke-emerald-200 dark:stroke-emerald-800" 
            queueCount={getQueueCount('cardiolog')}
            onHover={setActiveZone} onLeave={() => setActiveZone(null)} 
          />
          <MapZone 
            id="neurology" x="680" y="60" width="260" height="140" 
            label="Neurology & ICU" colorClass="text-indigo-50 dark:text-indigo-900/30 stroke-indigo-200 dark:stroke-indigo-800" 
            queueCount={getQueueCount('neurolog')}
            onHover={setActiveZone} onLeave={() => setActiveZone(null)} 
          />
          <MapZone 
            id="pharmacy" x="420" y="360" width="240" height="140" 
            label="Central Pharmacy" colorClass="text-amber-50 dark:text-amber-900/30 stroke-amber-200 dark:stroke-amber-800" 
            onHover={setActiveZone} onLeave={() => setActiveZone(null)} 
          />
          <MapZone 
            id="lab" x="680" y="360" width="260" height="140" 
            label="Diagnostic Labs" colorClass="text-cyan-50 dark:text-cyan-900/30 stroke-cyan-200 dark:stroke-cyan-800" 
            onHover={setActiveZone} onLeave={() => setActiveZone(null)} 
          />
        </svg>

        {/* Hover Info Tooltip - Positioned in the dead center corridor so it never blocks rooms */}
        <AnimatePresence>
          {activeZone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white px-6 py-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-none min-w-[220px] text-center z-50"
            >
              <span className="font-bold text-lg block mb-1 capitalize text-primary">{activeZone.replace('-', ' ')}</span>
              <span className="text-sm text-gray-500 dark:text-gray-300 block">Status: Fully Operational</span>
              {!isPublic && getQueueCount(activeZone.substring(0,6)) > 0 && (
                <span className="text-xs font-bold text-error mt-2 inline-block bg-error/10 px-3 py-1 rounded-full border border-error/20">
                  {getQueueCount(activeZone.substring(0,6))} Patients Waiting
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HospitalMap;
