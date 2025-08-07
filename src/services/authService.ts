import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

// Custom error types
export interface AuthServiceError {
  code: string;
  message: string;
}

// Generate unique ID locally (free version)
const generateUniqueId = async (role: 'participant' | 'member' | 'admin' | 'manager'): Promise<string> => {
  let prefix = 'PRIXT'; // default for participant
  
  switch (role) {
    case 'participant':
      prefix = 'PRIXT';
      break;
    case 'member':
      prefix = 'MIXT';
      break;
    case 'admin':
      prefix = 'LIXT';
      break;
    case 'manager':
      prefix = 'XMIXT';
      break;
  }
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const customId = `${prefix}-${randomNum}`;
  return customId;
};

// Export the function for use in other components
export const generateCustomId = generateUniqueId;

// Register a new participant
export const registerParticipant = async (
  email: string,
  password: string,
  personalDetails: {
    name: string;
    phone: string;
    dob: string;
  },
  educationalDetails: {
    institution: string;
    course: string;
    year: string;
  }
): Promise<User> => {
  try {
    // Validate input
    if (!email || !password || !personalDetails.name) {
      throw new Error('Missing required fields');
    }
    
    // Create Firebase Auth user
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Generate unique participant ID
    const customId = await generateUniqueId('participant');
    
    // Create user document in Firestore
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      role: 'participant',
      personalDetails,
      educationalDetails,
      customId,
      isFirstLogin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return newUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login time
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Google Sign In
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const { user } = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document for Google sign-in
      const customId = await generateUniqueId('participant');
      
      const newUser: User = {
        uid: user.uid,
        email: user.email!,
        role: 'participant',
        personalDetails: {
          name: user.displayName || '',
          phone: '',
          dob: ''
        },
        educationalDetails: {
          institution: '',
          course: '',
          year: ''
        },
        customId,
        isFirstLogin: true,
        profilePhotoUrl: user.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Update user password (for first-time login)
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    await updatePassword(auth.currentUser, newPassword);
    
    // Update isFirstLogin flag
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      isFirstLogin: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Password update error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

// Create member (simplified for free version)
export const createMember = async (
  email: string,
  personalDetails: {
    name: string;
    phone: string;
    dob: string;
  }
): Promise<{ user: User; temporaryPassword: string }> => {
  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Create Firebase Auth user
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
    
    // Generate unique member ID
    const customId = await generateUniqueId('member');
    
    // Create user document in Firestore
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      role: 'member',
      personalDetails,
      educationalDetails: {
        institution: '',
        course: '',
        year: ''
      },
      customId,
      isFirstLogin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { user: newUser, temporaryPassword };
  } catch (error) {
    console.error('Member creation error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// Generate temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Handle authentication errors
const handleAuthError = (error: AuthError): AuthServiceError => {
  let message = 'An unexpected error occurred';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email address is already registered';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address';
      break;
    case 'auth/operation-not-allowed':
      message = 'Email/password accounts are not enabled';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email address';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed login attempts. Please try again later';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your connection';
      break;
    default:
      message = error.message || 'Authentication failed';
  }
  
  return {
    code: error.code,
    message
  };
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

// Create admin user (for initial setup)
export const createAdminUser = async (
  email: string,
  password: string,
  personalDetails: {
    name: string;
    phone: string;
    dob: string;
  }
): Promise<User> => {
  try {
    console.log('Creating admin user...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Generate custom ID for admin
    const customId = await generateUniqueId('admin');

    // Create user document in Firestore
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      role: 'admin',
      personalDetails,
      educationalDetails: {
        institution: 'INFI X TECH',
        course: 'Administration',
        year: '2024'
      },
      customId,
      isFirstLogin: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    console.log('Admin user created successfully:', userData);
    return userData;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};