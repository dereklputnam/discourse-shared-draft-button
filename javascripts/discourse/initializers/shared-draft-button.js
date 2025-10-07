import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container) {
    withPluginApi("0.8.31", (api) => {
      // Safely get services with fallback
      let siteSettings, currentUser, composer;
      
      try {
        siteSettings = container.lookup("service:site-settings") || container.lookup("site-settings:main");
        currentUser = container.lookup("service:current-user") || container.lookup("current-user:main");
        composer = container.lookup("service:composer") || container.lookup("composer:main");
      } catch (e) {
        console.log("Shared Draft Button: Error accessing services", e);
        return;
      }

      // Function to get theme settings safely
      function getThemeSettings(container) {
        const defaultSettings = {
          staff_only: true,
          require_shared_drafts_enabled: true,
          button_text: "New Shared Draft",
          enabled_category: "",
          hide_new_topic_button: false
        };

        try {
          // Try multiple ways to access theme settings
          const themeSettings = container.lookup("service:theme-settings") || 
                               container.lookup("theme-settings:main") ||
                               api.container?.lookup("service:theme-settings");
          
          if (themeSettings && typeof themeSettings === 'object') {
            return Object.assign({}, defaultSettings, themeSettings);
          }
        } catch (e) {
          console.log("Shared Draft Button: Using default settings due to error:", e);
        }

        return defaultSettings;
      }

      // Get theme settings with better error handling
      const settings = getThemeSettings(container);
      
      // Helper function to check if button should be shown
      function shouldShowButton(categoryId) {
        try {
          // Check if user has permission
          if (settings.staff_only && (!currentUser?.staff)) {
            return false;
          }
          
          // Check if shared drafts are enabled
          if (settings.require_shared_drafts_enabled && !siteSettings?.shared_drafts_category) {
            return false;
          }
          
          // Check category restrictions
          if (settings.enabled_category) {
            const enabledCategoryId = parseInt(settings.enabled_category);
            
            if (categoryId && !isNaN(enabledCategoryId) && categoryId !== enabledCategoryId) {
              return false;
            }
          }
          
          return true;
        } catch (e) {
          console.log("Shared Draft Button: Error in shouldShowButton", e);
          return false;
        }
      }
      
      // Function to create shared draft with proper Discourse API
      function createSharedDraft(categoryId) {
        try {
          console.log('Shared Draft Button: Creating shared draft for category', categoryId);
          
          // Get the shared drafts destination category
          const sharedDraftsCategoryId = siteSettings?.shared_drafts_category;
          
          // Use current category as the topic category, shared drafts category as destination
          const topicCategoryId = categoryId;
          const destinationCategoryId = sharedDraftsCategoryId;
          
          console.log('Shared Draft Button: Topic category:', topicCategoryId, 'Destination category:', destinationCategoryId);
          
          // Direct composer approach - more reliable
          triggerComposerForSharedDraft(topicCategoryId, destinationCategoryId);
          
        } catch (e) {
          console.log('Shared Draft Button: Error in createSharedDraft', e);
          // Ultimate fallback - just click the original new topic button
          const originalBtn = document.querySelector("#create-topic:not([data-shared-draft-overridden])");
          if (originalBtn) {
            originalBtn.click();
          }
        }
      }
      
      // Function to trigger composer for shared draft
      function triggerComposerForSharedDraft(topicCategoryId, destinationCategoryId) {
        try {
          if (!composer) {
            console.log('Shared Draft Button: Composer service not available');
            return;
          }

          // Close existing composer if open
          if (composer.model) {
            composer.close();
          }
          
          // Wait a bit for the composer to close
          setTimeout(() => {
            try {
              // Create shared draft using proper Discourse method
              const draftKey = `shared_draft_${topicCategoryId || 'null'}_${Date.now()}`;
              
              const composerOpts = {
                action: 'createTopic',
                draftKey: draftKey,
                categoryId: destinationCategoryId || topicCategoryId, // Use shared drafts category as the composer category
                archetypeId: 'regular',
                sharedDraft: true,
                isSharedDraft: true
              };

              console.log('Shared Draft Button: Opening composer with options:', composerOpts);

              // Try different composer opening methods
              if (composer.open) {
                composer.open(composerOpts).then((model) => {
                  if (model && model.set) {
                    // Set the shared draft properties
                    model.set('isSharedDraft', true);
                    model.set('sharedDraft', true);
                    
                    // Set the destination category (where the topic will be published)
                    if (topicCategoryId && topicCategoryId !== destinationCategoryId) {
                      model.set('destinationCategoryId', topicCategoryId);
                    }
                    
                    console.log('Shared Draft Button: Successfully opened shared draft composer');
                    console.log('Model properties:', {
                      categoryId: model.get('categoryId'),
                      isSharedDraft: model.get('isSharedDraft'),
                      sharedDraft: model.get('sharedDraft'),
                      destinationCategoryId: model.get('destinationCategoryId')
                    });
                  }
                }).catch((error) => {
                  console.log('Shared Draft Button: Error opening composer:', error);
                  // Fallback to simpler approach
                  fallbackComposerOpen(topicCategoryId, destinationCategoryId);
                });
              } else {
                // Fallback to simpler approach
                fallbackComposerOpen(topicCategoryId, destinationCategoryId);
              }
            } catch (e) {
              console.log('Shared Draft Button: Error in delayed composer opening:', e);
            }
          }, 150);
          
        } catch (e) {
          console.log('Shared Draft Button: Error in triggerComposerForSharedDraft', e);
        }
      }
      
      // Fallback composer opening method
      function fallbackComposerOpen(topicCategoryId, destinationCategoryId) {
        try {
          // Use URL approach as fallback
          const params = new URLSearchParams();
          params.set('shared_draft', 'true');
          if (destinationCategoryId) {
            params.set('category_id', destinationCategoryId);
          }
          if (topicCategoryId && topicCategoryId !== destinationCategoryId) {
            params.set('destination_category_id', topicCategoryId);
          }
          
          const newTopicUrl = `/new-topic?${params.toString()}`;
          console.log('Shared Draft Button: Using URL fallback:', newTopicUrl);
          
          // Navigate to the new topic URL
          window.location.href = newTopicUrl;
        } catch (e) {
          console.log('Shared Draft Button: Error in fallback composer open:', e);
        }
      }
      
      // Main function to override New Topic button
      function overrideNewTopicButton() {
        setTimeout(() => {
          try {
            const createTopicBtn = document.querySelector("#create-topic, .btn-primary[href*='new-topic'], .btn-primary[title*='new topic']");
            
            if (createTopicBtn && !createTopicBtn.dataset.sharedDraftOverridden) {
              
              // Get current category ID from URL or page context
              let categoryId = null;
              const pathMatch = window.location.pathname.match(/\/c\/[^\/]+\/[^\/]+\/(\d+)/);
              if (pathMatch) {
                categoryId = parseInt(pathMatch[1]);
              }
              
              // Also try to get category from page data
              if (!categoryId) {
                const bodyClass = document.body.className;
                const categoryMatch = bodyClass.match(/category-(\d+)/);
                if (categoryMatch) {
                  categoryId = parseInt(categoryMatch[1]);
                }
              }
              
              // Check if we should show the button for this category
              if (!shouldShowButton(categoryId)) {
                return;
              }
              
              // Change button text
              const buttonLabel = createTopicBtn.querySelector(".d-button-label") || createTopicBtn;
              if (buttonLabel) {
                buttonLabel.textContent = settings.button_text || "New Shared Draft";
              }
              
              // Remove any existing event listeners
              const newBtn = createTopicBtn.cloneNode(true);
              createTopicBtn.parentNode.replaceChild(newBtn, createTopicBtn);
              
              // Add new click handler
              newBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                createSharedDraft(categoryId);
                return false;
              }, { capture: true, passive: false });
              
              newBtn.dataset.sharedDraftOverridden = "true";
              newBtn.title = "Create a new shared draft for staff collaboration";
              
              console.log('Shared Draft Button: Successfully overridden New Topic button for category', categoryId);
            }
          } catch (e) {
            console.log('Shared Draft Button: Error in overrideNewTopicButton', e);
          }
        }, 750);
      }
      
      
      // Initialize
      overrideNewTopicButton();
      
      // Re-run when navigating between pages
      api.onPageChange(() => {
        setTimeout(() => {
          overrideNewTopicButton();
        }, 200);
      });
      
      console.log("Shared Draft Button component initialized successfully");
    });
  }
};