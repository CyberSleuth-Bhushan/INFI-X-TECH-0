# Firebase Setup Guide

This guide will help you set up Firebase for the INFI X TECH website.

## Prerequisites

- Node.js 16+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `infi-x-tech-website`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firebase Services

### Authentication
1. Go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Save changes

### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll deploy security rules later)
4. Select your preferred location
5. Click "Done"

### Cloud Storage
1. Go to Storage
2. Click "Get started"
3. Choose "Start in test mode"
4. Select the same location as Firestore
5. Click "Done"

### Cloud Functions
1. Go to Functions
2. Click "Get started"
3. Upgrade to Blaze plan (required for Cloud Functions)
   - Don't worry, it's still free for the usage limits we need
4. Click "Continue"

## Step 3: Configure Web App

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname: `infi-x-tech-website`
5. Check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 4: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

## Step 5: Initialize Firebase CLI

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Initialize Firebase in your project:
   ```bash
   firebase init
   ```

3. Select the following features:
   - Firestore
   - Functions
   - Hosting
   - Storage

4. Choose your existing project
5. Accept default settings for most options
6. When asked about the public directory, enter: `build`
7. Configure as single-page app: Yes
8. Set up automatic builds and deploys with GitHub: No (for now)

## Step 6: Deploy Security Rules

1. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Deploy Storage rules:
   ```bash
   firebase deploy --only storage
   ```

## Step 7: Set Up Cloud Functions

1. Navigate to functions directory:
   ```bash
   cd functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and deploy functions:
   ```bash
   npm run build
   cd ..
   firebase deploy --only functions
   ```

## Step 8: Test the Setup

1. Start the development server:
   ```bash
   npm start
   ```

2. The app should load without Firebase configuration errors
3. Check the browser console for any connection issues

## Step 9: Create Admin User (Optional)

You can create the admin user manually in the Firebase Console:

1. Go to Authentication > Users
2. Click "Add user"
3. Enter admin email and password
4. Go to Firestore Database
5. Create a document in the `users` collection with the admin's UID
6. Set the document data according to the User interface in `src/types/index.ts`

## Security Notes

- Never commit your `.env` file to version control
- The Firebase configuration in `.env` contains sensitive information
- Security rules are already configured to protect your data
- Only authenticated users can access protected resources
- Admin functions require admin role verification

## Troubleshooting

### Common Issues

1. **"Firebase configuration not found"**
   - Check that all environment variables are set in `.env`
   - Restart the development server after changing `.env`

2. **"Permission denied" errors**
   - Ensure security rules are deployed
   - Check that users have the correct roles in Firestore

3. **Cloud Functions not working**
   - Ensure you're on the Blaze plan
   - Check function logs: `firebase functions:log`

4. **CORS errors**
   - This is normal in development
   - Deploy to Firebase Hosting to resolve

### Getting Help

- Check Firebase Console for error messages
- Review browser console for client-side errors
- Use Firebase emulators for local development:
  ```bash
  firebase emulators:start
  ```

## Next Steps

After completing this setup:
1. Test user registration and login
2. Verify that security rules are working
3. Test file uploads to Storage
4. Deploy to Firebase Hosting when ready

Your Firebase backend is now ready for the INFI X TECH website!