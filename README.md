# Shared Draft Button

A Discourse theme component that replaces the **New Topic** button with a **New Shared Draft** button in selected categories. Clicking it opens the composer in shared draft mode with the category pre-selected.

## Installation

1. **Admin → Customize → Themes → Install → From a git repository**
2. Paste: `https://github.com/dereklputnam/discourse-shared-draft-button`
3. Add the component to your active theme.

## Settings

| Setting | Description |
|---|---|
| **Enabled categories** | Searchable category picker. The shared draft button appears only in these categories. |
| **Button text** | Label shown on the button (default: *New Shared Draft*). |

## How it works

- On each page navigation, the component checks whether the current category is in the enabled list.
- If it is, the standard `#create-topic` button is hidden and a clone with the configured label is inserted in its place.
- Clicking the button opens the Discourse composer with `action: createSharedDraft`.
- Navigating away from the category restores the original button.

## Requirements

- Discourse 3.1+
- Shared drafts must be enabled in **Admin → Site Settings → shared_drafts**.

## License

MIT — see [LICENSE](LICENSE).
