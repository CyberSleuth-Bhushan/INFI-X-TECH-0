// Admin User Creation Script
// Run this in your browser console on the website to create the admin user

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Import Firebase functions (assuming they're available globally)
    const { createUserWithEmailAndPassword } = window.firebase.auth;
    const { doc, setDoc, serverTimestamp } = window.firebase.firestore;
    const { auth, db } = window.firebase;
    
    // Admin user details
    const adminEmail = 'bhushanmallick2006@gmail.com';
    const adminPassword = 'Bhushan@Admin';
    
    // Create Firebase Auth user
    const { user } = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('Firebase Auth user created:', user.uid);
    
    // Create user document in Firestore
    const adminUserData = {
      uid: user.uid,
      email: adminEmail,
      role: 'admin',
      personalDetails: {
        name: 'Bhushan Barun Mallick',
        phone: '+91-XXXXXXXXXX',
        dob: '1998-XX-XX'
      },
      educationalDetails: {
        institution: 'Your Institution',
        course: 'Computer Science',
        year: '2024'
      },
      customId: 'LIXT-0000',
      isFirstLogin: false,
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/bhushan-mallick/',
        github: 'https://github.com/CyberSleuth-Bhushan',
        twitter: 'https://x.com/BhushanMallick6',
        instagram: 'https://www.instagram.com/bhushan.98_xz_/'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', user.uid), adminUserData);
    console.log('Admin user document created in Firestore');
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('You can now login with these credentials');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('📝 User already exists. Updating role to admin...');
      
      try {
        // Get current user and update role
        const { signInWithEmailAndPassword } = window.firebase.auth;
        const { doc, updateDoc, serverTimestamp } = window.firebase.firestore;
        const { auth, db } = window.firebase;
        
        const { user } = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'admin',
          customId: 'LIXT-0000',
          personalDetails: {
            name: 'Bhushan Barun Mallick',
            phone: '+91-XXXXXXXXXX',
            dob: '1998-XX-XX'
          },
          socialLinks: {
            linkedin: 'https://www.linkedin.com/in/bhushan-mallick/',
            github: 'https://github.com/CyberSleuth-Bhushan',
            twitter: 'https://x.com/BhushanMallick6',
            instagram: 'https://www.instagram.com/bhushan.98_xz_/'
          },
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ User role updated to admin successfully!');
      } catch (updateError) {
        console.error('❌ Error updating user role:', updateError);
      }
    }
  }
}

// Run the function
createAdminUser();