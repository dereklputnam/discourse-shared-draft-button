# Discourse Shared Draft Button Theme Component

A Discourse theme component that adds a "New Shared Draft" button to your forum, making it easier for staff to create shared drafts without having to go through the composer dropdown menu.

## Features

- **Configurable Button Placement**: Choose where to display the button (navigation bar, topic list header, or both)
- **Category Restriction**: Limit the shared draft button to a specific category
- **Hide Standard New Topic Button**: Option to hide the regular "New Topic" button when shared draft button is shown
- **Staff-Only Access**: Restrict button visibility to staff members only
- **Customizable Button Text**: Change the button text to match your community's language
- **Automatic Composer Integration**: Opens the composer directly in shared draft mode

## Installation

1. Go to your Discourse Admin Panel → Customize → Themes
2. Click "Install" → "From a git repository"
3. Enter the repository URL: `https://github.com/dereklputnam/discourse-shared-draft-button`
4. Click "Install"
5. Enable the theme component on your active theme

## Configuration

After installation, you can configure the component through the theme settings:

### Settings

- **Enabled Category**: Enter the category ID where the button should appear. Leave empty to show on all categories.
- **Hide New Topic Button**: Hide the standard "New Topic" button when shared draft button is shown
- **Button Text**: Customize the text displayed on the button (default: "New Shared Draft")
- **Staff Only**: Only show the button to staff members (recommended: true)
- **Require Shared Drafts Enabled**: Only show when shared drafts are enabled in site settings (recommended: true)

#### Finding Category ID

To find the category ID for the settings:
1. Go to your Discourse admin panel → Categories
2. Click on a category to edit it
3. Look at the URL - the number at the end is the category ID (e.g., `/admin/customize/categories/5` means category ID is `5`)
4. Enter this single number in the "Enabled Category" setting

## Prerequisites

- Discourse version 2.8.0 or higher
- Shared drafts must be enabled in your site settings
- A shared drafts category must be configured

## How It Works

1. The component checks if the current user has permission to create shared drafts
2. It verifies that shared drafts are enabled and properly configured
3. It adds the button to the specified location(s) based on your settings
4. When clicked, it opens the composer directly in shared draft mode
5. The draft is automatically created in your configured shared drafts category

## Styling

This component uses standard Discourse button classes (`btn`, `btn-default`, `btn-primary`) and will automatically inherit your site's existing button styles. No additional CSS is included to ensure compatibility with your theme.

## Support

If you encounter any issues or have feature requests, please open an issue on the GitHub repository.

## License

MIT License - see LICENSE file for details.