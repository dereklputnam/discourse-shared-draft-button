import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",

  initialize(container) {
    const settings = this.settings;

    withPluginApi("0.8.31", (api) => {
      // Get the target category from settings
      const TARGET_CATEGORY_ID = settings?.enabled_category?.toString();

      // Exit early if no category configured
      if (!TARGET_CATEGORY_ID) {
        return;
      }

      // Function to create shared draft
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();

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

          // Try to use the same approach as the standard shared draft workflow
          setTimeout(function() {
            // Method 1: Try using the createSharedDraft action directly
            try {
              if (composer.createSharedDraft) {
                composer.createSharedDraft();
                return;
              }
            } catch (e) {
              // Silent fail, try next method
            }

            // Method 2: Try opening with the shared draft action
            try {
              composer.open({
                action: 'createSharedDraft',
                draftKey: 'shared_draft_' + Date.now(),
                archetypeId: 'regular',
                categoryId: parseInt(TARGET_CATEGORY_ID)
              }).then(function() {
                // Also try to set the destination category on the model
                const model = composer.get('model');
                if (model) {
                  try {
                    model.set('categoryId', parseInt(TARGET_CATEGORY_ID));
                    model.set('destinationCategoryId', parseInt(TARGET_CATEGORY_ID));
                  } catch (e) {
                    // Silent fail
                  }
                }
              }).catch(function(error) {
                throw error;
              });
            } catch (e) {
              // Method 3: Fallback to regular topic creation and try to modify it
              composer.open({
                action: 'createTopic',
                draftKey: 'shared_draft_fallback_' + Date.now(),
                archetypeId: 'regular'
              }).then(function() {
                // Try different ways to set shared draft mode
                const model = composer.get('model');
                if (model) {
                  // Try multiple property names that might work
                  try { model.set('isSharedDraft', true); } catch (e) {}
                  try { model.set('shared_draft', true); } catch (e) {}
                  try { model.set('sharedDraft', true); } catch (e) {}

                  // Try to trigger shared draft UI
                  try {
                    if (model.toggleProperty) {
                      model.toggleProperty('sharedDraft');
                      model.toggleProperty('sharedDraft'); // Toggle twice to end up true
                    }
                  } catch (e) {}
                }
              }).catch(function() {
                // Silent fail
              });
            }
          }, 100);

        } catch (error) {
          // Silent fail
        }
      }

      // Function to check if we should override the button
      function shouldOverrideButton() {
        // Check if URL contains the target category ID
        const urlHasCategory = window.location.pathname.includes('/' + TARGET_CATEGORY_ID);

        // Also check for category element in DOM
        const categoryElement = document.querySelector('[data-category-id="' + TARGET_CATEGORY_ID + '"]');

        return urlHasCategory || !!categoryElement;
      }

      // Function to check if user is staff
      function isUserStaff() {
        const currentUser = api.getCurrentUser();
        return currentUser && currentUser.staff;
      }

      // Main function to override the New Topic button
      function overrideNewTopicButton() {
        // Only override for staff members
        if (!isUserStaff()) {
          return;
        }

        // Only override in target category
        if (!shouldOverrideButton()) {
          return;
        }

        // Find the create topic button
        const createTopicButton = document.querySelector('#create-topic');

        if (!createTopicButton) {
          return false;
        }

        // Check if we've already overridden this button
        if (createTopicButton.dataset.sharedDraftOverridden) {
          return true;
        }

        try {
          // Change the button text
          const buttonLabel = createTopicButton.querySelector('.d-button-label');
          if (buttonLabel) {
            buttonLabel.textContent = 'New Shared Draft';
          }

          // Change the icon to users icon
          const buttonIcon = createTopicButton.querySelector('use');
          if (buttonIcon) {
            buttonIcon.setAttribute('href', '#users');
          }

          // Update the title
          createTopicButton.title = 'Create a new shared draft for staff collaboration';

          // Add our click handler (use capture to override existing handlers)
          createTopicButton.addEventListener('click', createSharedDraft, true);

          // Mark as overridden
          createTopicButton.dataset.sharedDraftOverridden = 'true';

          return true;

        } catch (error) {
          return false;
        }
      }

      // Try to override button with multiple attempts
      function initializeSharedDraftButton() {
        // Try immediately
        if (overrideNewTopicButton()) {
          return;
        }

        // Try after 1 second
        setTimeout(function() {
          if (overrideNewTopicButton()) {
            return;
          }

          // Try after 3 seconds
          setTimeout(function() {
            overrideNewTopicButton();
          }, 3000);
        }, 1000);
      }

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
          }
        });

        if (shouldCheck) {
          setTimeout(overrideNewTopicButton, 100);
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
