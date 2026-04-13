import { apiInitializer } from "discourse/lib/api";
import { CREATE_SHARED_DRAFT } from "discourse/models/composer";

export default apiInitializer("1.8.0", (api) => {
  // Shared drafts are a staff-only feature — don't run for other users.
  const currentUser = api.getCurrentUser();
  if (!currentUser?.staff) {
    return;
  }

  const buttonText = settings.button_text || "New Shared Draft";

  // Read the shared drafts category from Discourse's own site settings
  // rather than duplicating configuration in the theme component.
  function getSharedDraftsCategoryId() {
    return api.container.lookup("service:site").shared_drafts_category_id;
  }

  function getCurrentCategoryId() {
    const path = window.location.pathname;
    const match = path.match(/\/c\/(?:[^/]+\/)*(\d+)(?:\/|$)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    const el = document.querySelector("[data-category-id]");
    if (el) {
      return parseInt(el.getAttribute("data-category-id"), 10);
    }

    return null;
  }

  function shouldShowButton() {
    const sharedDraftsId = getSharedDraftsCategoryId();
    if (!sharedDraftsId) {
      return false;
    }

    const currentId = getCurrentCategoryId();
    return currentId === sharedDraftsId;
  }

  function openSharedDraftComposer() {
    const composer = api.container.lookup("service:composer");
    if (!composer) {
      return;
    }

    composer
      .open({
        action: CREATE_SHARED_DRAFT,
        draftKey: "shared_draft",
        categoryId: getCurrentCategoryId(),
      })
      .catch((err) =>
        console.error("Failed to open shared draft composer:", err)
      );
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
      return;
    }

    const original = document.querySelector("#create-topic");
    if (!original) {
      return;
    }

    original.style.display = "none";
    original.dataset.hiddenBySharedDraft = "true";

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

  let refreshTimer = null;

  function scheduleRefresh(delay) {
    if (refreshTimer) {
      return;
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      addSharedDraftButton();
    }, delay);
  }

  api.onPageChange(() => {
    removeSharedDraftButton();
    scheduleRefresh(150);
  });

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
          scheduleRefresh(50);
          return;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
