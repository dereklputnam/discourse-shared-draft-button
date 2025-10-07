# Discourse Shared Draft Button

A Discourse theme component that replaces the standard "New Topic" button with a "New Shared Draft" button in a specific category, making it easy for authorized users to create shared drafts for collaboration.

## Features

- **Single category focus**: Only appears in the one category you configure
- **Permission-aware**: Respects Discourse's existing category permissions
- **Seamless integration**: Works with Discourse's built-in shared draft functionality
- **Customizable button text**: Change the button text to match your needs
- **Smart detection**: Automatically detects the current category and applies restrictions
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
- **Allowed Groups** *(optional)*: Enter group names separated by commas (e.g. `staff,product_marketing,support_team`). Leave empty to show for all users who can create topics in the category.
- **Require Shared Drafts Enabled** *(optional)*: Only show the button when shared drafts are enabled in site settings (default: true)

## How to Find Your Category ID

1. Go to your Discourse site and navigate to the desired category
2. Look at the URL - the category ID is the number at the end
   - Example: `yoursite.com/c/category-name/123` → Category ID is `123`
3. Alternatively, go to Admin → Categories and click on the category to see its ID in the URL

## Permission System

The component uses a dual permission system:

- **Group Restrictions** *(optional)*: If configured, only users in the specified groups can see the button
- **Category Permissions**: Users must also be able to create topics in the configured category
- **Flexible Configuration**: You can use group restrictions for fine-grained control, or rely purely on category permissions

## Requirements

- Discourse 3.0+ (uses modern plugin API)
- Shared drafts must be enabled in your Discourse settings
- Users must have topic creation permissions in the target category

## How It Works

1. **Category Detection**: Detects when a user is viewing the specific configured category using multiple methods (URL, DOM elements, CSS classes)
2. **Group Check**: Verifies the user is in allowed groups (if groups are specified)
3. **Permission Check**: Verifies the user can create topics in the configured category
4. **Button Override**: Replaces the "New Topic" button text and click behavior
5. **Composer Integration**: Opens the Discourse composer in shared draft mode
6. **Category Pre-selection**: Automatically selects the correct category for the new shared draft

## Troubleshooting

### Button Not Appearing
- Check that you're viewing the correct category (match the configured category ID)
- Verify you have permission to create topics in that category
- Ensure shared drafts are enabled in Admin → Settings → Features
- Check browser console for debugging information

### Button Appearing in Wrong Places
- Check the "Enabled Category" setting - it should contain the exact category ID you want
- The component only supports one category at a time

### Permission Issues
- The component uses Discourse's category permission system
- If users can't see the button, check Admin → Categories → [Your Category] → Security
- Add the appropriate groups to the category with "Create / Reply / See" permissions

### Composer Issues
- Verify shared drafts are properly configured in your Discourse instance
- Check that the configured category allows shared drafts
- Ensure the category allows topic creation for the user
- Check browser console for detailed error messages

## Technical Details

This theme component:
- Uses Modern Discourse Plugin API (0.8.31+)
- Written in ES6 JavaScript with comprehensive error handling
- Leverages Discourse's container system for service access
- Uses MutationObserver for dynamic content handling
- Includes extensive debugging and logging capabilities

## License

MIT License - see LICENSE file for details

## Support

For issues, feature requests, or contributions, please visit:
https://github.com/dereklputnam/discourse-shared-draft-button

## Changelog

### Latest Version
- Simplified permission system to use Discourse's category permissions
- Removed unused "hide new topic button" setting
- Enhanced error handling and logging
- Improved category detection with multiple fallback methods
- Better composer integration with category pre-selection