import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container) {
    withPluginApi("0.8.31", (api) => {
      // Default settings - always available
      const defaultSettings = {
        staff_only: true,
        require_shared_drafts_enabled: true,
        button_text: "New Shared Draft",
        enabled_category: null,
        hide_new_topic_button: false
      };

      // Safely get services
      let siteSettings, currentUser, composer;
      
      try {
        siteSettings = container.lookup("service:site-settings") || container.lookup("site-settings:main");
        currentUser = container.lookup("service:current-user") || container.lookup("current-user:main");
        composer = container.lookup("service:composer") || container.lookup("composer:main");
      } catch (e) {
        console.log("Shared Draft Button: Could not access services - using defaults");
        // Continue with defaults rather than returning
      }

      // Get theme settings with extensive fallbacks
      let settings = defaultSettings;
      try {
        const themeId = document.querySelector('meta[name="theme-id"]')?.getAttribute('content');
        if (themeId) {
          const settingsFromMeta = window.PreloadStore?.get(`theme_${themeId}`);
          if (settingsFromMeta) {
            settings = Object.assign({}, defaultSettings, settingsFromMeta);
          }
        }
      } catch (e) {
        console.log("Shared Draft Button: Using default settings");
      }
      
      // Helper function to check if button should be shown
      function shouldShowButton(categoryId) {
        try {
          // Check if user has permission
          if (settings.staff_only && (!currentUser || !currentUser.staff)) {
            return false;
          }
          
          // Check if shared drafts are enabled
          if (settings.require_shared_drafts_enabled && (!siteSettings || !siteSettings.shared_drafts_category)) {
            return false;
          }
          
          // Check category restrictions
          if (settings.enabled_category) {
            const enabledCategoryId = parseInt(settings.enabled_category);
            if (!isNaN(enabledCategoryId) && categoryId && categoryId !== enabledCategoryId) {
              return false;
            }
          }
          
          return true;
        } catch (e) {
          console.log("Shared Draft Button: Error in shouldShowButton", e);
          return false;
        }
      }
      
      // Function to create shared draft - simplified approach
      function createSharedDraft(categoryId) {
        try {
          console.log('Shared Draft Button: Creating shared draft for category', categoryId);
          
          // Simple URL-based approach - most reliable
          const params = new URLSearchParams();
          params.set('shared_draft', 'true');
          
          if (categoryId) {
            params.set('category_id', categoryId);
          }
          
          const newTopicUrl = `/new-topic?${params.toString()}`;
          console.log('Shared Draft Button: Navigating to:', newTopicUrl);
          
          window.location.href = newTopicUrl;
          
        } catch (e) {
          console.log('Shared Draft Button: Error in createSharedDraft', e);
          // Fallback - try to find and click original new topic button
          try {
            const originalBtn = document.querySelector("#create-topic, .btn-primary[href*='new-topic']");
            if (originalBtn) {
              originalBtn.click();
            }
          } catch (fallbackError) {
            console.log('Shared Draft Button: Fallback also failed', fallbackError);
          }
        }
      }
      
      
      // Main function to override New Topic button - simplified
      function overrideNewTopicButton() {
        setTimeout(() => {
          try {
            const createTopicBtn = document.querySelector("#create-topic");
            
            if (createTopicBtn && !createTopicBtn.dataset.sharedDraftOverridden) {
              
              // Get current category ID from URL
              let categoryId = null;
              const pathMatch = window.location.pathname.match(/\/c\/[^\/]+\/[^\/]+\/(\d+)/);
              if (pathMatch) {
                categoryId = parseInt(pathMatch[1]);
              }
              
              // Check if we should show the button for this category
              if (!shouldShowButton(categoryId)) {
                return;
              }
              
              // Change button text
              const buttonLabel = createTopicBtn.querySelector(".d-button-label");
              if (buttonLabel) {
                buttonLabel.textContent = settings.button_text || "New Shared Draft";
              }
              
              // Add click handler
              createTopicBtn.addEventListener("click", (e) => {
                e.preventDefault();
                createSharedDraft(categoryId);
              }, { once: false });
              
              createTopicBtn.dataset.sharedDraftOverridden = "true";
              createTopicBtn.title = "Create a new shared draft for staff collaboration";
              
              console.log('Shared Draft Button: Overridden New Topic button for category', categoryId);
            }
          } catch (e) {
            console.log('Shared Draft Button: Error in overrideNewTopicButton', e);
          }
        }, 1000);
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