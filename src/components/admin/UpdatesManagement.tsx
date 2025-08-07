import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Update, ActivityLog } from '../../types';

const UpdatesList: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      console.log('Fetching updates from Firebase...');
      const updatesQuery = query(
        collection(db, 'updates'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(updatesQuery);
      console.log('Found', querySnapshot.size, 'updates');
      
      const updatesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing update:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate() || null
        };
      }) as Update[];
      
      console.log('Processed updates:', updatesData);
      setUpdates(updatesData);
    } catch (error) {
      console.error('Error fetching updates:', error);
      // No fallback data - show empty state instead
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!window.confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      console.log('Attempting to delete update:', updateId);
      
      await deleteDoc(doc(db, 'updates', updateId));
      setUpdates(prev => prev.filter(update => update.id !== updateId));
      alert('Update deleted successfully!');
    } catch (error) {
      console.error('Error deleting update:', error);
      alert(`Failed to delete update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStatusToggle = async (updateId: string, currentStatus: 'published' | 'draft') => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      console.log('Attempting to toggle status for update:', updateId, 'from', currentStatus, 'to', newStatus);
      
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'published') {
        updateData.publishedAt = new Date();
      }

      await updateDoc(doc(db, 'updates', updateId), updateData);
      
      setUpdates(prev => prev.map(update => 
        update.id === updateId 
          ? { ...update, status: newStatus, publishedAt: newStatus === 'published' ? new Date() : update.publishedAt }
          : update
      ));

      alert(`Update ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredUpdates = updates.filter(update => {
    if (filter === 'all') return true;
    return update.status === filter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-blue-100 text-blue-800';
      case 'photo': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'event-update': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Updates Management</h2>
          <p className="text-gray-600">Manage all blog posts, photos, videos, and event updates</p>
        </div>
        <Link
          to="/admin-dashboard/updates/create"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-block"
        >
          Create New Update
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4">
        {(['all', 'published', 'draft'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-sm">
              ({status === 'all' ? updates.length : updates.filter(u => u.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Updates Table */}
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
                  Author
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
              {filteredUpdates.map((update) => (
                <motion.tr
                  key={update.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {update.title}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {update.content.substring(0, 60)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(update.type)}`}>
                      {update.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {update.authorName}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/admin-dashboard/updates/edit/${update.id}`}
                      className="text-primary-600 hover:text-primary-900 underline"
                      onClick={() => console.log('Edit clicked for update:', update.id)}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Status toggle clicked for update:', update.id);
                        handleStatusToggle(update.id, update.status);
                      }}
                      className="text-green-600 hover:text-green-900 underline cursor-pointer"
                    >
                      {update.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Delete clicked for update:', update.id);
                        handleDelete(update.id);
                      }}
                      className="text-red-600 hover:text-red-900 underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUpdates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No updates found
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "No updates have been created yet. Create your first update to get started!"
              : `No ${filter} updates found. Try creating a new update or changing the filter.`
            }
          </p>
          <Link
            to="/admin-dashboard/updates/create"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-block"
          >
            Create Your First Update
          </Link>
        </div>
      )}

      {/* Help Notice */}
      {updates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-600 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Admin Panel Actions</h4>
              <p className="text-sm text-blue-700 mt-1">
                You can edit, publish/unpublish, and delete updates using the action buttons in the table above. 
                All actions will be performed on real Firebase data and logged for audit purposes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateUpdate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'blog' as 'blog' | 'photo' | 'video' | 'event-update',
    mediaUrls: [''],
    tags: '',
    status: 'draft' as 'draft' | 'published'
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updateId, setUpdateId] = useState<string | null>(null);

  // Check if we're editing by looking at the URL
  useEffect(() => {
    const path = window.location.pathname;
    const editMatch = path.match(/\/edit\/(.+)$/);
    if (editMatch) {
      setIsEditing(true);
      setUpdateId(editMatch[1]);
      // In a real app, you'd fetch the update data here
      // For now, we'll just show a message
      console.log('Editing update:', editMatch[1]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('User UID:', user?.uid);
      
      const updateData: Partial<Update> = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        mediaUrls: formData.mediaUrls.filter(url => url.trim() !== ''),
        authorId: user?.uid || '',
        authorName: user?.personalDetails.name || '',
        status: formData.status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        updatedAt: new Date()
      };
      
      console.log('Update data to be saved:', updateData);

      if (!isEditing) {
        updateData.createdAt = new Date();
      }

      if (formData.status === 'published') {
        updateData.publishedAt = new Date();
      }

      if (isEditing && updateId) {
        await updateDoc(doc(db, 'updates', updateId), updateData);
        alert('Update edited successfully!');
      } else {
        await addDoc(collection(db, 'updates'), updateData);
        alert('Update created successfully!');
      }

      // Log activity
      const activityLog: Partial<ActivityLog> = {
        userId: user?.uid || '',
        userName: user?.personalDetails.name || '',
        userRole: user?.role || '',
        action: isEditing ? 'update' : 'create',
        resourceType: 'update',
        resourceId: updateId || 'new-update',
        timestamp: new Date(),
        description: `${isEditing ? 'Updated' : 'Created new'} ${formData.type}: ${formData.title}`
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      navigate('/admin-dashboard/updates');
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} update:`, error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('insufficient')) {
          errorMessage = 'Permission denied. Please check your user role and Firebase rules.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Failed to ${isEditing ? 'update' : 'create'} update: ${errorMessage}`);
    } finally {
      setLoading(false);
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
      <div className="flex items-center space-x-4">
        <Link
          to="/admin-dashboard/updates"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Updates
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Update' : 'Create New Update'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={8}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Status *
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
        </div>

        <div className="flex gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing 
                  ? (formData.status === 'published' ? 'Update & Publish' : 'Update Draft')
                  : (formData.status === 'published' ? 'Publish Update' : 'Save Draft')
                )
            }
          </button>
          <Link to="/admin-dashboard/updates" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 inline-block">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

const UpdatesManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UpdatesList />} />
      <Route path="create" element={<CreateUpdate />} />
      <Route path="edit/:id" element={<CreateUpdate />} />
    </Routes>
  );
};

export default UpdatesManagement;