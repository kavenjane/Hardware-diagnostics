Ban Gaya Project

## Mobile PWA

You can use the frontend like a mobile app by adding it to your home screen.

### Install on Android (Chrome)

1. Open the app URL in Chrome
2. Tap the menu (⋮)
3. Select **Add to Home screen**
4. Confirm to install the app icon

### Install on iPhone (Safari)

1. Open the app URL in Safari
2. Tap the **Share** button
3. Select **Add to Home Screen**
4. Tap **Add**

### Notes

- Home-screen install works as a PWA-style shortcut experience.
- Full offline support requires service worker and web manifest configuration (not yet enabled in this repo).

### Scanning (Google Vision API + Gemini API)

In Mobile PWA mode, scanning can follow this flow:

1. Capture/upload image from device camera or gallery
2. OCR text extraction using **Google Vision API**
3. Text understanding and summarization using **Gemini API**
4. Show structured insights in the app UI

Backend setup requirement:

- Configure Google Vision and Gemini API keys securely on backend environment variables before enabling scan endpoints.
