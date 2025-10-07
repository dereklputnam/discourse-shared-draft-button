import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button",
  
  initialize(container) {
    withPluginApi("0.8.31", (api) => {
      const siteSettings = container.lookup("service:site-settings");
      const currentUser = container.lookup("service:current-user");
      
      // Get theme settings - use a safer approach
      let settings = {};
      try {
        const themeSettings = container.lookup("service:theme-settings");
        if (themeSettings) {
          settings = themeSettings;
        }
      } catch (e) {
        console.log("Shared Draft Button: Using default settings");
        settings = {
          staff_only: true,
          require_shared_drafts_enabled: true,
          button_text: "New Shared Draft",
          enabled_categories: "",
          hide_new_topic_button: false
        };
      }
      
      // Helper function to check if button should be shown
      function shouldShowButton(categoryId) {
        // Check if user has permission
        if (settings.staff_only && (!currentUser || !currentUser.staff)) {
          return false;
        }
        
        // Check if shared drafts are enabled
        if (settings.require_shared_drafts_enabled && !siteSettings.shared_drafts_category) {
          return false;
        }
        
        // Check category restrictions
        if (settings.enabled_categories && settings.enabled_categories.length > 0) {
          const enabledCategoryIds = settings.enabled_categories
            .split(",")
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id));
          
          if (categoryId && enabledCategoryIds.length > 0 && !enabledCategoryIds.includes(categoryId)) {
            return false;
          }
        }
        
        return true;
      }
      
      // Function to create shared draft
      function createSharedDraft(categoryId) {
        const composer = container.lookup("service:composer");
        
        console.log('Shared Draft Button: Creating shared draft for category', categoryId);
        
        // Close existing composer if open
        if (composer && composer.get && composer.get("model")) {
          composer.close();
        }
        
        // Simple approach - open composer and set shared draft flag
        setTimeout(() => {
          if (composer && composer.open) {
            composer.open({
              action: "createTopic",
              draftKey: "shared_draft_" + Date.now(),
              categoryId: categoryId,
              archetypeId: "regular"
            }).then(() => {
              const model = composer.get("model");
              if (model && model.set) {
                model.set("sharedDraft", true);
                console.log('Shared Draft Button: Set shared draft flag');
              }
            }).catch((error) => {
              console.log('Shared Draft Button: Error opening composer', error);
            });
          }
        }, 100);
      }
      
      // Simple DOM-based approach to override the New Topic button
      function overrideNewTopicButton() {
        setTimeout(() => {
          const createTopicBtn = document.querySelector("#create-topic, .btn-primary[href*='new-topic']");
          if (createTopicBtn && !createTopicBtn.dataset.sharedDraftOverridden) {
            
            // Get current category ID from URL or page data
            let categoryId = null;
            const pathMatch = window.location.pathname.match(/\/c\/[^\/]+\/(\d+)/);
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
            
            // Override click handler
            createTopicBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              createSharedDraft(categoryId);
            }, true);
            
            createTopicBtn.dataset.sharedDraftOverridden = "true";
            createTopicBtn.title = "Create a new shared draft for staff collaboration";
            
            console.log('Shared Draft Button: Overridden New Topic button for category', categoryId);
          }
        }, 500);
      }
      
      // Run on page load and navigation
      overrideNewTopicButton();
      
      // Re-run when navigating between pages
      api.onPageChange(() => {
        overrideNewTopicButton();
      });
      
      console.log("Shared draft button component initialized");
    });
  }
};