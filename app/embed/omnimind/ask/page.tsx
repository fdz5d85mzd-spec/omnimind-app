"use client";

import ChatPage from "../../../chat/page";

/**
 * Clean OmniMind chat surface for the parent OmniMindAI application.
 *
 * The mature chat stays fully functional, but its standalone navigation and
 * global product chrome are removed so the parent app owns the complete shell.
 */
export default function EmbeddedOmniMindAsk() {
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

        .omnimind-embed-chat {
          min-height: 100dvh;
          background: transparent !important;
        }

        .omnimind-embed-chat > div {
          height: 100dvh !important;
          min-height: 560px;
          background: transparent !important;
        }

        .omnimind-embed-chat .bg-mesh,
        .omnimind-embed-chat .bg-grid,
        .omnimind-embed-chat aside,
        .omnimind-embed-chat main > header {
          display: none !important;
        }

        .omnimind-embed-chat main {
          width: 100% !important;
          min-width: 0 !important;
          background: transparent !important;
        }

        .omnimind-embed-chat section,
        .omnimind-embed-chat main > div {
          background-color: transparent;
        }
      `}</style>
      <div className="omnimind-embed-chat">
        <ChatPage />
      </div>
    </>
  );
}
