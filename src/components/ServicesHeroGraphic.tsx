import React from 'react';

export const ServicesHeroGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full aspect-[600/520] rounded-3xl overflow-hidden shadow-2xl border border-teal-600/20 bg-white ${className}`}>
      <style>{`
        .svc-hero-svg { width: 100%; height: 100%; display: block; }
        @media (prefers-reduced-motion: no-preference) {
          .svc-gear-slow { animation: svcSpin 14s linear infinite; }
          .svc-gear-rev  { animation: svcSpinRev 9s linear infinite; }
          .svc-node { animation: svcPulse 3.6s ease-in-out infinite; }
        }
        @keyframes svcSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes svcSpinRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes svcPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      `}</style>

      <svg className="svc-hero-svg" viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="panelGrad" cx="35%" cy="30%" r="90%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EBF4F4" />
          </radialGradient>
          <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#207680" />
            <stop offset="100%" stopColor="#104B54" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="600" height="520" rx="24" fill="url(#panelGrad)" />

        {/* Web Line */}
        <path
          id="path-web"
          d="M 300.0,250.0 L 300.0,80.0"
          fill="none"
          stroke="#207680"
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity="0.55"
        />
        <circle r="4" fill="#FFD200">
          <animateMotion dur="3.6s" repeatCount="indefinite" begin="0.00s" path="M 300.0,250.0 L 300.0,80.0" />
          <animate attributeName="opacity" values="0;1;1;0" dur="3.6s" repeatCount="indefinite" begin="0.00s" />
        </circle>

        {/* App Line */}
        <path
          id="path-app"
          d="M 300.0,250.0 L 461.7,197.5"
          fill="none"
          stroke="#207680"
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity="0.55"
        />
        <circle r="4" fill="#FFD200">
          <animateMotion dur="3.6s" repeatCount="indefinite" begin="0.25s" path="M 300.0,250.0 L 461.7,197.5" />
          <animate attributeName="opacity" values="0;1;1;0" dur="3.6s" repeatCount="indefinite" begin="0.25s" />
        </circle>

        {/* SaaS Line */}
        <path
          id="path-saas"
          d="M 300.0,250.0 L 399.9,387.5"
          fill="none"
          stroke="#207680"
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity="0.55"
        />
        <circle r="4" fill="#FFD200">
          <animateMotion dur="3.6s" repeatCount="indefinite" begin="0.50s" path="M 300.0,250.0 L 399.9,387.5" />
          <animate attributeName="opacity" values="0;1;1;0" dur="3.6s" repeatCount="indefinite" begin="0.50s" />
        </circle>

        {/* VA Line */}
        <path
          id="path-va"
          d="M 300.0,250.0 L 200.1,387.5"
          fill="none"
          stroke="#207680"
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity="0.55"
        />
        <circle r="4" fill="#FFD200">
          <animateMotion dur="3.6s" repeatCount="indefinite" begin="0.75s" path="M 300.0,250.0 L 200.1,387.5" />
          <animate attributeName="opacity" values="0;1;1;0" dur="3.6s" repeatCount="indefinite" begin="0.75s" />
        </circle>

        {/* Automation Line */}
        <path
          id="path-automation"
          d="M 300.0,250.0 L 138.3,197.5"
          fill="none"
          stroke="#207680"
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity="0.55"
        />
        <circle r="4" fill="#FFD200">
          <animateMotion dur="3.6s" repeatCount="indefinite" begin="1.00s" path="M 300.0,250.0 L 138.3,197.5" />
          <animate attributeName="opacity" values="0;1;1;0" dur="3.6s" repeatCount="indefinite" begin="1.00s" />
        </circle>

        {/* Large Central Gear */}
        <g className="svc-gear-slow" style={{ transformOrigin: '300.0px 250.0px' }}>
          <g fill="url(#gearGrad)">
            <circle cx="300.0" cy="250.0" r="34" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(0.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(36.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(72.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(108.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(144.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(180.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(216.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(252.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(288.00 300.0 250.0)" />
            <rect x="297.00" y="207.00" width="6.00" height="13.00" rx="1.5" transform="rotate(324.00 300.0 250.0)" />
            <circle cx="300.0" cy="250.0" r="14.28" fill="#0A363D" fillOpacity="0.5" />
          </g>
        </g>

        {/* Small Companion Gear */}
        <g className="svc-gear-rev" style={{ transformOrigin: '318.0px 266.0px' }}>
          <g fill="#207680">
            <circle cx="318.0" cy="266.0" r="16" />
            <rect x="315.75" y="244.00" width="4.50" height="10.00" rx="1.5" transform="rotate(0.00 318.0 266.0)" />
            <rect x="315.75" y="244.00" width="4.50" height="10.00" rx="1.5" transform="rotate(60.00 318.0 266.0)" />
            <rect x="315.75" y="244.00" width="4.50" height="10.00" rx="1.5" transform="rotate(120.00 318.0 266.0)" />
            <rect x="315.75" y="244.00" width="4.50" height="10.00" rx="1.5" transform="rotate(180.00 318.0 266.0)" />
            <rect x="315.75" y="244.00" width="4.50" height="10.00" rx="1.5" transform="rotate(240.00 318.0 266.0)" />
            <rect x="315.75" y="244.00" width="4.50" height="10.00" rx="1.5" transform="rotate(300.00 318.0 266.0)" />
            <circle cx="318.0" cy="266.0" r="6.72" fill="#0A363D" fillOpacity="0.5" />
          </g>
        </g>

        {/* Node: Web */}
        <g className="svc-node" style={{ transformOrigin: '300.0px 80.0px', animationDelay: '0.0s' }}>
          <circle cx="300.0" cy="80.0" r="26" fill="#FFFFFF" stroke="#207680" strokeWidth="2" />
          <g transform="translate(286.0,69.0) scale(1)" fill="none" stroke="#0A363D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4 L2 12 L9 20" />
            <path d="M19 4 L26 12 L19 20" />
          </g>
        </g>
        <text x="300.0" y="124.0" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" fontWeight="600" fill="#0A363D">
          <tspan x="300.0" dy="0">Web</tspan>
        </text>

        {/* Node: App */}
        <g className="svc-node" style={{ transformOrigin: '461.68px 197.47px', animationDelay: '0.4s' }}>
          <circle cx="461.68" cy="197.47" r="26" fill="#FFFFFF" stroke="#207680" strokeWidth="2" />
          <g transform="translate(452.68,183.47) scale(1)" fill="none" stroke="#0A363D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="16" height="26" rx="3" />
            <line x1="7" y1="24" x2="11" y2="24" />
          </g>
        </g>
        <text x="461.68" y="241.47" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" fontWeight="600" fill="#0A363D">
          <tspan x="461.68" dy="0">App</tspan>
        </text>

        {/* Node: SaaS */}
        <g className="svc-node" style={{ transformOrigin: '399.92px 387.53px', animationDelay: '0.8s' }}>
          <circle cx="399.92" cy="387.53" r="26" fill="#FFFFFF" stroke="#207680" strokeWidth="2" />
          <g transform="translate(384.92,377.53) scale(1)" fill="none" stroke="#0A363D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 18 a6 6 0 0 1 0 -12 a7 7 0 0 1 13.5 -2 a5.5 5.5 0 0 1 -1 11 z" />
          </g>
        </g>
        <text x="399.92" y="431.53" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" fontWeight="600" fill="#0A363D">
          <tspan x="399.92" dy="0">SaaS</tspan>
        </text>

        {/* Node: Virtual Assistant */}
        <g className="svc-node" style={{ transformOrigin: '200.08px 387.53px', animationDelay: '1.2s' }}>
          <circle cx="200.08" cy="387.53" r="26" fill="#FFFFFF" stroke="#207680" strokeWidth="2" />
          <g transform="translate(189.08,374.53) scale(1)" fill="none" stroke="#0A363D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 14 a9 9 0 0 1 18 0" />
            <rect x="1" y="13" width="5" height="8" rx="2" />
            <rect x="16" y="13" width="5" height="8" rx="2" />
          </g>
        </g>
        <text x="200.08" y="431.53" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" fontWeight="600" fill="#0A363D">
          <tspan x="200.08" dy="0">Virtual</tspan>
          <tspan x="200.08" dy="13">Assistant</tspan>
        </text>

        {/* Node: Automation */}
        <g className="svc-node" style={{ transformOrigin: '138.32px 197.47px', animationDelay: '1.6s' }}>
          <circle cx="138.32" cy="197.47" r="26" fill="#FFFFFF" stroke="#207680" strokeWidth="2" />
          <g transform="translate(125.32,184.47) scale(1)" fill="none" stroke="#0A363D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12 A10 10 0 1 1 12 2" />
            <path d="M12 2 L17 2 L17 7" fill="#0A363D" stroke="none" />
          </g>
        </g>
        <text x="138.32" y="241.47" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" fontWeight="600" fill="#0A363D">
          <tspan x="138.32" dy="0">Automation</tspan>
        </text>
      </svg>
    </div>
  );
};

export default ServicesHeroGraphic;
