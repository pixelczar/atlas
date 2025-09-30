# 🔥 Firebase Setup Instructions

## Current Error
`Firebase: Error (auth/invalid-api-key)` - Your API key is not valid or Firebase services aren't enabled.

## Quick Fix Steps

### 1. Get Fresh Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/project/atlas-4dbd8/settings/general)
2. Scroll down to "Your apps" section
3. If you see a web app (</> icon):
   - Click on it
   - Copy the `firebaseConfig` object
4. If you DON'T see a web app:
   - Click "Add app" button
   - Select Web (</> icon)
   - Give it a nickname: "Atlas Web"
   - Click "Register app"
   - Copy the `firebaseConfig` that appears

### 2. Update Your `.env.local`

Replace the values in `/Users/will/projects/atlas/env.local` with the config from step 1:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...YourActualKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=atlas-4dbd8.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=atlas-4dbd8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=atlas-4dbd8.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=456002729199
NEXT_PUBLIC_FIREBASE_APP_ID=1:456002729199:web:abc123...
```

### 3. Enable Firebase Services

#### Authentication
1. Go to [Authentication](https://console.firebase.google.com/project/atlas-4dbd8/authentication/providers)
2. Click "Get started" (if first time)
3. Click "Google" provider
4. Toggle "Enable"
5. Add your email as test user
6. Save

#### Firestore Database
1. Go to [Firestore](https://console.firebase.google.com/project/atlas-4dbd8/firestore)
2. Click "Create database"
3. Choose "Start in **test mode**" (for development)
4. Select a location (e.g., us-central)
5. Click "Enable"

#### Storage
1. Go to [Storage](https://console.firebase.google.com/project/atlas-4dbd8/storage)
2. Click "Get started"
3. Choose "Start in **test mode**" (for development)
4. Click "Next" → "Done"

### 4. Restart Dev Server

After updating `.env.local`:

```bash
# Kill the server
lsof -ti:3000 | xargs kill -9

# Start fresh
npm run dev
```

## Troubleshooting

### If API Key Still Invalid:
- Make sure you copied the ENTIRE key (starts with `AIza`)
- Check for extra spaces or line breaks
- Try deleting the web app in Firebase Console and creating a new one

### If Services Not Working:
- Make sure Firestore is in "test mode" (not production mode)
- Check Firebase Console for any quota/billing issues
- Verify your Google Cloud project is active

## Test When Working:
1. Go to http://localhost:3000/canvas
2. Enter a URL in the input field
3. Click "Add" - should save to Firestore without errors
4. Check Firestore Console to see the new document

---

**Current Config Location:** `/Users/will/projects/atlas/env.local`
