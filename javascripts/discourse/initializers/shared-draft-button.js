import { withPluginApi } from "discourse/lib/plugin-api";

// BACKUP CONFIGURATION: If theme settings aren't loading, you can hardcode values here
// Set to null to rely on theme settings, or set to a category ID string to use as fallback
const FALLBACK_CATEGORY_ID = "167"; // Staging: 167, Production: 170

export default {
  name: "shared-draft-button",

  initialize(container, settings) {
    // ULTRA CRITICAL DEBUG: Log settings BEFORE withPluginApi
    console.log("=== SHARED DRAFT BUTTON: INITIALIZATION START ===");
    console.log("Settings parameter received:", settings);
    console.log("Settings type:", typeof settings);
    console.log("Settings is null?", settings === null);
    console.log("Settings is undefined?", settings === undefined);
    if (settings && typeof settings === 'object') {
      console.log("Settings keys:", Object.keys(settings));
      console.log("Settings.enabled_category:", settings.enabled_category);
      console.log("Has own property 'enabled_category'?", settings.hasOwnProperty('enabled_category'));
    }

    withPluginApi("0.8.31", (api) => {
      console.log("Shared Draft Button: Initializing - VERSION 2025-01-ULTRA-DEBUG");
      console.log("Shared Draft Button: Inside withPluginApi - settings still available:", settings);

      // Log helpful link to shared drafts settings
      const baseUrl = window.location.origin;
      const sharedDraftsSettingsUrl = baseUrl + '/admin/site_settings/category/all_results?filter=shared_drafts';
      console.log("Shared Draft Button: Configure shared drafts at:", sharedDraftsSettingsUrl);
      // Reduced debugging - uncomment lines below for troubleshooting
      // console.log("Shared Draft Button: arguments.length:", arguments.length);
      // console.log("Shared Draft Button: Received settings parameter:", settings);
      
      // Minimal settings debugging - only show if we need to troubleshoot
      if (settings && typeof settings === 'object' && Object.keys(settings).some(key => 
        key.includes('category') || key.includes('enabled') || key.includes('button') || key.includes('staff') || key.includes('hide')
      )) {
        console.log("Shared Draft Button: Found theme settings in parameter");
        for (const key in settings) {
          if (key.includes('category') || key.includes('enabled') || key.includes('button') || key.includes('staff') || key.includes('hide')) {
            console.log("  ", key, ":", JSON.stringify(settings[key]));
          }
        }
      }

      // Default settings
      let finalSettings = {
        button_text: "New Shared Draft",
        enabled_category: "",
        require_shared_drafts_enabled: true
      };

      // Method 1: Use settings parameter directly (this is the standard way)
      if (settings && typeof settings === 'object') {
        finalSettings = Object.assign({}, finalSettings, settings);
        console.log("Shared Draft Button: Loaded settings via parameter");
        console.log("Shared Draft Button: Settings from parameter:", settings);
        console.log("Shared Draft Button: finalSettings after merge:", finalSettings);
        
        // Special check: if enabled_category is still empty but we saw it in the detailed logs
        if ((!finalSettings.enabled_category || finalSettings.enabled_category === "") && settings.enabled_category) {
          finalSettings.enabled_category = settings.enabled_category;
          console.log("Shared Draft Button: Manually set enabled_category from settings:", settings.enabled_category);
        }
      }

      // Method 2: Fallback to service lookup if parameter method didn't work
      if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
        console.log("Shared Draft Button: Settings parameter didn't provide category, trying service lookup...");
        
        try {
          const themeSettings = container.lookup("service:theme-settings");
          console.log("Shared Draft Button: service:theme-settings result:", themeSettings);
          if (themeSettings && typeof themeSettings === 'object') {
            finalSettings = Object.assign({}, finalSettings, themeSettings);
            console.log("Shared Draft Button: Loaded theme settings via service");
          }
        } catch (e) {
          console.log("Shared Draft Button: service method failed:", e);
        }
      }

      // Method 3: Try accessing settings via the container with theme name
      if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
        console.log("Shared Draft Button: Still no category, trying theme-specific lookup...");
        
        try {
          // Try different theme settings service names
          const themeSettingsServices = [
            "theme-settings:discourse-shared-draft-button",
            "theme-settings:shared-draft-button", 
            "settings:theme",
            "service:theme-settings"
          ];
          
          for (const serviceName of themeSettingsServices) {
            try {
              console.log("Shared Draft Button: Trying service:", serviceName);
              const themeSettings = container.lookup(serviceName);
              console.log("Shared Draft Button:", serviceName, "result:", themeSettings);
              if (themeSettings && typeof themeSettings === 'object' && themeSettings.enabled_category) {
                finalSettings = Object.assign({}, finalSettings, themeSettings);
                console.log("Shared Draft Button: Successfully loaded settings via", serviceName);
                break;
              }
            } catch (e) {
              console.log("Shared Draft Button:", serviceName, "failed:", e.message);
            }
          }
        } catch (e) {
          console.log("Shared Draft Button: theme-specific lookup failed:", e);
        }
      }
      
      // Method 4: Try accessing theme settings from Discourse.__container__
      if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
        console.log("Shared Draft Button: Still no category, trying Discourse container...");
        
        try {
          if (typeof Discourse !== 'undefined' && Discourse.__container__) {
            console.log("Shared Draft Button: Discourse container available");
            
            // List all available services to see what's there
            const services = Discourse.__container__.cache || {};
            console.log("Shared Draft Button: Available services:", Object.keys(services).filter(k => k.includes('theme') || k.includes('settings')));
            
            // Try multiple service lookups
            const serviceAttempts = [
              "service:theme-settings", 
              "theme-settings:main",
              "theme:settings"
            ];
            
            for (const service of serviceAttempts) {
              try {
                const result = Discourse.__container__.lookup(service);
                console.log("Shared Draft Button: Discourse", service, "result:", result);
                if (result && typeof result === 'object' && result.enabled_category) {
                  finalSettings = Object.assign({}, finalSettings, result);
                  console.log("Shared Draft Button: Successfully loaded via Discourse", service);
                  break;
                }
              } catch (e) {
                console.log("Shared Draft Button: Discourse", service, "failed:", e.message);
              }
            }
          }
        } catch (e) {
          console.log("Shared Draft Button: Discourse container access failed:", e);
        }
      }

      console.log("Shared Draft Button: Final settings being used:", finalSettings);
      console.log("Shared Draft Button: enabled_category value:", JSON.stringify(finalSettings.enabled_category), "type:", typeof finalSettings.enabled_category);

      // FALLBACK: If settings are completely empty (remote theme settings not loaded),
      // use environment-specific defaults. This helps when the component is installed
      // as a remote GitHub theme where custom settings can't be saved.
      if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
        console.warn("Shared Draft Button: WARNING - No enabled_category found in settings!");
        console.warn("Shared Draft Button: This usually means the theme is installed as a remote theme from GitHub.");
        console.warn("Shared Draft Button: Settings configured in the UI won't work for remote themes.");
        console.warn("Shared Draft Button: To use custom settings, either:");
        console.warn("Shared Draft Button:   1. Make a local copy of this theme component, OR");
        console.warn("Shared Draft Button:   2. Fork the repo and point to your fork, OR");
        console.warn("Shared Draft Button:   3. Hardcode your category ID in the component");
      }

      // LAST RESORT: Try to access theme settings directly from the DOM or window
      if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
        console.log("Shared Draft Button: Trying last resort - checking for settings in window/DOM");

        // Try to find theme settings in the window object
        if (typeof window !== 'undefined') {
          // Check if theme settings are exposed anywhere
          if (window.PreloadStore && window.PreloadStore.data && window.PreloadStore.data.theme) {
            console.log("Shared Draft Button: Found PreloadStore.theme:", window.PreloadStore.data.theme);
          }

          // Try to access via the registry
          try {
            if (container && container.registry) {
              console.log("Shared Draft Button: Registry entries:", container.registry.registrations);
            }
          } catch (e) {
            console.log("Shared Draft Button: Could not access registry:", e);
          }
        }
      }

      // Apply fallback if settings are still empty and FALLBACK_CATEGORY_ID is set
      if ((!finalSettings.enabled_category || finalSettings.enabled_category === "") && FALLBACK_CATEGORY_ID) {
        console.warn("Shared Draft Button: Using FALLBACK_CATEGORY_ID from code:", FALLBACK_CATEGORY_ID);
        finalSettings.enabled_category = FALLBACK_CATEGORY_ID;
      }

      // Use finalSettings instead of settings for the rest of the code
      settings = finalSettings;

      // Function to check if we should override the button
      function shouldOverrideButton() {
        console.log('Shared Draft Button: shouldOverrideButton - enabled_category:', JSON.stringify(settings.enabled_category));

        // If no category restriction is set, don't show anywhere
        if (!settings.enabled_category || settings.enabled_category === "") {
          console.log('Shared Draft Button: No enabled category - returning false');
          return false;
        }

        const targetCategoryId = settings.enabled_category.toString();
        console.log('Shared Draft Button: Target category ID:', targetCategoryId);
        console.log('Shared Draft Button: Current URL:', window.location.pathname);
        console.log('Shared Draft Button: Current URL hash:', window.location.hash);
        console.log('Shared Draft Button: Current URL search:', window.location.search);

        // Check if URL contains the target category ID in various patterns
        const urlHasCategory = window.location.pathname.includes('/' + targetCategoryId) ||
                              window.location.pathname.includes('/c/' + targetCategoryId) ||
                              window.location.hash.includes('/' + targetCategoryId) ||
                              window.location.search.includes('category=' + targetCategoryId);

        // Also check for category element in DOM with multiple selectors
        const categorySelectors = [
          '[data-category-id="' + targetCategoryId + '"]',
          '.category-' + targetCategoryId,
          '[data-category="' + targetCategoryId + '"]'
        ];

        let categoryElement = null;
        for (const selector of categorySelectors) {
          categoryElement = document.querySelector(selector);
          if (categoryElement) {
            console.log('Shared Draft Button: Found category element with selector:', selector);
            break;
          }
        }

        // Also check body class for category
        const bodyHasCategory = document.body.className.includes('category-' + targetCategoryId);

        // Check for category in meta tags
        const categoryMeta = document.querySelector('meta[name="discourse-category-id"]');
        const metaHasCategory = categoryMeta && categoryMeta.content === targetCategoryId;

        console.log('Shared Draft Button: URL check:', urlHasCategory, 'DOM check:', !!categoryElement, 'Body check:', bodyHasCategory, 'Meta check:', metaHasCategory);
        console.log('Shared Draft Button: Body classes:', document.body.className);

        const shouldOverride = urlHasCategory || !!categoryElement || bodyHasCategory || metaHasCategory;

        console.log('Shared Draft Button: Final decision - shouldOverride:', shouldOverride);

        return shouldOverride;
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

              // Get the current category ID for default
              const currentCategoryId = settings.enabled_category;
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

              const currentCategoryId = settings.enabled_category;
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
            buttonLabel.textContent = settings.button_text;
            console.log('Shared Draft Button: Set button text to "' + settings.button_text + '"');
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
        console.log('Shared Draft Button: Route changed, re-evaluating button state...');

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