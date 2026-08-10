# OmniMind Browser Extension

A Chrome extension (Manifest V3) that puts the OmniMind agent one click away
from any tab: toolbar popup for quick questions, and a right-click "Ask
OmniMind about..." on any selected text. Same streaming backend as the web
app — no separate account, no API key of its own.

## Install locally (works today, no Chrome Web Store needed)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `extension/` folder
4. Pin the OmniMind icon to the toolbar

## Publish to the Chrome Web Store (optional, needs your own account)

1. Create a one-time (\$5) [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole)
2. Zip this folder's contents (not the folder itself)
3. Upload as a new item, fill in the store listing, submit for review

Nothing in the extension code changes for this step — it's the same
package either way.
