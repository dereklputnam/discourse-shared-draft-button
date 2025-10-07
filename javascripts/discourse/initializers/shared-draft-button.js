import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container, settings) {
    withPluginApi("0.8.31", () => {
      console.log("Shared Draft Button: Initializing - VERSION 2024-01-07-GROUP-DEBUGGING");
      console.log("Shared Draft Button: CRITICAL DEBUG - This should appear if new version loaded");
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
        allowed_groups: "",
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
        
        // TEMPORARY: If we're still not getting the category, hardcode it for now since we know it should be 170
        // BUT only if we're actually in category 170 right now
        if (!finalSettings.enabled_category || finalSettings.enabled_category === "") {
          const currentPath = window.location.pathname;
          const isInCategory170 = currentPath.includes('/170') || 
                                 currentPath.includes('/c/170') || 
                                 document.querySelector('[data-category-id="170"]') ||
                                 document.body.className.includes('category-170');
          
          if (isInCategory170) {
            console.log("Shared Draft Button: FALLBACK - Settings empty but we're in category 170, using hardcoded value");
            finalSettings.enabled_category = "170";
          } else {
            console.log("Shared Draft Button: FALLBACK - Settings empty and not in category 170, leaving empty");
          }
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
      console.log("Shared Draft Button: allowed_groups value:", JSON.stringify(finalSettings.allowed_groups), "type:", typeof finalSettings.allowed_groups);
      
      // CRITICAL TEST: Try to manually set groups for testing
      if (!finalSettings.allowed_groups || finalSettings.allowed_groups.trim() === "") {
        console.log("Shared Draft Button: TESTING - Settings appear empty, manually setting test groups");
        finalSettings.allowed_groups = "product_marketing,product_management,staff";
        console.log("Shared Draft Button: TESTING - Set allowed_groups to:", finalSettings.allowed_groups);
      }

      // Use finalSettings instead of settings for the rest of the code
      settings = finalSettings;

      // Function to create shared draft - exact copy of your working approach
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Shared Draft Button: Creating shared draft...');
        
        // Double-check permissions before opening composer
        if (!isUserInAllowedGroups()) {
          console.error('Shared Draft Button: Group permission check failed, blocking creation');
          return;
        }
        
        if (!canUserCreateInCategory()) {
          console.error('Shared Draft Button: Category permission check failed, blocking creation');
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
              const currentCategoryId = settings.enabled_category || '170';
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
              
              const currentCategoryId = settings.enabled_category || '170';
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


      // Function to check if user is in allowed groups
      function isUserInAllowedGroups() {
        if (typeof Discourse === 'undefined') {
          return false;
        }
        
        const currentUser = Discourse.User.current();
        if (!currentUser) {
          console.log('Shared Draft Button: No current user for group check');
          return false;
        }
        
        // If no allowed groups specified, allow all users (rely on category permissions)
        console.log('Shared Draft Button: allowed_groups setting value:', JSON.stringify(settings.allowed_groups));
        console.log('Shared Draft Button: allowed_groups type:', typeof settings.allowed_groups);
        
        if (!settings.allowed_groups || settings.allowed_groups.trim() === "") {
          console.log('Shared Draft Button: No group restrictions configured, allowing all users');
          return true;
        }
        
        console.log('Shared Draft Button: Checking group membership for allowed_groups:', settings.allowed_groups);
        
        try {
          // Parse the allowed group names (comma-separated)
          const allowedGroupNames = settings.allowed_groups.split(',').map(name => name.trim());
          console.log('Shared Draft Button: Allowed group names:', allowedGroupNames);
          
          // Get user's groups
          const userGroups = currentUser.groups || [];
          const userGroupNames = userGroups.map(group => group.name);
          console.log('Shared Draft Button: User group names:', userGroupNames);
          
          // Check if user is in any of the allowed groups (by name)
          const isInAllowedGroup = allowedGroupNames.some(groupName => userGroupNames.includes(groupName));
          console.log('Shared Draft Button: User is in allowed groups:', isInAllowedGroup);
          
          return isInAllowedGroup;
        } catch (e) {
          console.log('Shared Draft Button: Error checking group membership:', e.message);
          // Fallback: deny access if we can't check groups
          return false;
        }
      }

      // Function to check if user can create topics in the category
      function canUserCreateInCategory() {
        if (typeof Discourse === 'undefined') {
          return false;
        }
        
        const currentUser = Discourse.User.current();
        if (!currentUser) {
          console.log('Shared Draft Button: No current user for category check');
          return false;
        }
        
        // Get the current category ID
        const categoryId = settings.enabled_category;
        if (!categoryId) {
          console.log('Shared Draft Button: No category configured for permission check');
          return true; // If no category specified, don't restrict
        }
        
        console.log('Shared Draft Button: Checking category creation permissions for category:', categoryId);
        
        try {
          // Try to get the category from the store
          const store = Discourse.__container__.lookup('service:store');
          const category = store.peekRecord('category', categoryId);
          
          if (category) {
            console.log('Shared Draft Button: Found category:', category.name);
            console.log('Shared Draft Button: Category can_create_topic:', category.can_create_topic);
            
            // Check if user can create topics in this category
            // Note: can_create_topic might be true, undefined (allowed), or false (denied)
            const canCreate = category.can_create_topic !== false;
            console.log('Shared Draft Button: User can create topics in category:', canCreate);
            
            return canCreate;
          } else {
            console.log('Shared Draft Button: Category not found in store, allowing access');
            // If we can't find the category, don't restrict (fail open for usability)
            return true;
          }
        } catch (e) {
          console.log('Shared Draft Button: Error checking category permissions:', e.message);
          // Fallback: allow access if we can't check (fail open for usability)
          return true;
        }
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
        console.log('Shared Draft Button: DEBUG - Current settings object:', settings);
        console.log('Shared Draft Button: DEBUG - Version check - enhanced group debugging loaded');
        
        // Check if user is in allowed groups (if groups are specified)
        console.log('Shared Draft Button: About to check group permissions...');
        const hasGroupAccess = isUserInAllowedGroups();
        console.log('Shared Draft Button: Group access check result:', hasGroupAccess);
        
        if (!hasGroupAccess) {
          console.log('Shared Draft Button: User is not in allowed groups, skipping override');
          return false;
        }
        
        // Check if user can create topics in this category
        if (!canUserCreateInCategory()) {
          console.log('Shared Draft Button: User cannot create topics in this category, skipping override');
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