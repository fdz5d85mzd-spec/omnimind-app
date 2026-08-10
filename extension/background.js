chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-omnimind-selection",
    title: 'Ask OmniMind about "%s"',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "ask-omnimind-selection" && info.selectionText) {
    // The popup reads this on open and pre-fills the prompt — chrome
    // doesn't let a background worker open the popup pre-filled directly.
    chrome.storage.local.set({ pendingPrompt: info.selectionText });
    chrome.action.openPopup().catch(() => {
      // openPopup() requires a user gesture in some Chrome versions;
      // the context-menu click itself usually satisfies that, but if not,
      // the stored prompt is still picked up next time the user opens it.
    });
  }
});
