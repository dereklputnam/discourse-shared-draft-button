import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "shared-draft-button-minimal",
  
  initialize() {
    withPluginApi("0.8.31", () => {
      console.log("Shared Draft Button: Minimal version loaded successfully");
      
      // Simple test function
      function replaceNewTopicButton() {
        setTimeout(() => {
          const btn = document.querySelector("#create-topic");
          if (btn) {
            const label = btn.querySelector(".d-button-label");
            if (label) {
              label.textContent = "New Shared Draft";
            }
            console.log("Shared Draft Button: Button text updated");
          }
        }, 1000);
      }
      
      // Initialize
      replaceNewTopicButton();
    });
  }
};