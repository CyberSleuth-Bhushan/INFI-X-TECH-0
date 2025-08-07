# 🔥 Firebase Console - Admin Role Update Guide

## Step-by-Step Visual Guide

### Step 1: Access Firebase Console
1. **Open your browser** and go to: https://console.firebase.google.com/
2. **Sign in** with your Google account
3. **Select your project**: `infi-x-tech-website-1`

### Step 2: Navigate to Firestore Database
1. **Look at the left sidebar** - you'll see a menu with various options
2. **Click on "Firestore Database"** (it has a database icon)
3. **Click on the "Data" tab** at the top (should be selected by default)

### Step 3: Find the Users Collection
1. **Look for "users" collection** in the main area
   - You'll see a list of collections
   - Find the one named "users"
2. **Click on "users"** to expand it
   - This will show all user documents

### Step 4: Locate Your User Document
1. **Look for your email**: `bhushanmallick2006@gmail.com`
   - Each document will show some basic info
   - Find the document that has your email
2. **Click on the document ID** (long string of characters)
   - This opens the document details

### Step 5: Edit the Document
1. **Click the "Edit" button** (pencil icon) at the top right
2. **Find the "role" field**:
   - Look for a field named "role"
   - It probably says "participant"
   - **Change it to**: `admin`
3. **Find the "customId" field**:
   - Look for a field named "customId" 
   - **Change it to**: `LIXT-0000`
4. **Click "Update"** to save changes

## What You Should See:

### Before Changes:
```
role: "participant"
customId: "PRIXT-1234" (or similar)
```

### After Changes:
```
role: "admin"
customId: "LIXT-0000"
```

## Troubleshooting:

### Can't Find Users Collection?
- Make sure you're in the right project
- Check if any users have registered yet
- Try refreshing the page

### Can't Find Your Email?
- Make sure you've registered on the website first
- Check if you used the correct email
- Look through all documents in the users collection

### Edit Button Not Working?
- Make sure you have proper permissions
- Try refreshing the page
- Check if you're the project owner

### Changes Not Saving?
- Make sure you clicked "Update"
- Check your internet connection
- Try logging out and back into Firebase Console

## Alternative Method - Using Firebase CLI:

If the console method doesn't work, you can use Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set your project
firebase use infi-x-tech-website-1

# Use Firestore emulator or direct database access
```

## Verification:

After making changes:
1. **Go to your website**
2. **Login with**: `bhushanmallick2006@gmail.com` / `Bhushan@Admin`
3. **You should be redirected to**: `/admin-dashboard`
4. **You should see admin features** like user management, event creation, etc.

## Success Indicators:

✅ **Login redirects to admin dashboard**  
✅ **Can see "Admin Dashboard" in the interface**  
✅ **Can access user management features**  
✅ **Can create/edit events**  
✅ **Can send notifications**  

If you see all these, your admin setup is complete! 🎉

## Need Help?

If you're still having issues:
1. **Double-check the email** matches exactly
2. **Verify the role** is set to "admin" (lowercase)
3. **Clear browser cache** and try again
4. **Use the browser console script** from `create-admin.js` as an alternative

**Your admin access should now be working! 🚀**