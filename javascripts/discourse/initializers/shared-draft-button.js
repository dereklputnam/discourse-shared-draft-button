import { withPluginApi } from "discourse/lib/plugin-api";


export default {
  name: "shared-draft-button",

  initialize(container, settings) {
    withPluginApi("0.8.31", (api) => {
      console.log("Shared Draft Button: Initializing...");

      // Log helpful link to shared drafts settings
      const baseUrl = window.location.origin;
      const sharedDraftsSettingsUrl = baseUrl + '/admin/site_settings/category/all_results?filter=shared_drafts';
      console.log("Shared Draft Button: Configure shared drafts at:", sharedDraftsSettingsUrl);

      // Default settings with values from the settings parameter
      const componentSettings = {
        button_text: (settings && settings.button_text) || "New Shared Draft",
        enabled_category: (settings && settings.enabled_category) || "",
        require_shared_drafts_enabled: (settings && settings.require_shared_drafts_enabled !== undefined) ? settings.require_shared_drafts_enabled : true
      };

      console.log("Shared Draft Button: Settings:", componentSettings);

      // Function to detect the current category from the URL and page context
      function getCurrentCategoryId() {
        console.log('Shared Draft Button: Detecting current category...');
        console.log('Shared Draft Button: Current URL:', window.location.pathname);
        console.log('Shared Draft Button: Full URL:', window.location.href);

        // Method 1: Extract from URL path (most reliable)
        // Matches patterns like /c/category-name/123 or /c/123
        const pathMatch = window.location.pathname.match(/\/c\/[^\/]+\/(\d+)|\/c\/(\d+)/);
        if (pathMatch) {
          const categoryId = pathMatch[1] || pathMatch[2];
          console.log('Shared Draft Button: Found category ID in URL path:', categoryId);
          return categoryId;
        }

        // Method 2: Check URL hash
        const hashMatch = window.location.hash.match(/\/(\d+)(?:\/|$)/);
        if (hashMatch) {
          const categoryId = hashMatch[1];
          console.log('Shared Draft Button: Found category ID in URL hash:', categoryId);
          return categoryId;
        }

        // Method 3: Check query params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('category')) {
          const categoryId = urlParams.get('category');
          console.log('Shared Draft Button: Found category ID in query param:', categoryId);
          return categoryId;
        }

        // Method 4: Check DOM for category data attributes
        const categoryElement = document.querySelector('[data-category-id]');
        if (categoryElement) {
          const categoryId = categoryElement.getAttribute('data-category-id');
          console.log('Shared Draft Button: Found category ID in DOM data attribute:', categoryId);
          return categoryId;
        }

        // Method 5: Check body class names (e.g., category-167)
        const bodyClassMatch = document.body.className.match(/category-(\d+)/);
        if (bodyClassMatch) {
          const categoryId = bodyClassMatch[1];
          console.log('Shared Draft Button: Found category ID in body class:', categoryId);
          return categoryId;
        }

        // Method 6: Check meta tags
        const categoryMeta = document.querySelector('meta[name="discourse-category-id"]');
        if (categoryMeta && categoryMeta.content) {
          const categoryId = categoryMeta.content;
          console.log('Shared Draft Button: Found category ID in meta tag:', categoryId);
          return categoryId;
        }

        console.log('Shared Draft Button: No category ID detected');
        return null;
      }

      // Function to check if we should override the button
      function shouldOverrideButton() {
        console.log('Shared Draft Button: shouldOverrideButton - enabled_category setting:', JSON.stringify(componentSettings.enabled_category));

        // If no category is configured in settings, don't show button anywhere
        if (!componentSettings.enabled_category || componentSettings.enabled_category === "") {
          console.log('Shared Draft Button: No enabled_category configured in settings - button will not appear');
          return false;
        }

        // Get the current category from the page
        const currentCategoryId = getCurrentCategoryId();
        console.log('Shared Draft Button: Current category ID detected:', currentCategoryId);

        // If no current category detected, don't show button
        if (!currentCategoryId) {
          console.log('Shared Draft Button: No current category detected - returning false');
          return false;
        }

        // Check if current category matches the configured category
        const targetCategoryId = componentSettings.enabled_category.toString();
        const shouldShow = currentCategoryId === targetCategoryId;
        console.log('Shared Draft Button: Setting restricts to category', targetCategoryId, '- current is', currentCategoryId, '- showing:', shouldShow);
        return shouldShow;
      }

      // Function to create shared draft - exact copy of your working approach
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();

        console.log('Shared Draft Button: Creating shared draft...');

        // CRITICAL: Double-check we're in the right category before proceeding
        if (!shouldOverrideButton()) {
          console.error('Shared Draft Button: Not in target category, aborting shared draft creation');
          console.error('Shared Draft Button: This button should not be visible here. Removing it.');
          removeSharedDraftButton();
          return;
        }

        // Check if Discourse is available
        if (typeof Discourse === 'undefined') {
          console.error('Shared Draft Button: Discourse not available');
          return;
        }
        
        // Get site settings to check shared drafts configuration
        const siteSettings = Discourse.SiteSettings;
        console.log('Shared Draft Button: Site settings available:', !!siteSettings);
        if (siteSettings) {
          console.log('Shared Draft Button: Shared drafts category setting:', siteSettings.shared_drafts_category);
        }
        
        try {
          // Try multiple ways to access the composer - exactly like your script
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
            
            // Method 2: Try opening with the shared draft action - EXACT copy from your script
            try {
              console.log('Shared Draft Button: Trying createSharedDraft action');

              // Get the current category ID dynamically
              const currentCategoryId = getCurrentCategoryId();
              console.log('Shared Draft Button: Setting default category to:', currentCategoryId);
              
              composer.open({
                action: 'createSharedDraft',
                draftKey: 'shared_draft_' + Date.now(),
                archetypeId: 'regular',
                categoryId: parseInt(currentCategoryId, 10)
              }).then(function() {
                console.log('Shared Draft Button: Shared draft composer opened successfully');
              }).catch(function(error) {
                console.log('Shared Draft Button: createSharedDraft action failed:', error && error.message ? error.message : error);
                // Don't re-throw the error to prevent console spam
                console.log('Shared Draft Button: Falling back to regular topic creation...');
              });
            } catch (e) {
              console.log('Shared Draft Button: createSharedDraft action not available:', e.message);
              
              // Method 3: Fallback to regular topic creation and try to modify it
              console.log('Shared Draft Button: Trying fallback approach...');

              const currentCategoryId = getCurrentCategoryId();
              console.log('Shared Draft Button: Fallback - Setting default category to:', currentCategoryId);
              
              composer.open({
                action: 'createTopic',
                draftKey: 'shared_draft_fallback_' + Date.now(),
                archetypeId: 'regular',
                categoryId: parseInt(currentCategoryId, 10)
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
                console.log('Shared Draft Button: Fallback method failed:', error && error.message ? error.message : error);
              });
            }
          }, 100);
          
        } catch (error) {
          console.error('Shared Draft Button: Error accessing Discourse components:', error);
        }
      }

      // Function to remove the shared draft button and show the original
      function removeSharedDraftButton() {
        console.log('Shared Draft Button: Attempting to remove shared draft button...');

        // Find and remove our custom button
        const sharedDraftButton = document.querySelector('#create-shared-draft-button');
        if (sharedDraftButton) {
          sharedDraftButton.remove();
          console.log('Shared Draft Button: Removed custom shared draft button');
        }

        // Show the original New Topic button
        const createTopicButton = document.querySelector('#create-topic');
        if (createTopicButton && createTopicButton.dataset.hiddenBySharedDraft === 'true') {
          createTopicButton.style.display = '';
          delete createTopicButton.dataset.hiddenBySharedDraft;
          console.log('Shared Draft Button: Restored original New Topic button visibility');
        }
      }

      // Main function to add the shared draft button
      function addSharedDraftButton() {
        console.log('Shared Draft Button: Checking if button should be added...');
        console.log('Shared Draft Button: DEBUG - Current settings object:', settings);

        // Check if we should show the shared draft button in this category
        const shouldShow = shouldOverrideButton();

        // Check if our custom button already exists
        const existingSharedDraftButton = document.querySelector('#create-shared-draft-button');

        // If we shouldn't show but button exists, remove it and show original
        if (!shouldShow && existingSharedDraftButton) {
          console.log('Shared Draft Button: Not in target category, removing custom button');
          removeSharedDraftButton();
          return false;
        }

        // If we shouldn't show and button doesn't exist, nothing to do
        if (!shouldShow) {
          console.log('Shared Draft Button: Not in target category, skipping');
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
          console.log('Shared Draft Button: Custom button already exists');
          return true;
        }

        // Find the original create topic button
        const createTopicButton = document.querySelector('#create-topic');
        if (!createTopicButton) {
          console.log('Shared Draft Button: Original create topic button not found');
          return false;
        }

        console.log('Shared Draft Button: Adding custom shared draft button...');

        try {
          // Hide the original New Topic button
          createTopicButton.style.display = 'none';
          createTopicButton.dataset.hiddenBySharedDraft = 'true';
          console.log('Shared Draft Button: Hid original New Topic button');

          // Create our custom shared draft button by cloning the original
          const sharedDraftButton = createTopicButton.cloneNode(true);
          sharedDraftButton.id = 'create-shared-draft-button';
          sharedDraftButton.style.display = ''; // Make sure it's visible
          delete sharedDraftButton.dataset.hiddenBySharedDraft;

          // Update the button text
          const buttonLabel = sharedDraftButton.querySelector('.d-button-label');
          if (buttonLabel) {
            buttonLabel.textContent = componentSettings.button_text;
            console.log('Shared Draft Button: Set button text to "' + componentSettings.button_text + '"');
          }

          // Update the title
          sharedDraftButton.title = 'Create a new shared draft for staff collaboration';

          // Add our click handler
          sharedDraftButton.addEventListener('click', createSharedDraft, true);

          // Insert the button after the original (hidden) button
          createTopicButton.parentNode.insertBefore(sharedDraftButton, createTopicButton.nextSibling);

          console.log('Shared Draft Button: Custom button successfully added!');
          return true;

        } catch (error) {
          console.error('Shared Draft Button: Error adding custom button:', error);
          return false;
        }
      }

      // Try to add button with multiple attempts
      function initializeSharedDraftButton() {
        console.log('Shared Draft Button: Starting initialization...');

        // Try immediately
        const result1 = addSharedDraftButton();
        console.log('Shared Draft Button: First attempt result:', result1);
        if (result1) {
          console.log('Shared Draft Button: First attempt succeeded, stopping');
          return;
        }

        // Try after 1 second
        setTimeout(function() {
          const result2 = addSharedDraftButton();
          console.log('Shared Draft Button: Second attempt result:', result2);
          if (result2) {
            console.log('Shared Draft Button: Second attempt succeeded, stopping');
            return;
          }

          // Try after 3 seconds
          setTimeout(function() {
            const result3 = addSharedDraftButton();
            console.log('Shared Draft Button: Third attempt result:', result3);
          }, 3000);
        }, 1000);
      }

      // Listen for route changes in Discourse's SPA navigation
      api.onPageChange(() => {
        console.log('Shared Draft Button: ========== ROUTE CHANGED ==========');
        console.log('Shared Draft Button: New URL:', window.location.href);
        console.log('Shared Draft Button: New pathname:', window.location.pathname);

        // IMPORTANT: First remove the existing button immediately if it exists
        // This prevents the button from persisting when navigating away
        const existingButton = document.querySelector('#create-shared-draft-button');
        if (existingButton) {
          console.log('Shared Draft Button: Removing existing button before re-evaluation');
          removeSharedDraftButton();
        }

        // Try multiple times with increasing delays to catch the button after route change
        setTimeout(function() {
          console.log('Shared Draft Button: Route change - attempt 1');
          addSharedDraftButton();
        }, 100);

        setTimeout(function() {
          console.log('Shared Draft Button: Route change - attempt 2');
          addSharedDraftButton();
        }, 300);

        setTimeout(function() {
          console.log('Shared Draft Button: Route change - attempt 3');
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
          console.log('Shared Draft Button: DOM changed, checking for button...');
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

      console.log('Shared Draft Button: Setup complete');
    });
  }
};