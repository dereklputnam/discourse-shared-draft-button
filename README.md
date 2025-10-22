# Discourse Shared Draft Button

A Discourse theme component that adds a "New Shared Draft" button in a specific category, making it easy for users to create shared drafts for collaboration.

## Features

- **Single category focus**: Only appears in the one category you configure
- **Non-intrusive design**: Hides the standard "New Topic" button and adds a separate "New Shared Draft" button
- **Simple and accessible**: Shows the shared draft button to all users who can view the category
- **Seamless integration**: Works with Discourse's built-in shared draft functionality
- **SPA-aware**: Handles Discourse's single-page app navigation automatically
- **Customizable button text**: Change the button text to match your needs
- **Smart detection**: Automatically detects the current category via URL, DOM, and meta tags
- **Composer integration**: Opens the composer in shared draft mode with the correct category pre-selected
- **Enhanced error handling**: Robust error handling with comprehensive logging

## Installation

1. Go to your Discourse Admin Panel → Customize → Themes
2. Click "Install" → "From a Git Repository"
3. Enter the repository URL: `https://github.com/dereklputnam/discourse-shared-draft-button`
4. Install as a **Theme Component** (not a full theme)
5. Add the component to your active theme

## Configuration

After installation, configure the component in Admin → Customize → Themes → [Your Theme] → Settings:

### Settings

- **Enabled Category** *(required)*: Enter the single category ID where the Shared Draft button should appear. Only one category is supported.
- **Button Text** *(optional)*: Customize the text shown on the button (default: "New Shared Draft")
- **Require Shared Drafts Enabled** *(optional)*: Only show the button when shared drafts are enabled in site settings (default: true)

## How to Find Your Category ID

1. Go to your Discourse site and navigate to the desired category
2. Look at the URL - the category ID is the number at the end
   - Example: `yoursite.com/c/category-name/123` → Category ID is `123`
3. Alternatively, go to Admin → Categories and click on the category to see its ID in the URL

## Permission System

**IMPORTANT**: This component shows the "New Shared Draft" button to all users viewing the configured category.

⚠️ **Security Note**: Discourse's shared draft functionality bypasses normal category permissions. If a user can view the category where this component is enabled, they will be able to create and edit ANY shared draft in that category, regardless of their normal create/reply permissions. Only enable this component in categories that are restricted to trusted users who should have full shared draft access.

## Requirements

- Discourse 3.0+ (uses modern plugin API)
- Shared drafts must be enabled in your Discourse settings:
  - Go to `Admin → Site Settings` and search for "shared_drafts"
  - Or visit: `yoursite.com/admin/site_settings/category/all_results?filter=shared_drafts`
  - Key settings: `shared_drafts_category` and `shared_drafts_min_trust_level`
- The configured category should have restricted visibility (only trusted users) since shared drafts bypass normal create/reply permissions

## How It Works

1. **Category Detection**: Detects when a user is viewing the specific configured category using multiple methods:
   - URL path analysis (e.g., `/c/category-name/123`)
   - DOM elements with category data attributes
   - Body class names
   - Meta tags

2. **Button Management**:
   - **In the configured category**: Hides the original "New Topic" button and inserts a new "New Shared Draft" button
   - **In other categories**: Removes the shared draft button (if present) and shows the original "New Topic" button
   - Uses completely separate buttons to avoid any interference

3. **SPA Navigation Handling**:
   - Listens for Discourse's route changes via `api.onPageChange()`
   - Re-evaluates button state with multiple retry attempts (100ms, 300ms, 600ms delays)
   - Watches DOM changes with MutationObserver for dynamic content

4. **Composer Integration**:
   - Opens the Discourse composer in shared draft mode
   - Automatically pre-selects the correct category for the new shared draft
   - Includes safety check to prevent shared draft creation in wrong categories

## Troubleshooting

### Button Not Appearing
- Check that you're viewing the correct category (match the configured category ID)
- Ensure shared drafts are enabled in Admin → Site Settings → Search "shared_drafts"
  - You can also visit: `yoursite.com/admin/site_settings/category/all_results?filter=shared_drafts`
  - Check the browser console on page load - it will log the direct link to your site's shared drafts settings
- Check browser console for debugging information

### Button Appearing in Wrong Places
- Check the "Enabled Category" setting - it should contain the exact category ID you want
- The component only supports one category at a time
- Try hard refreshing the page (Ctrl+Shift+R or Cmd+Shift+R) to clear cached JavaScript

### Button Not Updating When Navigating
- The component handles Discourse's SPA navigation automatically
- If the button doesn't update immediately, it should update within 600ms
- Check browser console for any JavaScript errors that might be blocking execution

### Composer Issues
- Verify shared drafts are properly configured in your Discourse instance
- Check that the configured category allows shared drafts
- Check browser console for detailed error messages

### Security Considerations
- Ensure the category where this component is enabled has restricted visibility
- Only users you trust to create and edit all shared drafts should be able to view the category
- Remember that shared drafts bypass normal create/reply/edit permissions

## Technical Details

This theme component:
- Uses Modern Discourse Plugin API (0.8.31+)
- Written in ES6 JavaScript with comprehensive error handling
- Leverages Discourse's container system for service access
- Uses `api.onPageChange()` to handle SPA route transitions
- Uses MutationObserver for dynamic content handling
- Creates separate button elements (`#create-shared-draft-button`) instead of modifying the original
- Hides/shows buttons using `display: none` style property
- Includes extensive debugging and logging capabilities
- Multiple retry attempts ensure button state updates reliably

## License

MIT License - see LICENSE file for details

## Support

For issues, feature requests, or contributions, please visit:
https://github.com/dereklputnam/discourse-shared-draft-button

## Changelog

### Latest Version
- **Major refactor**: Now uses separate button instead of modifying the original "New Topic" button
- Hides original button and inserts independent `#create-shared-draft-button` in configured category
- Improved SPA navigation handling with multiple retry attempts and route change detection
- Added safety checks to prevent shared draft creation in wrong categories
- Completely eliminates interference with original "New Topic" button functionality
- Better reliability when navigating between categories without full page refresh