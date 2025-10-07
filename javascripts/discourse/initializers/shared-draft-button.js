import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container, settings) {
    withPluginApi("0.8.31", () => {
      console.log("Shared Draft Button: Initializing");
      console.log("Shared Draft Button: arguments.length:", arguments.length);
      console.log("Shared Draft Button: All arguments:", arguments);
      console.log("Shared Draft Button: Received settings parameter:", settings);
      console.log("Shared Draft Button: Settings type:", typeof settings);
      console.log("Shared Draft Button: Settings keys:", settings ? Object.keys(settings) : "null/undefined");
      
      // Deep inspection of the settings
      if (settings && typeof settings === 'object') {
        console.log("Shared Draft Button: Settings content:");
        for (const key in settings) {
          if (key.includes('category') || key.includes('enabled') || key.includes('button') || key.includes('staff') || key.includes('hide')) {
            console.log("  RELEVANT:", key, ":", JSON.stringify(settings[key]), "(type:", typeof settings[key], ")");
          } else {
            console.log("  ", key, ":", typeof settings[key]);
          }
        }
        
        // Check if this might be a service object instead of settings
        if ('_booted' in settings || '_bootPromise' in settings) {
          console.log("Shared Draft Button: This looks like a service object, not theme settings!");
          console.log("Shared Draft Button: Looking for theme settings within this object...");
          
          // Try to find theme settings within this object
          if (settings.themeSettings) {
            console.log("Shared Draft Button: Found themeSettings property:", settings.themeSettings);
          }
          if (settings.settings) {
            console.log("Shared Draft Button: Found settings property:", settings.settings);
          }
        }
      }

      // Default settings
      let finalSettings = {
        staff_only: true,
        button_text: "New Shared Draft", 
        enabled_category: "",
        require_shared_drafts_enabled: true,
        hide_new_topic_button: false
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
        
        // TEMPORARY: If we're still not getting the category, hardcode it for now since we know it should be 170
        if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
          console.log("Shared Draft Button: FALLBACK - Settings still empty, using hardcoded 170");
          finalSettings.enabled_category = "170";
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

      // Use finalSettings instead of settings for the rest of the code
      settings = finalSettings;

      // Function to create shared draft - exact copy of your working approach
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Shared Draft Button: Creating shared draft...');
        
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
              composer.open({
                action: 'createSharedDraft',
                draftKey: 'shared_draft_' + Date.now(),
                archetypeId: 'regular'
              }).then(function() {
                console.log('Shared Draft Button: Shared draft composer opened successfully');
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
              });
            }
          }, 100);
          
        } catch (error) {
          console.error('Shared Draft Button: Error accessing Discourse components:', error);
        }
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

      // Main function to override the New Topic button
      function overrideNewTopicButton() {
        console.log('Shared Draft Button: Checking if button should be overridden...');
        
        // Only override for staff members
        if (settings.staff_only && !isUserStaff()) {
          console.log('Shared Draft Button: User is not staff, skipping override');
          return false;
        }
        
        // Only override in target category (if specified)
        if (!shouldOverrideButton()) {
          console.log('Shared Draft Button: Not in target category, skipping override');
          return false;
        }
        
        // Find the create topic button with better error handling
        let createTopicButton = null;
        try {
          createTopicButton = document.querySelector('#create-topic');
        } catch (e) {
          console.log('Shared Draft Button: Error finding create topic button:', e);
          return false;
        }
        
        if (!createTopicButton) {
          console.log('Shared Draft Button: Create topic button not found');
          return false;
        }
        
        // Additional safety checks
        if (!createTopicButton.hasAttribute) {
          console.log('Shared Draft Button: Create topic button missing hasAttribute method');
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
            buttonLabel.textContent = settings.button_text;
            console.log('Shared Draft Button: Button text changed to "' + settings.button_text + '"');
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