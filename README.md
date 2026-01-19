# GitHub Enhancer Extension

A Chrome extension that enhances GitHub conversation pages (issues and pull requests) with helpful tooltips for various elements.

## Features

- **Informative Tooltips**: Hover over elements like labels, assignees, reviewers, status badges, and more to see helpful information
- **Clean Interface**: Non-intrusive tooltips that appear on hover
- **Smart Positioning**: Tooltips automatically position themselves to stay within the viewport
- **Dynamic Content Support**: Works with dynamically loaded content on GitHub pages

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension directory

## Usage

Once installed, simply navigate to any GitHub issue or pull request page. Hover over various elements to see helpful tooltips:

- **Author names**: Shows who created the issue/PR
- **Labels**: Displays label information
- **Assignees**: Shows assigned users
- **Reviewers**: Displays PR reviewers
- **Status badges**: Shows current state information
- **And more**: Many other UI elements throughout the conversation page

## Supported Pages

- GitHub Issue pages: `https://github.com/*/issues/*`
- GitHub Pull Request pages: `https://github.com/*/pull/*`

## Technical Details

- **Manifest Version**: 3
- **Permissions**: No special permissions required
- **Content Scripts**: Automatically injected on GitHub conversation pages
- **Styling**: Custom CSS with smooth animations

## Development

The extension consists of:

- `manifest.json`: Extension configuration
- `content.js`: Main content script that adds tooltip functionality
- `styles.css`: Styling for tooltips
- `icons/`: Extension icons (16x16, 48x48, 128x128)

## License

MIT License