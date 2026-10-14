# Tab Focus Aid — Chrome Extension (MV3)

This prototype preserves the bookmarklet version and adds per-origin opt-in auto-activation.

## Install
1. In Chrome open `chrome://extensions`, enable Developer mode.
2. Choose "Load unpacked" and select the repository's `extension` folder.
3. Open an HTTPS or HTTP website, click the extension icon, and choose "このサイトで有効化".
4. Permission is requested for that specific origin only. Subsequent full page loads auto-apply keyboard navigation.
5. Choose "このサイトで無効化" to turn it off.

## Architecture
`background.js` injects `tab-focus-aid.js` and clicks the "Apply" button programmatically, using the common focus logic.
The source is copied from the repository root and is checked for equality by CI.

## Limitations
- This is an unpacked extension prototype, not a Chrome Web Store release.
- Restricted pages, browser UI, Chrome Web Store pages, cross-origin iframes, and some security-sensitive sites are unsupported.
- On-page JavaScript frameworks may block untrusted programmatic click events.
- Site-specific permissions, not global always-on access, are used by design.
