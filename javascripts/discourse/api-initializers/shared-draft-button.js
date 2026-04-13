import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  const enabledCategoryIds = settings.enabled_categories
    .split("|")
    .map((id) => parseInt(id, 10))
    .filter((id) => id);

  const buttonText = settings.button_text || "New Shared Draft";

  // Get the current category ID from the URL.
  // Discourse category URLs look like /c/slug/ID or /c/parent/child/ID —
  // the ID is always the last numeric segment before an optional suffix.
  function getCurrentCategoryId() {
    const path = window.location.pathname;
    const match = path.match(/\/c\/(?:[^/]+\/)*(\d+)(?:\/|$)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Fallback: data attribute set by Discourse on category pages
    const el = document.querySelector("[data-category-id]");
    if (el) {
      return parseInt(el.getAttribute("data-category-id"), 10);
    }

    return null;
  }

  function shouldShowButton() {
    if (enabledCategoryIds.length === 0) {
      return false;
    }

    if (settings.require_shared_drafts_enabled) {
      const siteSettings = api.container.lookup("service:site-settings");
      if (!siteSettings?.shared_drafts_enabled) {
        return false;
      }
    }

    const currentId = getCurrentCategoryId();
    return currentId !== null && enabledCategoryIds.includes(currentId);
  }

  function openSharedDraftComposer() {
    const composer = api.container.lookup("service:composer");
    if (!composer) {
      return;
    }

    composer
      .open({
        action: "createSharedDraft",
        draftKey: "new_topic",
        categoryId: getCurrentCategoryId(),
      })
      .catch(() => {});
  }

  function removeSharedDraftButton() {
    document.querySelector("#create-shared-draft-button")?.remove();

    const original = document.querySelector("#create-topic");
    if (original?.dataset.hiddenBySharedDraft === "true") {
      original.style.display = "";
      delete original.dataset.hiddenBySharedDraft;
    }
  }

  function addSharedDraftButton() {
    const shouldShow = shouldShowButton();
    const existing = document.querySelector("#create-shared-draft-button");

    if (!shouldShow) {
      if (existing) {
        removeSharedDraftButton();
      }
      return;
    }

    if (existing) {
      return; // already injected
    }

    const original = document.querySelector("#create-topic");
    if (!original) {
      return;
    }

    // Hide the original button
    original.style.display = "none";
    original.dataset.hiddenBySharedDraft = "true";

    // Clone it so we inherit all styling/classes
    const button = original.cloneNode(true);
    button.id = "create-shared-draft-button";
    button.style.display = "";
    delete button.dataset.hiddenBySharedDraft;
    button.title = buttonText;

    const label = button.querySelector(".d-button-label");
    if (label) {
      label.textContent = buttonText;
    }

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSharedDraftComposer();
    });

    original.parentNode.insertBefore(button, original.nextSibling);
  }

  function refresh() {
    removeSharedDraftButton();
    // Small delay to let Discourse render the #create-topic button first
    setTimeout(addSharedDraftButton, 150);
  }

  api.onPageChange(refresh);

  // Watch for the #create-topic button being injected dynamically
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        if (
          node.id === "create-topic" ||
          node.querySelector?.("#create-topic")
        ) {
          setTimeout(addSharedDraftButton, 50);
          return;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
