export default function initOrpheus(root) {
  const input = root.querySelector("#file-input");
  const dropzone = root.querySelector("#dropzone");
  const fileList = root.querySelector("#file-list");
  const transferButton = root.querySelector("#transfer-button");
  const tabs = [...root.querySelectorAll(".tab")];
  const emailFields = root.querySelector("#email-fields");
  const linkNote = root.querySelector("#link-note");
  const toast = root.querySelector("#toast");
  const progressWrap = root.querySelector("#upload-progress");
  const progressBar = root.querySelector("#progress-bar");
  const progressPercent = root.querySelector("#progress-percent");
  const progressLabel = root.querySelector("#progress-label");
  const transferResult = root.querySelector("#transfer-result");
  const copyLinkButton = root.querySelector("#copy-link");

  let files = [];
  let mode = "email";
  const HISTORY_KEY = "orpheus:transfer-history:v1";

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]").filter(
        (item) => new Date(item.expiresAt) > new Date(),
      );
    } catch {
      return [];
    }
  }

  function renderHistory() {
    const history = readHistory();
    const existing = root.querySelector("#transfer-history");
    if (!history.length) {
      existing?.remove();
      return;
    }
    const section = existing || document.createElement("section");
    section.id = "transfer-history";
    section.className = "transfer-history";
    section.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "Your recent transfers";
    section.appendChild(heading);
    history.slice(0, 8).forEach((item) => {
      const row = document.createElement("a");
      row.href = item.url;
      row.className = "history-row";
      const label = document.createElement("strong");
      label.textContent = `${item.fileCount} file${item.fileCount === 1 ? "" : "s"}`;
      const expiry = document.createElement("span");
      expiry.textContent = `Expires ${new Date(item.expiresAt).toLocaleDateString()}`;
      row.append(label, expiry);
      section.appendChild(row);
    });
    if (!existing) root.querySelector(".how")?.before(section);
  }
  renderHistory();

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
  };

  const fileTypeLabel = (name) => {
    const extension = name.split(".").pop() || "";
    return (
      extension
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 3)
        .toUpperCase() || "FILE"
    );
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
  }

  function renderFiles() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
      const row = document.createElement("div");
      row.className = "file-row";
      row.innerHTML = `<div class="file-type">${fileTypeLabel(file.name)}</div><div><strong></strong><span>${formatBytes(file.size)}</span></div><button aria-label="Remove file">×</button>`;
      row.querySelector("strong").textContent = file.name;
      row.querySelector("button").addEventListener("click", () => {
        files.splice(index, 1);
        renderFiles();
      });
      fileList.appendChild(row);
    });
    const size = files.reduce((sum, file) => sum + file.size, 0);
    transferButton.disabled = files.length === 0;
    transferButton.querySelector("span").textContent = files.length
      ? `${mode === "email" ? "Transfer" : "Create link"} · ${formatBytes(size)}`
      : "Choose files to begin";
  }

  function addFiles(selected) {
    const incoming = [...selected];
    const existing = new Set(
      files.map((f) => `${f.name}-${f.size}-${f.lastModified}`),
    );
    incoming.forEach((file) => {
      if (!existing.has(`${file.name}-${file.size}-${file.lastModified}`))
        files.push(file);
    });
    renderFiles();
  }

  async function uploadFileToR2(file, record, transfer, onProgress) {
    const initResponse = await fetch("/api/orpheus/r2-init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transferId: transfer.id,
        fileId: record.id,
        uploadKey: transfer.uploadKey,
      }),
    });
    const init = await initResponse.json();
    if (!initResponse.ok)
      throw new Error(init.error || "Could not start upload.");

    const partCount = Math.ceil(file.size / init.partSize);
    const completed = [];
    const batchSize = 20;
    for (let batchStart = 1; batchStart <= partCount; batchStart += batchSize) {
      const partNumbers = Array.from(
        { length: Math.min(batchSize, partCount - batchStart + 1) },
        (_, index) => batchStart + index,
      );
      const signedResponse = await fetch("/api/orpheus/r2-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferId: transfer.id,
          fileId: record.id,
          uploadKey: transfer.uploadKey,
          uploadId: init.uploadId,
          partNumbers,
        }),
      });
      const signed = await signedResponse.json();
      if (!signedResponse.ok)
        throw new Error(signed.error || "Could not authorize upload.");

      for (let offset = 0; offset < signed.parts.length; offset += 4) {
        const group = signed.parts.slice(offset, offset + 4);
        const results = await Promise.all(
          group.map(async ({ partNumber, url }) => {
            const start = (partNumber - 1) * init.partSize;
            const end = Math.min(start + init.partSize, file.size);
            const response = await fetch(url, {
              method: "PUT",
              body: file.slice(start, end),
            });
            if (!response.ok)
              throw new Error(`Upload part ${partNumber} failed.`);
            const etag = response.headers.get("etag");
            if (!etag) throw new Error("R2 did not return an upload ETag.");
            onProgress(end - start);
            return { partNumber, etag };
          }),
        );
        completed.push(...results);
      }
    }

    const completeResponse = await fetch("/api/orpheus/r2-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transferId: transfer.id,
        fileId: record.id,
        uploadKey: transfer.uploadKey,
        uploadId: init.uploadId,
        parts: completed.sort((a, b) => a.partNumber - b.partNumber),
      }),
    });
    const complete = await completeResponse.json();
    if (!completeResponse.ok)
      throw new Error(complete.error || "Could not finish upload.");
    return complete;
  }

  dropzone.addEventListener("click", () => input.click());
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") input.click();
  });
  input.addEventListener("change", () => addFiles(input.files));
  ["dragenter", "dragover"].forEach((name) =>
    dropzone.addEventListener(name, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    }),
  );
  ["dragleave", "drop"].forEach((name) =>
    dropzone.addEventListener(name, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    }),
  );
  dropzone.addEventListener("drop", (event) =>
    addFiles(event.dataTransfer.files),
  );

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      mode = tab.dataset.mode;
      tabs.forEach((item) => item.classList.toggle("active", item === tab));
      emailFields.hidden = mode === "link";
      linkNote.hidden = mode !== "link";
      renderFiles();
    }),
  );

  transferButton.addEventListener("click", async () => {
    if (!files.length) return;
    const emailTo = root.querySelector("#email-to");
    const emailFrom = root.querySelector("#email-from");
    if (
      mode === "email" &&
      (!emailTo.validity.valid ||
        !emailFrom.validity.valid ||
        !emailTo.value ||
        !emailFrom.value)
    ) {
      showToast("Add both email addresses to continue.");
      return;
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    transferButton.disabled = true;
    transferButton.classList.add("loading");
    transferButton.querySelector("span").textContent =
      "Preparing secure transfer…";
    progressWrap.hidden = false;
    transferResult.hidden = true;

    try {
      const response = await fetch("/api/orpheus/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          recipientEmail: mode === "email" ? emailTo.value : null,
          senderEmail: mode === "email" ? emailFrom.value : null,
          message: root.querySelector("#message").value,
          files: files.map(({ name, size, type }) => ({ name, size, type })),
        }),
      });
      const transfer = await response.json();
      if (!response.ok)
        throw new Error(transfer.error || "Could not create transfer.");

      let completedBytes = 0;
      const uploadedFiles = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const record = transfer.files[index];
        progressLabel.textContent = `Uploading ${file.name}`;
        let currentFileBytes = 0;
        const uploadedBlob = await uploadFileToR2(
          file,
          record,
          transfer,
          (chunkBytes) => {
            currentFileBytes += chunkBytes;
            const percentage = Math.min(
              100,
              Math.round(
                ((completedBytes + currentFileBytes) / totalSize) * 100,
              ),
            );
            progressBar.style.width = `${percentage}%`;
            progressPercent.textContent = `${percentage}%`;
          },
        );
        uploadedFiles.push({
          id: record.id,
          pathname: uploadedBlob.pathname,
          url: uploadedBlob.url,
        });
        completedBytes += file.size;
      }

      const finalizeResponse = await fetch("/api/orpheus/transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: transfer.id,
          uploadKey: transfer.uploadKey,
          files: uploadedFiles,
        }),
      });
      const finalizeResult = await finalizeResponse.json();
      if (!finalizeResponse.ok)
        throw new Error(finalizeResult.error || "Could not finalize transfer.");

      const shareUrl = `${window.location.origin}/atlas?t=${transfer.code}`;
      copyLinkButton.dataset.url = shareUrl;
      const history = readHistory();
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
          [
            {
              url: shareUrl,
              expiresAt: transfer.expiresAt,
              fileCount: files.length,
            },
            ...history.filter((item) => item.url !== shareUrl),
          ].slice(0, 8),
        ),
      );
      renderHistory();
      root.querySelector("#result-expiry").textContent =
        `Available until ${new Date(transfer.expiresAt).toLocaleDateString()}`;
      progressWrap.hidden = true;
      transferResult.hidden = false;
      transferButton.hidden = true;
      showToast("Your private transfer is ready.");
    } catch (error) {
      progressWrap.hidden = true;
      transferButton.disabled = false;
      transferButton.classList.remove("loading");
      renderFiles();
      showToast(error.message || "Upload failed. Please try again.");
    }
  });

  copyLinkButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(copyLinkButton.dataset.url);
    copyLinkButton.textContent = "Copied";
    setTimeout(() => {
      copyLinkButton.textContent = "Copy link";
    }, 1800);
  });

  root
    .querySelector(".menu")
    ?.addEventListener("click", () =>
      root.querySelector("nav")?.classList.toggle("open"),
    );

  async function loadDownload() {
    const code = new URLSearchParams(window.location.search).get("t");
    if (!code) return;
    root.querySelector("main").hidden = true;
    const topbar = root.querySelector(".topbar");
    if (topbar) topbar.hidden = true;
    root.querySelector("footer").hidden = true;
    const screen = root.querySelector("#download-screen");
    screen.hidden = false;
    try {
      const response = await fetch(
        `/api/orpheus/transfers?code=${encodeURIComponent(code)}`,
      );
      const transfer = await response.json();
      if (!response.ok)
        throw new Error(transfer.error || "Transfer not found.");
      root.querySelector("#download-message").textContent =
        transfer.message ||
        `${transfer.senderEmail || "Someone"} sent you files securely through Atlas.`;
      root.querySelector("#download-expiry").textContent =
        `This transfer expires ${new Date(transfer.expiresAt).toLocaleString()}.`;
      const list = root.querySelector("#download-files");
      transfer.files.forEach((file) => {
        const row = document.createElement("a");
        row.className = "download-row";
        row.href = `/api/orpheus/download?code=${encodeURIComponent(code)}&file=${encodeURIComponent(file.id)}`;
        row.innerHTML = `<div class="file-type">${fileTypeLabel(file.name)}</div><div><strong></strong><span>${formatBytes(file.size)}</span></div><b>↓</b>`;
        row.querySelector("strong").textContent = file.name;
        list.appendChild(row);
      });
    } catch (error) {
      root.querySelector("#download-title").textContent =
        "This transfer is unavailable.";
      root.querySelector("#download-message").textContent = error.message;
    }
  }

  loadDownload();

  const range = root.querySelector("#gb-range");
  const gbValue = root.querySelector("#gb-value");
  const oneTimePrice = root.querySelector("#one-time-price");

  function oneTimeAmount(gb) {
    return Math.max(1.49, gb * 0.09);
  }

  function updateCalculator() {
    const gb = Number(range.value);
    gbValue.textContent = gb === 1024 ? "1 TB" : `${gb} GB`;
    oneTimePrice.textContent = `€${oneTimeAmount(gb).toFixed(2)}`;
  }

  range.addEventListener("input", updateCalculator);
  updateCalculator();

  async function startCheckout(payload) {
    const button = payload.plan
      ? root.querySelector(`[data-plan="${payload.plan}"]`)
      : root.querySelector("#buy-once");
    const original = button.textContent;
    const gb = Number(payload.gb || 0);
    const planLabels = {
      plus: {
        title: "Atlas Plus plan",
        amount: "€6.90/month",
        recurring: true,
      },
      pro: { title: "Atlas Pro plan", amount: "€14.90/month", recurring: true },
      studio: {
        title: "Atlas Studio plan",
        amount: "€39.90/month",
        recurring: true,
      },
      business: {
        title: "Atlas Business plan",
        amount: "€79.90/month",
        recurring: true,
      },
    };
    const details = payload.plan
      ? planLabels[payload.plan] || {
          title: `Atlas ${payload.plan} plan`,
          amount: "Paid plan",
          recurring: true,
        }
      : {
          title: `Atlas transfer · ${gb === 1024 ? "1 TB" : `${gb} GB`}`,
          amount: `€${oneTimeAmount(gb).toFixed(2)}`,
          recurring: false,
        };
    const confirmed = await new Promise((resolve) => {
      window.dispatchEvent(
        new CustomEvent("omnimind:confirm-transaction", {
          detail: {
            ...details,
            method: "stripe",
            description:
              "Omni is about to take you to Stripe for this Atlas purchase.",
            resolve,
          },
        }),
      );
    });
    if (!confirmed) return;
    button.disabled = true;
    button.textContent = "Opening secure checkout…";
    try {
      const response = await fetch("/api/orpheus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Checkout is unavailable.");
      window.location.href = result.url;
    } catch (error) {
      button.disabled = false;
      button.textContent = original;
      showToast(error.message);
    }
  }

  root.querySelectorAll("[data-plan]").forEach((button) => {
    if (button.dataset.plan !== "free")
      button.addEventListener("click", () =>
        startCheckout({ plan: button.dataset.plan }),
      );
  });
  root
    .querySelector("#buy-once")
    .addEventListener("click", () =>
      startCheckout({ gb: Number(range.value) }),
    );

  if (
    new URLSearchParams(window.location.search).get("billing") === "success"
  ) {
    showToast("Payment confirmed. Your transfer allowance is active.");
    history.replaceState({}, "", "/atlas#pricing");
  }
  if (new URLSearchParams(window.location.search).get("billing") === "failed") {
    showToast("Payment could not be confirmed. Please try again.");
    history.replaceState({}, "", "/atlas#pricing");
  }
}
