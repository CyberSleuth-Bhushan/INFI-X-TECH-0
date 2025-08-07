import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, ActivityLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            ...userData,
            uid: userDoc.id,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          } as User);
        } else {
          setMessage('User not found');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setMessage('Error loading user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleStatusToggle = async () => {
    if (!user || !currentUser) return;

    setUpdating(true);
    setMessage('');

    try {
      const newStatus = !user.isActive;
      await updateDoc(doc(db, 'users', user.uid), {
        isActive: newStatus,
        updatedAt: new Date()
      });

      // Log activity
      const activityLog: Partial<ActivityLog> = {
        userId: currentUser.uid,
        userName: currentUser.personalDetails.name,
        userRole: currentUser.role,
        action: 'update',
        resourceType: 'user',
        resourceId: user.uid,
        timestamp: new Date(),
        description: `${newStatus ? 'Activated' : 'Deactivated'} user: ${user.personalDetails.name}`
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      setUser(prev => prev ? { ...prev, isActive: newStatus } : null);
      setMessage(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage('Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-600';
      case 'manager':
        return 'bg-blue-100 text-blue-600';
      case 'member':
        return 'bg-green-100 text-green-600';
      case 'participant':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
        <p className="text-gray-600 mb-6">The requested user profile could not be found.</p>
        <button
          onClick={() => navigate('/admin-dashboard/users')}
          className="btn-primary"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin-dashboard/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600">View and manage user information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
          
          <button
            onClick={handleStatusToggle}
            disabled={updating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              user.isActive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {updating ? 'Updating...' : (user.isActive ? 'Deactivate' : 'Activate')}
          </button>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {user.personalDetails.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {user.personalDetails.name}
            </h3>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium text-sm">{user.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-sm">{user.updatedAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Custom ID</span>
                <span className="font-medium">{user.customId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">First Login</span>
                <span className="font-medium">{user.isFirstLogin ? 'Pending' : 'Completed'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detailed Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.personalDetails.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.personalDetails.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.personalDetails.dob || 'Not provided'}</p>
              </div>
            </div>
            {user.personalDetails.bio && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.personalDetails.bio}</p>
              </div>
            )}
          </div>

          {/* Educational Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Educational Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.educationalDetails.institution || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.educationalDetails.course || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{user.educationalDetails.year || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                {user.socialLinks?.linkedin ? (
                  <a 
                    href={user.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded-lg block truncate transition-colors"
                  >
                    {user.socialLinks.linkedin}
                  </a>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded-lg">Not provided</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                {user.socialLinks?.github ? (
                  <a 
                    href={user.socialLinks.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded-lg block truncate transition-colors"
                  >
                    {user.socialLinks.github}
                  </a>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded-lg">Not provided</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                {user.socialLinks?.twitter ? (
                  <a 
                    href={user.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded-lg block truncate transition-colors"
                  >
                    {user.socialLinks.twitter}
                  </a>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded-lg">Not provided</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                {user.socialLinks?.instagram ? (
                  <a 
                    href={user.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded-lg block truncate transition-colors"
                  >
                    {user.socialLinks.instagram}
                  </a>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded-lg">Not provided</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                {user.socialLinks?.portfolio ? (
                  <a 
                    href={user.socialLinks.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 bg-gray-50 p-3 rounded-lg block truncate transition-colors"
                  >
                    {user.socialLinks.portfolio}
                  </a>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded-lg">Not provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{formatDate(user.updatedAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <p className={`p-3 rounded-lg font-medium ${
                  user.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Setup</label>
                <p className={`p-3 rounded-lg font-medium ${
                  !user.isFirstLogin ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {!user.isFirstLogin ? 'Completed' : 'Pending First Login'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfile;