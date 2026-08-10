const API_BASE = "https://api.origox.xyz";

function sessionId() {
  const KEY = "omnimind_ext_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "ext_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

const form = document.getElementById("form");
const promptEl = document.getElementById("prompt");
const submitBtn = document.getElementById("submit");
const answerEl = document.getElementById("answer");

// Picks up a prompt queued by the right-click "Ask OmniMind about..." menu.
chrome.storage.local.get("pendingPrompt", ({ pendingPrompt }) => {
  if (pendingPrompt) {
    promptEl.value = pendingPrompt;
    chrome.storage.local.remove("pendingPrompt");
    promptEl.focus();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = promptEl.value.trim();
  if (!prompt) return;

  submitBtn.disabled = true;
  answerEl.classList.remove("empty", "error");
  answerEl.textContent = "";

  let res;
  try {
    res = await fetch(`${API_BASE}/agent/run/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, session_id: sessionId() }),
    });
  } catch {
    answerEl.classList.add("error");
    answerEl.textContent = "Can't reach OmniMind — it may be waking up, try again in a moment.";
    submitBtn.disabled = false;
    return;
  }

  if (!res.ok || !res.body) {
    answerEl.classList.add("error");
    answerEl.textContent = `Backend returned ${res.status}`;
    submitBtn.disabled = false;
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      let evt;
      try {
        evt = JSON.parse(jsonStr);
      } catch {
        continue;
      }
      if (evt.type === "delta") {
        answerEl.textContent += evt.text;
        answerEl.scrollTop = answerEl.scrollHeight;
      } else if (evt.type === "failed" || evt.type === "denied") {
        answerEl.classList.add("error");
        answerEl.textContent = evt.error;
      }
    }
  }

  submitBtn.disabled = false;
});

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
