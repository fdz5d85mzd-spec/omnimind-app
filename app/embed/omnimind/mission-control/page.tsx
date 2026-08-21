"use client";

import MissionControl from "../../../mission-control/page";

/**
 * Clean Mission Control surface for the unified OmniMind page in OmniMindAI.
 * The parent application owns navigation and visual chrome.
 */
export default function EmbeddedOmniMindMissionControl() {
  return (
    <>
      <style>{`
        html,
        body {
          background: transparent !important;
        }

        body > .bg-mesh,
        body > .bg-grid,
        body > button[aria-label="Help"],
        body nav.mobile-dock,
        body button[aria-label="Omni Pulse"] {
          display: none !important;
        }

        .omnimind-embed-mission {
          min-height: 100dvh;
          background: transparent !important;
        }

        .omnimind-embed-mission > div {
          min-height: 100dvh !important;
          background: transparent !important;
        }

        .omnimind-embed-mission > div > header {
          display: none !important;
        }

        .omnimind-embed-mission main {
          max-width: 100% !important;
          padding-top: 1.25rem !important;
          padding-bottom: 1.5rem !important;
          background: transparent !important;
        }
      `}</style>
      <div className="omnimind-embed-mission">
        <MissionControl />
      </div>
    </>
  );
}
