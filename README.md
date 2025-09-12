# Distance Measurement Browser Extension

A Chrome/Edge extension that measures distances between HTML elements on web pages with visual overlays and keyboard shortcuts.

## Features

- **Visual Element Selection**: Click to select elements with colored outlines
- **Crosshair Cursor**: Small crosshair follows your mouse for precise targeting
- **Edge-to-Edge Measurements**: Shows both horizontal and vertical distances between elements
- **Persistent Measurements**: Multiple measurements remain visible until cleared
- **Keyboard Shortcuts**: Quick restart and stop controls
- **Auto-Injection**: Works on most web pages automatically

## Installation

1. Download or clone this repository
2. Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

## Usage

### Basic Measurement
1. Click the extension icon to open the popup
2. Click "Start measuring" to activate measurement mode
3. Click on the first element (green outline appears)
4. Click on the second element (yellow outline appears)
5. Horizontal and vertical distance lines appear with pixel measurements

### Keyboard Shortcuts
- **R**: Restart measurement (clears all previous measurements and starts fresh)
- **ESC**: Stop measuring and clear all overlays

### Visual Elements
- **Blue highlight**: Hover preview of target element
- **Green outline**: First selected element
- **Yellow outline**: Second selected element
- **Red line**: Horizontal distance measurement
- **Green line**: Vertical distance measurement
- **Black labels**: Distance values in pixels
- **Small crosshair**: Follows cursor for precise targeting

## How It Works

The extension calculates edge-to-edge distances between elements:
- **Horizontal distance**: Between the nearest left/right edges
- **Vertical distance**: Between the nearest top/bottom edges
- **Overlapping elements**: Shows 0px for overlapping dimensions

## File Structure

```
calculate-distance/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── content.js             # Main measurement logic
├── background.js          # Service worker
├── style.css              # Popup styling
├── icon.jpg               # Extension icon
└── README.md              # This file
```

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Manifest V3)
- Other Chromium-based browsers

## Limitations

- Does not work on restricted pages (chrome://, edge://, about:, chrome-extension://)
- Requires user interaction to inject content scripts on some sites
- Measurements are in CSS pixels, not physical units

## Troubleshooting

### "Unable to communicate with page" Error
- Refresh the target page and try again
- The extension will auto-inject the content script if needed
- Some pages may block extension scripts

### Keyboard Shortcuts Not Working
- Ensure you're not typing in input fields
- Try clicking on the page background first
- Some sites may capture keyboard events

### Measurements Not Appearing
- Make sure you've selected two different elements
- Check that elements are not completely overlapping
- Try refreshing the page and restarting measurement

## Development

To modify the extension:

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Key Files to Modify
- `content.js`: Main measurement logic and visual overlays
- `popup.js`: User interface and messaging
- `manifest.json`: Permissions and configuration

## License

This project is open source. See LICENSE file for details.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.