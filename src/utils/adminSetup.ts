import { createAdminUser } from '../services/authService';

// Utility function to create admin user
// This can be called from browser console for initial setup
export const setupAdmin = async () => {
  try {
    const adminData = {
      email: 'admin@infixttech.com',
      password: 'admin123456',
      personalDetails: {
        name: 'Admin User',
        phone: '+91-1234567890',
        dob: '1990-01-01'
      }
    };

    console.log('Creating admin user...');
    const admin = await createAdminUser(
      adminData.email,
      adminData.password,
      adminData.personalDetails
    );
    
    console.log('Admin user created successfully:', admin);
    return admin;
  } catch (error) {
    console.error('Failed to create admin user:', error);
    throw error;
  }
};

// Make it available globally for console access
(window as any).setupAdmin = setupAdmin;

export default setupAdmin;