# 🔑 Admin Setup Guide

## Admin Login Credentials

**Email:** `bhushanmallick2006@gmail.com`  
**Password:** `Bhushan@Admin`  
**Role:** admin  
**Custom ID:** LIXT-0000

## Setting Up Admin User

### Option 1: Manual Setup (Recommended)

1. **Register the admin user manually:**

   - Go to `/register` on your website
   - Use the email: `bhushanmallick2006@gmail.com`
   - Complete the registration process
   - The system will assign a participant role initially

2. **Update user role in Firebase Console (Step-by-Step):**

   **Step 2.1: Access Firebase Console**

   - Go to https://console.firebase.google.com/
   - Select your project: `infi-x-tech-website-1`
   - Click on "Firestore Database" in the left sidebar

   **Step 2.2: Navigate to Users Collection**

   - Click on "Data" tab if not already selected
   - Look for the "users" collection in the list
   - Click on "users" to expand it

   **Step 2.3: Find Your User Document**

   - Look for the document with email `bhushanmallick2006@gmail.com`
   - The document ID will be a long string (Firebase UID)
   - Click on that document to open it

   **Step 2.4: Edit the Document**

   - Click the "Edit" button (pencil icon) at the top
   - Find the "role" field and change its value from "participant" to "admin"
   - Find the "customId" field and change its value to "LIXT-0000"
   - Update the following fields:
     ```json
     {
       "role": "admin",
       "customId": "LIXT-0000",
       "personalDetails": {
         "name": "Bhushan Barun Mallick",
         "phone": "+91-XXXXXXXXXX",
         "dob": "1998-XX-XX"
       },
       "socialLinks": {
         "linkedin": "https://www.linkedin.com/in/bhushan-mallick/",
         "github": "https://github.com/CyberSleuth-Bhushan",
         "twitter": "https://x.com/BhushanMallick6",
         "instagram": "https://www.instagram.com/bhushan.98_xz_/"
       }
     }
     ```

   **Step 2.5: Save Changes**

   - Click "Update" button to save your changes
   - The user should now have admin access

### Option 2: Using Firebase Admin SDK (Advanced)

If you have Firebase Admin SDK set up, you can run this script:

```javascript
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./path-to-service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createAdminUser() {
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: "bhushanmallick2006@gmail.com",
      password: "Bhushan@Admin",
      displayName: "Bhushan Barun Mallick",
    });

    // Create user document in Firestore
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email: "bhushanmallick2006@gmail.com",
        role: "admin",
        personalDetails: {
          name: "Bhushan Barun Mallick",
          phone: "+91-XXXXXXXXXX",
          dob: "1998-XX-XX",
        },
        educationalDetails: {
          institution: "Your Institution",
          course: "Computer Science",
          year: "2024",
        },
        customId: "LIXT-0000",
        isFirstLogin: false,
        socialLinks: {
          linkedin: "https://www.linkedin.com/in/bhushan-mallick/",
          github: "https://github.com/CyberSleuth-Bhushan",
          twitter: "https://x.com/BhushanMallick6",
          instagram: "https://www.instagram.com/bhushan.98_xz_/",
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

createAdminUser();
```

## Testing Admin Login

1. Go to `/login` on your website
2. Enter the admin credentials:
   - Email: `bhushanmallick2006@gmail.com`
   - Password: `Bhushan@Admin`
3. You should be redirected to `/admin-dashboard`

### Option 3: Browser Console Script (Quick Setup)

1. **Open your website** in the browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Copy and paste** the contents of `create-admin.js` file
5. **Press Enter** to run the script
6. **Check the console** for success/error messages

## Security Notes

⚠️ **Important Security Recommendations:**

1. **Change the default password** immediately after first login
2. **Enable two-factor authentication** if available
3. **Use a strong, unique password** for production
4. **Regularly review user access logs**
5. **Keep Firebase security rules updated**

## Troubleshooting

### Admin Login Not Working

1. **Check Firebase Console:**

   - Verify the user exists in Authentication
   - Check the user document in Firestore
   - Ensure the role is set to "admin"

2. **Check Browser Console:**

   - Look for authentication errors
   - Verify Firebase configuration

3. **Clear Browser Cache:**
   - Clear cookies and local storage
   - Try in incognito mode

### Dashboard Not Loading

1. **Check user role** in Firestore
2. **Verify routing** in App.tsx
3. **Check console** for JavaScript errors

## Admin Features

Once logged in as admin, you can:

- ✅ **Manage Events** - Create, edit, delete events
- ✅ **User Management** - Add members, view participants
- ✅ **Send Notifications** - Broadcast messages to users
- ✅ **View Analytics** - Dashboard statistics
- ✅ **Download Reports** - Export participant data

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify Firebase configuration
3. Ensure all environment variables are set
4. Check network connectivity

**Your admin account is now ready! 🚀**
