import React from 'react';
import { useCompactMode } from '../contexts/CompactModeContext';

export function CompactModeDebug() {
  const { isCompactMode, isMobile, isTablet, isDesktop, toggleCompactMode } = useCompactMode();

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg shadow-lg z-50 border-2 border-yellow-500">
      <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Debug Modo Compacto</h3>
      <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
        <div>isCompactMode: <span className="font-mono">{isCompactMode ? 'true' : 'false'}</span></div>
        <div>isMobile: <span className="font-mono">{isMobile ? 'true' : 'false'}</span></div>
        <div>isTablet: <span className="font-mono">{isTablet ? 'true' : 'false'}</span></div>
        <div>isDesktop: <span className="font-mono">{isDesktop ? 'true' : 'false'}</span></div>
        <div>Screen: <span className="font-mono">{typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</span></div>
      </div>
      <div className="mt-2 space-y-1">
        <button
          onClick={toggleCompactMode}
          className="w-full px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          Toggle Compacto
        </button>
        <button
          onClick={() => {
            // Force compact mode
            const event = new CustomEvent('forceCompactMode', { detail: true });
            window.dispatchEvent(event);
          }}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Force Compacto
        </button>
        <button
          onClick={() => {
            // Force normal mode
            const event = new CustomEvent('forceCompactMode', { detail: false });
            window.dispatchEvent(event);
          }}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Force Normal
        </button>
        <button
          onClick={() => {
            // Force mobile mode for testing
            const event = new CustomEvent('forceMobileMode', { detail: true });
            window.dispatchEvent(event);
          }}
          className="w-full px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          Force Mobile
        </button>
      </div>
    </div>
  );
}
