# Gold Price Extension

This is a Chrome extension that displays the current price of gold directly on the extension icon.

## Features

*   Displays the current price of gold.
*   Updates automatically at regular intervals.

## Installation

1.  Clone this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle switch in the top-right corner.
4.  Click the "Load unpacked" button.
5.  Select the directory where you cloned the repository.

## Usage

Once installed, the extension's icon will display the current gold price. Hovering over the icon will show the title "Gold Price".

## Technical Details

*   **Manifest Version:** 3
*   **Name:** Gold Price Extension
*   **Version:** 1.0
*   **Description:** A Chrome extension that displays the current price of gold on the icon.
*   **Icons:** `icon16.png`, `icon48.png`, `icon128.png`
*   **Action:**
    *   `default_icon`: `icon48.png`
    *   `default_title`: "Gold Price"
*   **Permissions:** `storage`, `alarms`
*   **Host Permissions:** `https://api.gold-api.com/*`
*   **Background Service Worker:** `background.js`

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)