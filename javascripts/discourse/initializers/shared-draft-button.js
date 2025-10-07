import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container) {
    withPluginApi("0.8.31", () => {
      console.log("Shared Draft Button: Initializing");

      // Default settings
      let settings = {
        staff_only: true,
        button_text: "New Shared Draft", 
        enabled_category: "",
        require_shared_drafts_enabled: true,
        hide_new_topic_button: false
      };

      // Get theme settings
      try {
        const themeSettings = container.lookup("service:theme-settings");
        if (themeSettings && Object.keys(themeSettings).length > 0) {
          settings = Object.assign({}, settings, themeSettings);
          console.log("Shared Draft Button: Loaded theme settings successfully");
        }
      } catch (e) {
        console.log("Shared Draft Button: Could not access theme settings:", e);
      }

      // Ensure we have the theme settings
      if (!settings.enabled_category || settings.enabled_category === "") {
        console.log("Shared Draft Button: No enabled category configured in theme settings");
      }

      console.log("Shared Draft Button: Final settings being used:", settings);
      console.log("Shared Draft Button: enabled_category value:", JSON.stringify(settings.enabled_category), "type:", typeof settings.enabled_category);

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
        
        // Check if URL contains the target category ID
        const urlHasCategory = window.location.pathname.includes('/' + targetCategoryId);
        
        // Also check for category element in DOM
        const categoryElement = document.querySelector('[data-category-id="' + targetCategoryId + '"]');
        
        // Also check body class for category
        const bodyHasCategory = document.body.className.includes('category-' + targetCategoryId);
        
        console.log('Shared Draft Button: URL check:', urlHasCategory, 'DOM check:', !!categoryElement, 'Body check:', bodyHasCategory);
        
        const shouldOverride = urlHasCategory || !!categoryElement || bodyHasCategory;
        
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