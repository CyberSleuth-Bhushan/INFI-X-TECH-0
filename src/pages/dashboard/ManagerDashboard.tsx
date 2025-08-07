import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Update, ActivityLog, Notification } from '../../types';
import { useForm } from 'react-hook-form';
import TeamChat from '../../components/dashboard/TeamChat';

// Manager Dashboard Components
const ManagerOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUpdates: 0,
    publishedUpdates: 0,
    draftUpdates: 0,
    totalEvents: 0
  });

  useEffect(() => {
    // Fetch stats - placeholder for now
    setStats({
      totalUpdates: 12,
      publishedUpdates: 8,
      draftUpdates: 4,
      totalEvents: 5
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Manager Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Updates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUpdates}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publishedUpdates}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draftUpdates}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/manager-dashboard/updates/create"
            className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <p className="font-medium text-gray-900">Create Update</p>
              <p className="text-sm text-gray-600">Add new blog, photo, or video</p>
            </div>
          </Link>

          <Link
            to="/manager-dashboard/events"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <p className="font-medium text-gray-900">Manage Events</p>
              <p className="text-sm text-gray-600">Edit event details</p>
            </div>
          </Link>

          <Link
            to="/manager-dashboard/updates"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl mr-3">📋</span>
            <div>
              <p className="font-medium text-gray-900">View Updates</p>
              <p className="text-sm text-gray-600">Manage all updates</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const ManageUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch updates - placeholder for now
    const sampleUpdates: Update[] = [
      {
        id: '1',
        title: 'INFI X TECH Hackathon 2024 - Grand Success!',
        content: 'Our recent hackathon was a tremendous success...',
        type: 'event-update',
        authorId: 'manager-1',
        authorName: 'Manager',
        status: 'published',
        tags: ['hackathon', 'success'],
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date()
      }
    ];
    setUpdates(sampleUpdates);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Updates</h2>
        <Link
          to="/manager-dashboard/updates/create"
          className="btn-primary"
        >
          Create New Update
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {updates.map((update) => (
                <tr key={update.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{update.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {update.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      update.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {update.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {update.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      Edit
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      {update.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CreateUpdate: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'blog' as 'blog' | 'photo' | 'video' | 'event-update',
    mediaUrls: [''],
    tags: '',
    status: 'draft' as 'draft' | 'published'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData: Partial<Update> = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        mediaUrls: formData.mediaUrls.filter(url => url.trim() !== ''),
        authorId: user?.uid || '',
        authorName: user?.personalDetails.name || '',
        status: formData.status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (formData.status === 'published') {
        updateData.publishedAt = new Date();
      }

      // Add to Firestore
      await addDoc(collection(db, 'updates'), updateData);

      // Log activity
      const activityLog: Partial<ActivityLog> = {
        userId: user?.uid || '',
        userName: user?.personalDetails.name || '',
        userRole: user?.role || '',
        action: 'create',
        resourceType: 'update',
        resourceId: 'new-update',
        timestamp: new Date(),
        description: `Created new ${formData.type}: ${formData.title}`
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      alert('Update created successfully!');
      setFormData({
        title: '',
        content: '',
        type: 'blog',
        mediaUrls: [''],
        tags: '',
        status: 'draft'
      });
    } catch (error) {
      console.error('Error creating update:', error);
      alert('Failed to create update. Please try again.');
    }
  };

  const addMediaUrl = () => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, '']
    }));
  };

  const updateMediaUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const removeMediaUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create New Update</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="input-field"
          >
            <option value="blog">Blog Post</option>
            <option value="photo">Photo Gallery</option>
            <option value="video">Video</option>
            <option value="event-update">Event Update</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media URLs (Google Drive Links)
          </label>
          {formData.mediaUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateMediaUrl(index, e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="input-field flex-1"
              />
              {formData.mediaUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMediaUrl(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMediaUrl}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            + Add Media URL
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="hackathon, technology, innovation"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="input-field"
          >
            <option value="draft">Save as Draft</option>
            <option value="published">Publish Now</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            {formData.status === 'published' ? 'Publish Update' : 'Save Draft'}
          </button>
          <Link to="/manager-dashboard/updates" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

// Manager Notifications Component
const ManagerNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData = notificationsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        .filter((notification: any) => 
          notification.targetRoles?.includes('manager') || 
          notification.targetRoles?.includes('all')
        ) as Notification[];
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <p className="text-gray-600">Stay updated with important announcements</p>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
                      📢 Announcement
                    </span>
                    <span className="text-sm text-gray-500">
                      {notification.createdAt.toLocaleDateString()} at {notification.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{notification.message}</p>
                  <p className="text-sm text-gray-500">
                    Sent to: {Array.isArray(notification.targetRoles) ? notification.targetRoles.join(', ') : notification.targetRoles}
                  </p>
                </div>
                <div className="ml-4">
                  <span className="text-green-600 text-sm font-medium">✓ Delivered</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No notifications yet
          </h3>
          <p className="text-gray-600">
            You'll see important announcements and updates here.
          </p>
        </div>
      )}
    </div>
  );
};

// Manager Profile Component
const ManagerProfile: React.FC = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.personalDetails.name || '',
    phone: user?.personalDetails.phone || '',
    dob: user?.personalDetails.dob || '',
    institution: user?.educationalDetails.institution || '',
    course: user?.educationalDetails.course || '',
    year: user?.educationalDetails.year || '',
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
    twitter: user?.socialLinks?.twitter || '',
    instagram: user?.socialLinks?.instagram || '',
    portfolio: user?.socialLinks?.portfolio || ''
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: profileData
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (!user?.uid) return;

      const updateData = {
        personalDetails: {
          name: data.name,
          phone: data.phone,
          dob: data.dob
        },
        educationalDetails: {
          institution: data.institution,
          course: data.course,
          year: data.year
        },
        socialLinks: {
          linkedin: data.linkedin,
          github: data.github,
          twitter: data.twitter,
          instagram: data.instagram,
          portfolio: data.portfolio
        },
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);

      // Log activity
      const activityLog: Partial<ActivityLog> = {
        userId: user.uid,
        userName: user.personalDetails.name,
        userRole: user.role,
        action: 'update',
        resourceType: 'profile',
        resourceId: user.uid,
        timestamp: new Date(),
        description: 'Updated profile information'
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      setProfileData(data);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-gray-600">Manage your personal information and social links</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            editing 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="input-field"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('phone', { required: 'Phone is required' })}
                  className="input-field"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  {...register('dob', { required: 'Date of birth is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.dob && (
                  <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <input
                  {...register('institution', { required: 'Institution is required' })}
                  className="input-field"
                />
                {errors.institution && (
                  <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <input
                  {...register('course', { required: 'Course is required' })}
                  className="input-field"
                />
                {errors.course && (
                  <p className="mt-1 text-sm text-red-600">{errors.course.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  {...register('year', { required: 'Year is required' })}
                  className="input-field"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    {...register('linkedin')}
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Profile
                  </label>
                  <input
                    {...register('github')}
                    type="url"
                    placeholder="https://github.com/yourusername"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter Profile
                  </label>
                  <input
                    {...register('twitter')}
                    type="url"
                    placeholder="https://twitter.com/yourusername"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Profile
                  </label>
                  <input
                    {...register('instagram')}
                    type="url"
                    placeholder="https://instagram.com/yourusername"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio Website
                  </label>
                  <input
                    {...register('portfolio')}
                    type="url"
                    placeholder="https://yourportfolio.com"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{profileData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{profileData.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900">{profileData.dob}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <p className="text-gray-900">{profileData.institution}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <p className="text-gray-900">{profileData.course}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <p className="text-gray-900">{profileData.year}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.linkedin && (
                  <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                    <span className="mr-2">🔗</span> LinkedIn
                  </a>
                )}
                {profileData.github && (
                  <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-800 hover:text-gray-900">
                    <span className="mr-2">🔗</span> GitHub
                  </a>
                )}
                {profileData.twitter && (
                  <a href={profileData.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-500">
                    <span className="mr-2">🔗</span> Twitter
                  </a>
                )}
                {profileData.instagram && (
                  <a href={profileData.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-pink-600 hover:text-pink-700">
                    <span className="mr-2">🔗</span> Instagram
                  </a>
                )}
                {profileData.portfolio && (
                  <a href={profileData.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center text-green-600 hover:text-green-700">
                    <span className="mr-2">🌐</span> Portfolio
                  </a>
                )}
              </div>
              {!profileData.linkedin && !profileData.github && !profileData.twitter && !profileData.instagram && !profileData.portfolio && (
                <p className="text-gray-500 italic">No social links added yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ManagerEventManagement: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch events from Firebase
    const fetchEvents = async () => {
      try {
        // For now, show empty state
        setEvents([]);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
          <p className="text-gray-600">Manage and edit event details</p>
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600">
            Events will appear here when they are created by administrators.
          </p>
        </div>
      )}
    </div>
  );
};

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Overview', href: '/manager-dashboard', icon: '📊' },
    { name: 'Updates', href: '/manager-dashboard/updates', icon: '📝' },
    { name: 'Events', href: '/manager-dashboard/events', icon: '🎉' },
    { name: 'Notifications', href: '/manager-dashboard/notifications', icon: '🔔' },
    { name: 'My Profile', href: '/manager-dashboard/profile', icon: '👤' },
    { name: 'Team Chat', href: '/manager-dashboard/chat', icon: '💬' },
    { name: 'Create Update', href: '/manager-dashboard/updates/create', icon: '➕' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.personalDetails.name}</p>
                <p className="text-sm text-gray-600">Manager</p>
              </div>
            </div>
          </div>

          <nav className="mt-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<ManagerOverview />} />
            <Route path="/updates" element={<ManageUpdates />} />
            <Route path="/updates/create" element={<CreateUpdate />} />
            <Route path="/events" element={<ManagerEventManagement />} />
            <Route path="/notifications" element={<ManagerNotifications />} />
            <Route path="/profile" element={<ManagerProfile />} />
            <Route path="/chat" element={<TeamChat />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;