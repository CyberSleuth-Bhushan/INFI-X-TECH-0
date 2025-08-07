import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

// Initialize Firestore collections with proper structure
export const initializeFirestore = async () => {
  try {
    console.log('Initializing Firestore collections...');
    
    // Create admin user if it doesn't exist
    await createAdminUser();
    
    // Create sample data for development (optional)
    if (process.env.NODE_ENV === 'development') {
      await createSampleData();
    }
    
    console.log('Firestore initialization completed');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
};

// Create the admin user (Bhushan)
const createAdminUser = async () => {
  const adminId = 'admin-bhushan'; // Fixed ID for admin
  const adminRef = doc(db, 'users', adminId);
  
  try {
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      const adminUser: User = {
        uid: adminId,
        email: 'admin@infixttech.com', // Replace with actual admin email
        role: 'admin',
        personalDetails: {
          name: 'Bhushan Mallick',
          phone: '+91-XXXXXXXXXX', // Replace with actual phone
          dob: '1998-XX-XX' // Replace with actual DOB
        },
        educationalDetails: {
          institution: 'Your Institution',
          course: 'Computer Science',
          year: '2024'
        },
        customId: 'LIXT-0000',
        isFirstLogin: false,
        profilePhotoUrl: '/assets/images/Bhushan.jpg',
        socialLinks: {
          linkedin: 'https://www.linkedin.com/in/bhushan-mallick/',
          github: 'https://github.com/CyberSleuth-Bhushan',
          twitter: 'https://x.com/BhushanMallick6',
          instagram: 'https://www.instagram.com/bhushan.98_xz_/'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(adminRef, adminUser);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Create sample data for development
const createSampleData = async () => {
  try {
    // Sample event
    const eventRef = doc(collection(db, 'events'));
    const sampleEvent = {
      eventName: 'INFI X TECH Hackathon 2025',
      description: 'Join us for an exciting 48-hour hackathon where innovation meets technology. Build amazing projects, learn new skills, and compete for exciting prizes!',
      eligibility: ['Computer Science Students', 'Engineering Students', 'Tech Enthusiasts'],
      fees: 0, // Free event
      startDate: new Date('2025-03-15T09:00:00'),
      endDate: new Date('2025-03-17T18:00:00'),
      status: 'upcoming',
      schedule: [
        {
          title: 'Registration & Welcome',
          time: '09:00 AM',
          location: 'Main Auditorium'
        },
        {
          title: 'Opening Ceremony',
          time: '10:00 AM',
          location: 'Main Auditorium'
        },
        {
          title: 'Hacking Begins',
          time: '11:00 AM',
          location: 'Development Labs'
        },
        {
          title: 'Final Presentations',
          time: '04:00 PM',
          location: 'Main Auditorium'
        }
      ],
      requirements: ['Laptop', 'Student ID', 'Enthusiasm to learn'],
      createdAt: new Date()
    };
    
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) {
      await setDoc(eventRef, sampleEvent);
      console.log('Sample event created');
    }
    
    // Sample notification
    const notificationRef = doc(collection(db, 'notifications'));
    const sampleNotification = {
      message: 'Welcome to INFI X TECH! Get ready for an amazing journey of innovation and technology.',
      targetRoles: ['member'],
      createdAt: new Date()
    };
    
    const notificationDoc = await getDoc(notificationRef);
    if (!notificationDoc.exists()) {
      await setDoc(notificationRef, sampleNotification);
      console.log('Sample notification created');
    }
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Collection references for easy access
export const collections = {
  users: collection(db, 'users'),
  events: collection(db, 'events'),
  registrations: collection(db, 'registrations'),
  notifications: collection(db, 'notifications')
};

// Helper function to get user document reference
export const getUserRef = (userId: string) => doc(db, 'users', userId);

// Helper function to get event document reference
export const getEventRef = (eventId: string) => doc(db, 'events', eventId);

// Helper function to get registration document reference
export const getRegistrationRef = (registrationId: string) => doc(db, 'registrations', registrationId);

// Helper function to get notification document reference
export const getNotificationRef = (notificationId: string) => doc(db, 'notifications', notificationId);