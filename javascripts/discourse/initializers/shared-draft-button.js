import { withPluginApi } from "discourse/lib/plugin-api";


export default {
  name: "shared-draft-button",

  initialize(container, settings) {
    // CRITICAL: Capture this.settings before entering withPluginApi
    const themeSettings = this.settings || {};

    // Log raw settings for debugging
    console.log('[Shared Draft Button] Raw this.settings:', themeSettings);
    console.log('[Shared Draft Button] enabled_category value:', themeSettings.enabled_category);
    console.log('[Shared Draft Button] enabled_category type:', typeof themeSettings.enabled_category);
    console.log('[Shared Draft Button] enabled_category length:', themeSettings.enabled_category?.length);

    // Try iterating over properties in case they're enumerable
    console.log('[Shared Draft Button] Iterating over settings:');
    for (const key in themeSettings) {
      console.log(`  ${key}:`, themeSettings[key]);
    }

    withPluginApi("0.8.31", (api) => {
      // TEMPORARY HARDCODED FALLBACK
      // TODO: Figure out why theme settings aren't loading from Discourse admin
      const FALLBACK_CATEGORY = "170"; // Change this to your category ID

      const componentSettings = {
        button_text: themeSettings.button_text || "New Shared Draft",
        enabled_category: themeSettings.enabled_category || FALLBACK_CATEGORY,
        require_shared_drafts_enabled: themeSettings.require_shared_drafts_enabled !== undefined ? themeSettings.require_shared_drafts_enabled : true
      };

      console.log('[Shared Draft Button] Component settings:', componentSettings);
      console.log('[Shared Draft Button] Using hardcoded fallback:', !themeSettings.enabled_category);
      console.log('[Shared Draft Button] Final enabled_category:', componentSettings.enabled_category);

      // Function to detect the current category from the URL and page context
      function getCurrentCategoryId() {
        console.log('[Shared Draft Button] Detecting category from URL:', window.location.pathname);

        // Method 1: Extract from URL path
        // Match patterns like: /c/category-name/123, /c/123, /category-slug/170, etc.
        const pathMatch = window.location.pathname.match(/\/(\d+)(?:\/|$)/);
        if (pathMatch) {
          console.log('[Shared Draft Button] Found category in path:', pathMatch[1]);
          return pathMatch[1];
        }

        // Method 2: Check URL hash
        const hashMatch = window.location.hash.match(/\/(\d+)(?:\/|$)/);
        if (hashMatch) {
          console.log('[Shared Draft Button] Found category in hash:', hashMatch[1]);
          return hashMatch[1];
        }

        // Method 3: Check query params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('category')) {
          console.log('[Shared Draft Button] Found category in query:', urlParams.get('category'));
          return urlParams.get('category');
        }

        // Method 4: Check DOM for category data attributes
        const categoryElement = document.querySelector('[data-category-id]');
        if (categoryElement) {
          console.log('[Shared Draft Button] Found category in DOM:', categoryElement.getAttribute('data-category-id'));
          return categoryElement.getAttribute('data-category-id');
        }

        // Method 5: Check body class names (e.g., category-170)
        const bodyClassMatch = document.body.className.match(/category-(\d+)/);
        if (bodyClassMatch) {
          console.log('[Shared Draft Button] Found category in body class:', bodyClassMatch[1]);
          return bodyClassMatch[1];
        }

        // Method 6: Check meta tags
        const categoryMeta = document.querySelector('meta[name="discourse-category-id"]');
        if (categoryMeta && categoryMeta.content) {
          console.log('[Shared Draft Button] Found category in meta:', categoryMeta.content);
          return categoryMeta.content;
        }

        console.log('[Shared Draft Button] No category detected');
        return null;
      }

      // Function to check if we should override the button
      function shouldOverrideButton() {
        // If no category is configured in settings, don't show button anywhere
        if (!componentSettings.enabled_category || componentSettings.enabled_category === "") {
          console.log('[Shared Draft Button] No enabled_category configured');
          return false;
        }

        // Get the current category from the page
        const currentCategoryId = getCurrentCategoryId();
        console.log('[Shared Draft Button] Current category:', currentCategoryId, 'Target:', componentSettings.enabled_category);

        // If no current category detected, don't show button
        if (!currentCategoryId) {
          return false;
        }

        // Check if current category matches the configured category
        const targetCategoryId = componentSettings.enabled_category.toString();
        const matches = currentCategoryId === targetCategoryId;
        console.log('[Shared Draft Button] Category match:', matches);
        return matches;
      }

      // Function to create shared draft
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();

        // Double-check we're in the right category before proceeding
        if (!shouldOverrideButton()) {
          removeSharedDraftButton();
          return;
        }

        // Check if Discourse is available
        if (typeof Discourse === 'undefined') {
          return;
        }
        
        try {
          // Try multiple ways to access the composer
          let composer = null;

          // Method 1: Try the application controller
          try {
            const appController = Discourse.__container__.lookup('controller:application');
            composer = appController.get('composer');
          } catch (e) {
            // Silent fail, try next method
          }

          // Method 2: Try direct service lookup
          if (!composer) {
            try {
              composer = Discourse.__container__.lookup('service:composer');
            } catch (e) {
              // Silent fail, try next method
            }
          }

          // Method 3: Try controller lookup
          if (!composer) {
            try {
              composer = Discourse.__container__.lookup('controller:composer');
            } catch (e) {
              // Silent fail
            }
          }

          if (!composer) {
            return;
          }
          
          // Close existing composer if open
          if (composer.get('model')) {
            composer.close();
          }
          
          // Open composer with shared draft action
          setTimeout(function() {
            // Method 1: Try using the createSharedDraft action directly
            try {
              if (composer.createSharedDraft) {
                composer.createSharedDraft();
                return;
              }
            } catch (e) {
              // Try next method
            }

            // Method 2: Try opening with the shared draft action
            try {
              const currentCategoryId = getCurrentCategoryId();

              composer.open({
                action: 'createSharedDraft',
                draftKey: 'shared_draft_' + Date.now(),
                archetypeId: 'regular',
                categoryId: parseInt(currentCategoryId, 10)
              }).catch(function() {
                // Silent fail - user will see error in Discourse UI if needed
              });
            } catch (e) {
              // Method 3: Fallback to regular topic creation
              const currentCategoryId = getCurrentCategoryId();

              composer.open({
                action: 'createTopic',
                draftKey: 'shared_draft_fallback_' + Date.now(),
                archetypeId: 'regular',
                categoryId: parseInt(currentCategoryId, 10)
              }).then(function() {
                // Try to set shared draft properties
                const model = composer.get('model');
                if (model) {
                  try { model.set('isSharedDraft', true); } catch (e) {}
                  try { model.set('shared_draft', true); } catch (e) {}
                  try { model.set('sharedDraft', true); } catch (e) {}
                }
              }).catch(function() {
                // Silent fail
              });
            }
          }, 100);
          
        } catch (error) {
          console.error('Shared Draft Button: Error accessing Discourse components:', error);
        }
      }

      // Function to remove the shared draft button and show the original
      function removeSharedDraftButton() {
        // Find and remove our custom button
        const sharedDraftButton = document.querySelector('#create-shared-draft-button');
        if (sharedDraftButton) {
          sharedDraftButton.remove();
        }

        // Show the original New Topic button
        const createTopicButton = document.querySelector('#create-topic');
        if (createTopicButton && createTopicButton.dataset.hiddenBySharedDraft === 'true') {
          createTopicButton.style.display = '';
          delete createTopicButton.dataset.hiddenBySharedDraft;
        }
      }

      // Main function to add the shared draft button
      function addSharedDraftButton() {
        console.log('[Shared Draft Button] addSharedDraftButton called');

        // Check if we should show the shared draft button in this category
        const shouldShow = shouldOverrideButton();

        // Check if our custom button already exists
        const existingSharedDraftButton = document.querySelector('#create-shared-draft-button');

        // If we shouldn't show but button exists, remove it and show original
        if (!shouldShow && existingSharedDraftButton) {
          console.log('[Shared Draft Button] Removing button (not in target category)');
          removeSharedDraftButton();
          return false;
        }

        // If we shouldn't show and button doesn't exist, nothing to do
        if (!shouldShow) {
          // Make sure original button is visible if it was hidden
          const createTopicButton = document.querySelector('#create-topic');
          if (createTopicButton && createTopicButton.dataset.hiddenBySharedDraft === 'true') {
            createTopicButton.style.display = '';
            delete createTopicButton.dataset.hiddenBySharedDraft;
          }
          return false;
        }

        // If we should show and button already exists, nothing to do
        if (existingSharedDraftButton) {
          console.log('[Shared Draft Button] Custom button already exists');
          return true;
        }

        // Find the original create topic button
        const createTopicButton = document.querySelector('#create-topic');
        if (!createTopicButton) {
          console.log('[Shared Draft Button] Original button not found');
          return false;
        }

        console.log('[Shared Draft Button] Adding custom button...');

        try {
          // Hide the original New Topic button
          createTopicButton.style.display = 'none';
          createTopicButton.dataset.hiddenBySharedDraft = 'true';

          // Create our custom shared draft button by cloning the original
          const sharedDraftButton = createTopicButton.cloneNode(true);
          sharedDraftButton.id = 'create-shared-draft-button';
          sharedDraftButton.style.display = ''; // Make sure it's visible
          delete sharedDraftButton.dataset.hiddenBySharedDraft;

          // Update the button text
          const buttonLabel = sharedDraftButton.querySelector('.d-button-label');
          if (buttonLabel) {
            buttonLabel.textContent = componentSettings.button_text;
          }

          // Update the title
          sharedDraftButton.title = 'Create a new shared draft for staff collaboration';

          // Add our click handler
          sharedDraftButton.addEventListener('click', createSharedDraft, true);

          // Insert the button after the original (hidden) button
          createTopicButton.parentNode.insertBefore(sharedDraftButton, createTopicButton.nextSibling);

          console.log('[Shared Draft Button] Custom button added successfully');
          return true;

        } catch (error) {
          console.error('[Shared Draft Button] Error adding button:', error);
          return false;
        }
      }

      // Try to add button with multiple attempts
      function initializeSharedDraftButton() {
        // Try immediately
        if (addSharedDraftButton()) {
          return;
        }

        // Try after 1 second
        setTimeout(function() {
          if (addSharedDraftButton()) {
            return;
          }

          // Try after 3 seconds
          setTimeout(function() {
            addSharedDraftButton();
          }, 3000);
        }, 1000);
      }

      // Listen for route changes in Discourse's SPA navigation
      api.onPageChange(() => {
        // First remove the existing button immediately if it exists
        // This prevents the button from persisting when navigating away
        const existingButton = document.querySelector('#create-shared-draft-button');
        if (existingButton) {
          removeSharedDraftButton();
        }

        // Try multiple times with increasing delays to catch the button after route change
        setTimeout(function() {
          addSharedDraftButton();
        }, 100);

        setTimeout(function() {
          addSharedDraftButton();
        }, 300);

        setTimeout(function() {
          addSharedDraftButton();
        }, 600);
      });

      // Watch for DOM changes to handle dynamic content
      const observer = new MutationObserver(function(mutations) {
        let shouldCheck = false;

        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                if (node.id === 'create-topic' || (node.querySelector && node.querySelector('#create-topic'))) {
                  shouldCheck = true;
                }
              }
            });
            // Also check if our custom button was removed
            mutation.removedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                if (node.id === 'create-shared-draft-button') {
                  shouldCheck = true;
                }
              }
            });
          }
        });

        if (shouldCheck) {
          setTimeout(function() {
            addSharedDraftButton();
          }, 100);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Start the initialization
      initializeSharedDraftButton();
    });
  }
};