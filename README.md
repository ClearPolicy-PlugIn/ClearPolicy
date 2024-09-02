
# ClearPolicy Chrome Extension

ClearPolicy is a lightweight Chrome extension that automatically detects privacy policies on websites and provides a simplified summary using the Claude.ai. The extension enhances user experience by helping users quickly understand what they're agreeing to when signing up for online services.

## Features

- **Automatic Detection**: Instantly detects when a privacy policy is present on a web page.
- **Simplified Summaries**: Provides a clear and concise summary of the privacy policy using CloudAI.
- **Seamless Integration**: The summary is displayed in a clean, user-friendly popup within the browser.

## Installation

### From Source

1. **Clone the Repository**

   Clone this repository to your local machine:

   ```bash
   git clone https://github.com/ClearPolicy-PlugIn/ClearPolicy.git

   cd ClearPolicy
   ```

2. **Load the Extension in Chrome**

   1. Open Chrome and go to `chrome://extensions/`.
   2. Enable "Developer mode" in the top right corner.
   3. Click on "Load unpacked" and select the `ClearPolicy` directory.

3. **You're All Set!**

   The ClearPolicy extension should now be active in your Chrome browser. You should see the ClearPolicy icon in your Chrome toolbar.

## Usage

1. **Browse the Web**: Simply navigate to any website with a privacy policy.
2. **Automatic Detection**: When a privacy policy is detected, the ClearPolicy icon will activate, and a popup will appear.
3. **View Summary**: Click on the ClearPolicy icon to view a simplified summary of the privacy policy.

## Development

### Prerequisites

- **Node.js**: Make sure you have Node.js installed on your machine.

### Setting Up the Project

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Load the Extension**

   Follow the steps in the "Installation" section to load the extension in Chrome for local development and testing.

### Project Structure

```plaintext
ClearPolicy/
│
├── .gitignore            # Ignored files for Git
├── manifest.json         # Chrome extension configuration
├── background.js         # Background script
├── content.js            # Content script
├── popup.html            # Popup HTML
├── popup.js              # Popup JS
├── popup.css             # Popup CSS
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── utils/
    └── api.js            # CloudAI interaction script
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.