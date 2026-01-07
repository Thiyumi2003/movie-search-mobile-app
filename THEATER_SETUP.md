# Google Places API Setup for Theater Finder Feature

## Overview
The Theater Finder feature uses Google Places API to locate nearby movie theaters based on your GPS location.

## Setup Instructions

### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 2. Configure the API Key

Open `utils/locationService.js` and replace the placeholder:

```javascript
const GOOGLE_PLACES_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual key
```

### 3. Secure Your API Key (Optional but Recommended)

**For production apps:**

1. Restrict your API key in Google Cloud Console:
   - Go to "APIs & Services" > "Credentials"
   - Click on your API key
   - Under "Application restrictions", select:
     - **Android apps**: Add your package name and SHA-1 certificate fingerprint
     - **iOS apps**: Add your bundle identifier
   - Under "API restrictions", select "Restrict key" and choose "Places API"

2. Use environment variables:
   ```bash
   npm install react-native-dotenv
   ```
   
   Create `.env` file:
   ```
   GOOGLE_PLACES_API_KEY=your_key_here
   ```

### 4. Free Tier Limits

Google Places API includes:
- **$200 free credit per month**
- Nearby Search: $32 per 1,000 requests (first request free)
- This allows ~6,250 free searches per month

### 5. Test the Feature

1. Restart your Expo app:
   ```bash
   npx expo start --clear
   ```

2. Grant location permissions when prompted

3. Search for a movie and tap "🎬 Find Theaters"

## Without API Key

The app will work but show an error message when trying to find theaters. All other features (search, favorites, categories) work independently.

## Privacy Note

- Location data is only used when the user taps "Find Theaters"
- Location is never stored or sent to external servers
- Only theater information from Google Places is retrieved

## Troubleshooting

### "API key is invalid" error
- Verify the key is correctly copied
- Ensure Places API is enabled in Google Cloud Console
- Check that there are no leading/trailing spaces in the key

### No theaters found
- Check location permissions are granted
- Ensure GPS/location services are enabled on device
- Try increasing the radius in `locationService.js` (default: 20km)

### Map not displaying
- Ensure you have an internet connection
- Check that react-native-maps is properly installed
- On iOS, location permissions must be granted

## Alternative APIs (Free Options)

If you prefer not to use Google Places API, you can replace with:

1. **OpenStreetMap Overpass API** (Free, no key required)
2. **Foursquare Places API** (100,000 calls/day free tier)
3. **Here Places API** (250,000 transactions/month free)

Update the `findNearbyTheaters` function in `utils/locationService.js` to use your preferred API.
