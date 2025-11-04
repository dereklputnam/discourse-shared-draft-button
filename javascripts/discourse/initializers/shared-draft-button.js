import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",

  initialize(container) {
    const settings = this.settings;

    withPluginApi("0.8.31", (api) => {
      // Get the target category from settings, with fallback to hardcoded value
      const TARGET_CATEGORY_ID = settings?.enabled_category?.toString() || '167';

      console.log('Shared Draft Button: Initializing for category ' + TARGET_CATEGORY_ID);

      // Function to create shared draft
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();

        console.log('Shared Draft Button: Creating shared draft...');

        // Check if Discourse is available
        if (typeof Discourse === 'undefined') {
          alert('Error: Discourse not available. Please refresh the page and try again.');
          return;
        }

        // Get site settings to check shared drafts configuration
        const siteSettings = Discourse.SiteSettings;

        console.log('Shared Draft Button: Site settings available:', !!siteSettings);
        if (siteSettings) {
          console.log('Shared Draft Button: Shared drafts category setting:', siteSettings.shared_drafts_category);
        }

        // Skip the shared drafts check for now since standard route works
        // We'll let Discourse handle the validation
        console.log('Shared Draft Button: Proceeding with shared draft creation...');

        try {
          // Try multiple ways to access the composer
          let composer = null;

          // Method 1: Try the application controller
          try {
            const appController = Discourse.__container__.lookup('controller:application');
            composer = appController.get('composer');
            console.log('Shared Draft Button: Got composer via application controller:', !!composer);
          } catch (e) {
            console.log('Shared Draft Button: Application controller method failed:', e.message);
          }

          // Method 2: Try direct service lookup
          if (!composer) {
            try {
              composer = Discourse.__container__.lookup('service:composer');
              console.log('Shared Draft Button: Got composer via service lookup:', !!composer);
            } catch (e) {
              console.log('Shared Draft Button: Service lookup method failed:', e.message);
            }
          }

          // Method 3: Try controller lookup
          if (!composer) {
            try {
              composer = Discourse.__container__.lookup('controller:composer');
              console.log('Shared Draft Button: Got composer via controller lookup:', !!composer);
            } catch (e) {
              console.log('Shared Draft Button: Controller lookup method failed:', e.message);
            }
          }

          if (!composer) {
            alert('Error: Could not access composer. Please refresh the page and try again.');
            console.error('Shared Draft Button: All composer access methods failed');
            return;
          }

          // Close existing composer if open
          if (composer.get('model')) {
            composer.close();
          }

          // Try to use the same approach as the standard shared draft workflow
          setTimeout(function() {
            console.log('Shared Draft Button: Attempting to create shared draft...');

            // Method 1: Try using the createSharedDraft action directly
            try {
              if (composer.createSharedDraft) {
                console.log('Shared Draft Button: Using createSharedDraft method');
                composer.createSharedDraft();
                return;
              }
            } catch (e) {
              console.log('Shared Draft Button: createSharedDraft method not available:', e.message);
            }

            // Method 2: Try opening with the shared draft action
            try {
              console.log('Shared Draft Button: Trying createSharedDraft action');
              composer.open({
                action: 'createSharedDraft',
                draftKey: 'shared_draft_' + Date.now(),
                archetypeId: 'regular',
                categoryId: parseInt(TARGET_CATEGORY_ID) // Set to the same category
              }).then(function() {
                console.log('Shared Draft Button: Shared draft composer opened successfully');

                // Also try to set the destination category on the model
                const model = composer.get('model');
                if (model) {
                  try {
                    model.set('categoryId', parseInt(TARGET_CATEGORY_ID));
                    model.set('destinationCategoryId', parseInt(TARGET_CATEGORY_ID));
                    console.log('Shared Draft Button: Set category to', TARGET_CATEGORY_ID);
                  } catch (e) {
                    console.log('Shared Draft Button: Could not set category:', e.message);
                  }
                }
              }).catch(function(error) {
                console.log('Shared Draft Button: createSharedDraft action failed:', error.message);
                throw error;
              });
            } catch (e) {
              console.log('Shared Draft Button: createSharedDraft action not available:', e.message);

              // Method 3: Fallback to regular topic creation and try to modify it
              console.log('Shared Draft Button: Trying fallback approach...');
              composer.open({
                action: 'createTopic',
                draftKey: 'shared_draft_fallback_' + Date.now(),
                archetypeId: 'regular'
              }).then(function() {
                console.log('Shared Draft Button: Regular composer opened, attempting to convert to shared draft');

                // Try different ways to set shared draft mode
                const model = composer.get('model');
                if (model) {
                  console.log('Shared Draft Button: Got model, trying to set shared draft properties');

                  // Try multiple property names that might work
                  try {
                    model.set('isSharedDraft', true);
                    console.log('Shared Draft Button: Set isSharedDraft property');
                  } catch (e) {
                    console.log('Shared Draft Button: isSharedDraft property failed:', e.message);
                  }

                  try {
                    model.set('shared_draft', true);
                    console.log('Shared Draft Button: Set shared_draft property');
                  } catch (e) {
                    console.log('Shared Draft Button: shared_draft property failed:', e.message);
                  }

                  try {
                    model.set('sharedDraft', true);
                    console.log('Shared Draft Button: Set sharedDraft property');
                  } catch (e) {
                    console.log('Shared Draft Button: sharedDraft property failed:', e.message);
                  }

                  // Try to trigger shared draft UI
                  try {
                    if (model.toggleProperty) {
                      model.toggleProperty('sharedDraft');
                      model.toggleProperty('sharedDraft'); // Toggle twice to end up true
                      console.log('Shared Draft Button: Used toggleProperty method');
                    }
                  } catch (e) {
                    console.log('Shared Draft Button: toggleProperty method failed:', e.message);
                  }
                }
              }).catch(function(error) {
                console.error('Shared Draft Button: All methods failed:', error);
                alert('Error: Could not create shared draft. Please use the standard method.');
              });
            }
          }, 100);

        } catch (error) {
          console.error('Shared Draft Button: Error accessing Discourse components:', error);
          alert('Error: Could not access Discourse components. Please refresh the page and try again.');
        }
      }

      // Function to check if we should override the button
      function shouldOverrideButton() {
        // Check if URL contains the target category ID
        const urlHasCategory = window.location.pathname.includes('/' + TARGET_CATEGORY_ID);

        // Also check for category element in DOM
        const categoryElement = document.querySelector('[data-category-id="' + TARGET_CATEGORY_ID + '"]');

        const shouldOverride = urlHasCategory || !!categoryElement;

        console.log('Shared Draft Button: Should override?', shouldOverride,
                    '(URL has category:', urlHasCategory, ', Element found:', !!categoryElement, ')');

        return shouldOverride;
      }

      // Function to check if user is staff
      function isUserStaff() {
        if (typeof Discourse === 'undefined') {
          return false;
        }

        const currentUser = Discourse.User.current();
        const isStaff = currentUser && currentUser.staff;

        console.log('Shared Draft Button: User is staff:', isStaff);
        return isStaff;
      }

      // Main function to override the New Topic button
      function overrideNewTopicButton() {
        console.log('Shared Draft Button: Checking if button should be overridden...');

        // Only override for staff members
        if (!isUserStaff()) {
          console.log('Shared Draft Button: User is not staff, skipping override');
          return;
        }

        // Only override in target category
        if (!shouldOverrideButton()) {
          console.log('Shared Draft Button: Not in target category, skipping override');
          return;
        }

        // Find the create topic button
        const createTopicButton = document.querySelector('#create-topic');

        if (!createTopicButton) {
          console.log('Shared Draft Button: Create topic button not found');
          return false;
        }

        // Check if we've already overridden this button
        if (createTopicButton.dataset.sharedDraftOverridden) {
          console.log('Shared Draft Button: Button already overridden');
          return true;
        }

        console.log('Shared Draft Button: Overriding New Topic button...');

        try {
          // Change the button text
          const buttonLabel = createTopicButton.querySelector('.d-button-label');
          if (buttonLabel) {
            buttonLabel.textContent = 'New Shared Draft';
            console.log('Shared Draft Button: Button text changed to "New Shared Draft"');
          }

          // Change the icon to users icon
          const buttonIcon = createTopicButton.querySelector('use');
          if (buttonIcon) {
            buttonIcon.setAttribute('href', '#users');
            console.log('Shared Draft Button: Button icon changed to users');
          }

          // Update the title
          createTopicButton.title = 'Create a new shared draft for staff collaboration';

          // Add our click handler (use capture to override existing handlers)
          createTopicButton.addEventListener('click', createSharedDraft, true);

          // Mark as overridden
          createTopicButton.dataset.sharedDraftOverridden = 'true';

          console.log('Shared Draft Button: Button successfully overridden!');
          return true;

        } catch (error) {
          console.error('Shared Draft Button: Error overriding button:', error);
          return false;
        }
      }

      // Try to override button with multiple attempts
      function initializeSharedDraftButton() {
        console.log('Shared Draft Button: Starting initialization...');

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
          console.log('Shared Draft Button: DOM changed, checking for button...');
          setTimeout(overrideNewTopicButton, 100);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Start the initialization
      initializeSharedDraftButton();

      console.log('Shared Draft Button: Setup complete');
    });
  }
};
