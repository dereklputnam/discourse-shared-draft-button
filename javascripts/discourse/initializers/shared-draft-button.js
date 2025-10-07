import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container) {
    withPluginApi("0.8.31", (api) => {
      console.log("Shared Draft Button: Initializing");

      // Get theme settings safely
      let settings = {
        staff_only: true,
        require_shared_drafts_enabled: true,
        button_text: "New Shared Draft", 
        enabled_category: "",
        hide_new_topic_button: false
      };

      // Try to get actual theme settings
      try {
        const themeSettings = container.lookup("service:theme-settings");
        if (themeSettings) {
          settings = Object.assign({}, settings, themeSettings);
        }
      } catch (e) {
        console.log("Shared Draft Button: Using default settings");
      }

      console.log('Shared Draft Button: Settings:', settings);

      // Function to check if user is staff
      function isUserStaff() {
        try {
          const currentUser = api.getCurrentUser();
          const isStaff = currentUser && currentUser.staff;
          console.log('Shared Draft Button: User is staff:', isStaff);
          return isStaff;
        } catch (e) {
          console.log('Shared Draft Button: Could not determine staff status');
          return false;
        }
      }

      // Function to check if we should override the button
      function shouldOverrideButton() {
        // Only override for staff members if staff_only is enabled
        if (settings.staff_only && !isUserStaff()) {
          console.log('Shared Draft Button: User is not staff, skipping override');
          return false;
        }
        
        // Check category restrictions
        if (settings.enabled_category) {
          const targetCategoryId = settings.enabled_category.toString();
          
          // Check if URL contains the target category ID
          const urlHasCategory = window.location.pathname.includes('/' + targetCategoryId);
          
          // Also check for category element in DOM
          const categoryElement = document.querySelector('[data-category-id="' + targetCategoryId + '"]');
          
          const shouldOverride = urlHasCategory || !!categoryElement;
          
          console.log('Shared Draft Button: Should override?', shouldOverride, 
                      '(URL has category:', urlHasCategory, ', Element found:', !!categoryElement, ')');
          
          return shouldOverride;
        }
        
        // If no category restriction, show on all pages
        return true;
      }

      // Function to create shared draft using proven approach
      function createSharedDraft(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Shared Draft Button: Creating shared draft...');
        
        // Get shared drafts category from site settings
        let sharedDraftsCategoryId = null;
        try {
          const siteSettings = container.lookup('service:site-settings') || 
                              container.lookup('site-settings:main');
          if (siteSettings && siteSettings.shared_drafts_category) {
            sharedDraftsCategoryId = siteSettings.shared_drafts_category;
            console.log('Shared Draft Button: Using shared drafts category:', sharedDraftsCategoryId);
          }
        } catch (e) {
          console.log('Shared Draft Button: Could not get site settings for shared drafts category');
        }
        
        try {
          // Try to access composer through multiple methods
          let composer = null;
          
          // Method 1: Try the application controller
          try {
            const appController = container.lookup('controller:application');
            composer = appController.get('composer');
            console.log('Shared Draft Button: Got composer via application controller:', !!composer);
          } catch (e) {
            console.log('Shared Draft Button: Application controller method failed');
          }
          
          // Method 2: Try direct service lookup
          if (!composer) {
            try {
              composer = container.lookup('service:composer');
              console.log('Shared Draft Button: Got composer via service lookup:', !!composer);
            } catch (e) {
              console.log('Shared Draft Button: Service lookup method failed');
            }
          }
          
          if (!composer) {
            console.log('Shared Draft Button: Could not access composer, using URL fallback');
            
            // Fallback to URL navigation with shared drafts category
            const params = new URLSearchParams();
            params.set('shared_draft', 'true');
            
            if (sharedDraftsCategoryId) {
              params.set('category_id', sharedDraftsCategoryId);
            }
            
            const newTopicUrl = `/new-topic?${params.toString()}`;
            console.log('Shared Draft Button: URL fallback with category:', sharedDraftsCategoryId);
            window.location.href = newTopicUrl;
            return;
          }
          
          // Close existing composer if open
          if (composer.get('model')) {
            composer.close();
          }
          
          // Try to create shared draft using composer
          setTimeout(() => {
            console.log('Shared Draft Button: Attempting to create shared draft...');
            
            // Try the createSharedDraft action first
            try {
              const composerOpts = {
                action: 'createSharedDraft',
                draftKey: 'shared_draft_' + Date.now(),
                archetypeId: 'regular'
              };
              
              // Set category if we have the shared drafts category
              if (sharedDraftsCategoryId) {
                composerOpts.categoryId = sharedDraftsCategoryId;
              }
              
              console.log('Shared Draft Button: Opening composer with options:', composerOpts);
              
              composer.open(composerOpts).then(() => {
                console.log('Shared Draft Button: Shared draft composer opened successfully');
              }).catch(() => {
                console.log('Shared Draft Button: createSharedDraft action failed, trying fallback');
                fallbackToRegularTopic(composer, sharedDraftsCategoryId);
              });
            } catch (e) {
              console.log('Shared Draft Button: createSharedDraft action not available, trying fallback');
              fallbackToRegularTopic(composer, sharedDraftsCategoryId);
            }
          }, 100);
          
        } catch (error) {
          console.error('Shared Draft Button: Error accessing composer:', error);
          // Ultimate fallback - URL navigation with shared drafts category
          const params = new URLSearchParams();
          params.set('shared_draft', 'true');
          if (sharedDraftsCategoryId) {
            params.set('category_id', sharedDraftsCategoryId);
          }
          window.location.href = `/new-topic?${params.toString()}`;
        }
      }

      // Fallback method to convert regular topic to shared draft
      function fallbackToRegularTopic(composer, sharedDraftsCategoryId) {
        const composerOpts = {
          action: 'createTopic',
          draftKey: 'shared_draft_fallback_' + Date.now(),
          archetypeId: 'regular'
        };
        
        // Set category if we have the shared drafts category
        if (sharedDraftsCategoryId) {
          composerOpts.categoryId = sharedDraftsCategoryId;
        }
        
        console.log('Shared Draft Button: Fallback composer options:', composerOpts);
        
        composer.open(composerOpts).then(() => {
          console.log('Shared Draft Button: Regular composer opened, attempting to convert to shared draft');
          
          const model = composer.get('model');
          if (model) {
            // Try setting shared draft properties
            try {
              model.set('isSharedDraft', true);
              model.set('sharedDraft', true);
              console.log('Shared Draft Button: Set shared draft properties');
            } catch (e) {
              console.log('Shared Draft Button: Could not set shared draft properties');
            }
          }
        }).catch((error) => {
          console.error('Shared Draft Button: All composer methods failed:', error);
        });
      }

      // Main function to override the New Topic button
      function overrideNewTopicButton() {
        console.log('Shared Draft Button: Checking if button should be overridden...');
        
        // Check if we should override
        if (!shouldOverrideButton()) {
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
        setTimeout(() => {
          if (overrideNewTopicButton()) {
            return;
          }
          
          // Try after 3 seconds
          setTimeout(() => {
            overrideNewTopicButton();
          }, 3000);
        }, 1000);
      }

      // Watch for DOM changes to handle dynamic content
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
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

      // Re-run when navigating between pages
      api.onPageChange(() => {
        setTimeout(initializeSharedDraftButton, 500);
      });

      console.log('Shared Draft Button: Setup complete');
    });
  }
};