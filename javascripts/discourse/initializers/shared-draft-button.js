import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container) {
    withPluginApi("0.8.31", (api) => {
      console.log("Shared Draft Button: Initializing");

      // Default settings
      const settings = {
        staff_only: true,
        require_shared_drafts_enabled: true,
        button_text: "New Shared Draft",
        enabled_category: "",
        hide_new_topic_button: false
      };

      // Safely get current user
      let currentUser = null;
      try {
        currentUser = api.getCurrentUser();
      } catch (e) {
        console.log("Shared Draft Button: Could not get current user");
      }

      // Safely get site settings
      let siteSettings = null;
      try {
        siteSettings = container.lookup("service:site-settings") || 
                      container.lookup("site-settings:main");
      } catch (e) {
        console.log("Shared Draft Button: Could not get site settings");
      }

      // Check if we should show the button
      function shouldShowButton(categoryId) {
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
      }

      // Function to create shared draft
      function createSharedDraft(categoryId) {
        try {
          console.log('Shared Draft Button: Creating shared draft for category', categoryId);
          
          // Simple URL approach - most reliable
          const params = new URLSearchParams();
          params.set('shared_draft', 'true');
          
          if (categoryId) {
            params.set('category_id', categoryId);
          }
          
          const newTopicUrl = `/new-topic?${params.toString()}`;
          console.log('Shared Draft Button: Navigating to:', newTopicUrl);
          
          window.location.href = newTopicUrl;
          
        } catch (e) {
          console.log('Shared Draft Button: Error creating shared draft', e);
        }
      }

      // Override New Topic button
      function overrideNewTopicButton() {
        setTimeout(() => {
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
              buttonLabel.textContent = settings.button_text;
            }
            
            // Add click handler
            createTopicBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              createSharedDraft(categoryId);
            }, { capture: true });
            
            createTopicBtn.dataset.sharedDraftOverridden = "true";
            createTopicBtn.title = "Create a new shared draft for staff collaboration";
            
            console.log('Shared Draft Button: Overridden New Topic button for category', categoryId);
          }
        }, 1000);
      }

      // Initialize
      overrideNewTopicButton();
      
      // Re-run when navigating between pages
      api.onPageChange(() => {
        setTimeout(overrideNewTopicButton, 500);
      });
      
      console.log("Shared Draft Button: Initialized successfully");
    });
  }
};