# Shared Draft Button

A Discourse theme component that replaces the **New Topic** button with a **New Shared Draft** button in your shared drafts category. Clicking it opens the composer directly in shared draft mode.

## Installation

1. **Admin → Customize → Themes → Install → From a git repository**
2. Paste: `https://github.com/dereklputnam/discourse-shared-draft-button`
3. Add the component to your active theme.

## Configuration

The button automatically appears in the category configured as your **shared drafts category** in Discourse's site settings:

**Admin → Site Settings → shared_drafts_category**

Direct link (append to your site URL):
```
/admin/site_settings/category/all_results?filter=shared_drafts_category
```

| Theme setting | Description |
|---|---|
| **Button text** | Label shown on the button (default: *New Shared Draft*). |

## How it works

- When viewing the `shared_drafts_category`, the standard **New Topic** button is replaced with the configured button label.
- Clicking the button opens the composer with `action: createSharedDraft`.
- Navigating away from the category restores the original button.

## Requirements

- Discourse 3.1+
- A `shared_drafts_category` must be configured in site settings.

## License

MIT — see [LICENSE](LICENSE).
