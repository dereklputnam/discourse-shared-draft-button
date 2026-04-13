import { apiInitializer } from "discourse/lib/api";
import { CREATE_SHARED_DRAFT, CREATE_TOPIC } from "discourse/models/composer";

export default apiInitializer("1.8.0", (api) => {
  const buttonText = settings.button_text || "New Shared Draft";

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

  function isInSharedDraftsCategory() {
    const sharedDraftsId = getSharedDraftsCategoryId();
    if (!sharedDraftsId) {
      return false;
    }
    return getCurrentCategoryId() === sharedDraftsId;
  }

  // Relabel the existing New Topic button when in the shared drafts category.
  // No cloning, no hiding — just change the text.
  let originalText = null;

  function updateButtonLabel() {
    const label = document.querySelector("#create-topic .d-button-label");
    if (!label) {
      return;
    }

    if (isInSharedDraftsCategory()) {
      if (!originalText) {
        originalText = label.textContent;
      }
      label.textContent = buttonText;
    } else if (originalText) {
      label.textContent = originalText;
      originalText = null;
    }
  }

  api.onPageChange(() => {
    // Small delay to let Discourse render the button after navigation
    setTimeout(updateButtonLabel, 150);
  });

  // When the composer opens from the shared drafts category, switch the
  // action to CREATE_SHARED_DRAFT. Discourse's reactivity handles the
  // rest — the save button text, the serializer, and the sharedDraft flag
  // all derive from the action property.
  const appEvents = api.container.lookup("service:app-events");
  appEvents.on("composer:open", (data) => {
    if (!data?.model) {
      return;
    }

    if (
      data.model.action === CREATE_TOPIC &&
      isInSharedDraftsCategory()
    ) {
      data.model.set("action", CREATE_SHARED_DRAFT);
    }
  });
});
