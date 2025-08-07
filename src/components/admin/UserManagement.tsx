import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { createMember, generateCustomId } from '../../services/authService';
import { User, ActivityLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from './UserProfile';

interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  dob: string;
}

const UserManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UserManagementList />} />
      <Route path=":userId" element={<UserProfile />} />
    </Routes>
  );
};

const UserManagementList: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [filter, setFilter] = useState<'all' | 'members' | 'participants' | 'managers'>('all');
  const [roleChangeLoading, setRoleChangeLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    customId: '',
    joinedDate: ''
  });

  // Using local functions instead of cloud functions for free version

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MemberFormData>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as User[];
      
      setUsers(usersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MemberFormData) => {
    setSubmitting(true);

    try {
      const result = await createMember(data.email, {
        name: data.name,
        phone: data.phone,
        dob: data.dob
      });

      setTempPassword(result.temporaryPassword);
      await fetchUsers();
      reset();
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      customId: user.customId,
      joinedDate: user.createdAt.toISOString().split('T')[0]
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !authUser) return;

    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        customId: editForm.customId,
        createdAt: new Date(editForm.joinedDate),
        updatedAt: new Date()
      });

      // Log activity
      const activityLog: Partial<ActivityLog> = {
        userId: authUser.uid,
        userName: authUser.personalDetails.name,
        userRole: authUser.role,
        action: 'update',
        resourceType: 'user',
        resourceId: editingUser.uid,
        changes: [
          {
            field: 'customId',
            oldValue: editingUser.customId,
            newValue: editForm.customId
          },
          {
            field: 'joinedDate',
            oldValue: editingUser.createdAt.toISOString().split('T')[0],
            newValue: editForm.joinedDate
          }
        ],
        timestamp: new Date(),
        description: `Updated ${editingUser.personalDetails.name}'s ID and joined date`
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      // Update local state
      setUsers(prev => prev.map(user => 
        user.uid === editingUser.uid 
          ? { ...user, customId: editForm.customId, createdAt: new Date(editForm.joinedDate) }
          : user
      ));

      setEditingUser(null);
      alert('User details updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user details. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      // For free version, we can only delete from Firestore
      // Firebase Auth user deletion requires Cloud Functions (paid)
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers();
      alert('User removed from database. Note: Firebase Auth user still exists (requires paid plan to delete).');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member' | 'participant' | 'manager', userName: string) => {
    if (!window.confirm(`Are you sure you want to change ${userName}'s role to ${newRole}? This will also generate a new custom ID.`)) {
      return;
    }

    setRoleChangeLoading(userId);

    try {
      const currentUser = users.find(u => u.uid === userId);
      const oldRole = currentUser?.role;
      const oldCustomId = currentUser?.customId;

      // Generate new custom ID based on new role
      const newCustomId = await generateCustomId(newRole);
      
      console.log(`Changing role from ${oldRole} to ${newRole}, ID from ${oldCustomId} to ${newCustomId}`);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        customId: newCustomId,
        updatedAt: new Date()
      });

      // Log the role change activity with both role and ID changes
      const activityLog: Partial<ActivityLog> = {
        userId: authUser?.uid || '',
        userName: authUser?.personalDetails.name || '',
        userRole: authUser?.role || '',
        action: 'update',
        resourceType: 'user',
        resourceId: userId,
        changes: [
          {
            field: 'role',
            oldValue: oldRole,
            newValue: newRole
          },
          {
            field: 'customId',
            oldValue: oldCustomId,
            newValue: newCustomId
          }
        ],
        timestamp: new Date(),
        description: `Changed ${userName}'s role from ${oldRole} to ${newRole} and updated ID from ${oldCustomId} to ${newCustomId}`
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      // Update local state
      setUsers(prev => prev.map(user => 
        user.uid === userId 
          ? { ...user, role: newRole, customId: newCustomId, updatedAt: new Date() }
          : user
      ));

      alert(`${userName}'s role has been changed to ${newRole} and new ID ${newCustomId} has been assigned!`);
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Failed to change user role. Please try again.');
    } finally {
      setRoleChangeLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'members') return user.role === 'member';
    if (filter === 'participants') return user.role === 'participant';
    if (filter === 'managers') return user.role === 'manager';
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage team members and participants</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMemberForm(true)}
          className="btn-primary"
        >
          Add Member
        </motion.button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        {(['all', 'members', 'participants', 'managers'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === filterOption
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            <span className="ml-2 text-sm">
              ({filterOption === 'all' ? users.length : 
                users.filter(u => {
                  if (filterOption === 'members') return u.role === 'member';
                  if (filterOption === 'participants') return u.role === 'participant';
                  if (filterOption === 'managers') return u.role === 'manager';
                  return false;
                }).length})
            </span>
          </button>
        ))}
      </div>

      {/* Add Member Form */}
      {showMemberForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add New Member</h3>
            <button
              onClick={() => {
                setShowMemberForm(false);
                setTempPassword('');
                reset();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {tempPassword ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-800 mb-2">Member Created Successfully!</h4>
              <p className="text-green-700 mb-2">Temporary Password:</p>
              <div className="bg-white p-3 rounded border font-mono text-sm">
                {tempPassword}
              </div>
              <p className="text-green-600 text-sm mt-2">
                Please share this password with the new member. They will be required to change it on first login.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  alert('Password copied to clipboard!');
                }}
                className="mt-3 btn-secondary text-sm"
              >
                Copy Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="input-field"
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="input-field"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('phone', { required: 'Phone number is required' })}
                  type="tel"
                  className="input-field"
                  placeholder="Enter phone number"
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

              <div className="md:col-span-2 flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Member...
                    </div>
                  ) : (
                    'Create Member'
                  )}
                </motion.button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberForm(false);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* Users List */}
      <div className="grid gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user.personalDetails.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.personalDetails.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.personalDetails.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-600' :
                      user.role === 'member' ? 'bg-blue-100 text-blue-600' :
                      user.role === 'manager' ? 'bg-purple-100 text-purple-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                      {user.customId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Joined</p>
                  <p className="font-medium">{user.createdAt.toLocaleDateString()}</p>
                </div>

                {/* Role Change Dropdown */}
                {user.role !== 'admin' && (
                  <div className="relative">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as any, user.personalDetails.name)}
                      disabled={roleChangeLoading === user.uid}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <option value="participant">Participant</option>
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                    </select>
                    {roleChangeLoading === user.uid && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/admin/users/${user.uid}`)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    View Profile
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEditUser(user)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Edit
                  </motion.button>
                  
                  {user.role !== 'admin' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeleteUser(user.uid, user.personalDetails.name)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Remove
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl shadow-lg"
        >
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "No users in the system yet."
              : `No ${filter} found.`
            }
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="btn-secondary"
            >
              View All Users
            </button>
          )}
        </motion.div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit User Details</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">User: {editingUser.personalDetails.name}</p>
                <p className="text-sm text-gray-600 mb-4">Email: {editingUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom ID
                </label>
                <input
                  type="text"
                  value={editForm.customId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., MIXT-0001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joined Date
                </label>
                <input
                  type="date"
                  value={editForm.joinedDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, joinedDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;