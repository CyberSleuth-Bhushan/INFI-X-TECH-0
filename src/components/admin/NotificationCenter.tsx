import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { collection, getDocs, addDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Notification } from '../../types';

interface NotificationFormData {
  message: string;
  targetRoles: string[];
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NotificationFormData>();

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
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: NotificationFormData) => {
    setSending(true);

    try {
      console.log('Sending notification with data:', data);
      
      // Ensure targetRoles is an array and filter out empty values
      let targetRoles: string[] = [];
      if (Array.isArray(data.targetRoles)) {
        targetRoles = data.targetRoles.filter(role => role && role.trim() !== '');
      } else if (data.targetRoles) {
        targetRoles = [data.targetRoles];
      }
      
      if (targetRoles.length === 0) {
        alert('Please select at least one target audience');
        setSending(false);
        return;
      }

      const notificationData = {
        message: data.message,
        targetRoles: targetRoles,
        createdAt: new Date()
      };

      console.log('Notification data to be sent:', notificationData);

      await addDoc(collection(db, 'notifications'), notificationData);
      await fetchNotifications();
      reset();
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
        <p className="text-gray-600">Send announcements and updates to team members</p>
      </div>

      {/* Send Notification Form */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Send New Notification</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              {...register('message', { 
                required: 'Message is required',
                minLength: {
                  value: 10,
                  message: 'Message must be at least 10 characters'
                }
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your message for team members..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  {...register('targetRoles', { required: 'Please select at least one target audience' })}
                  type="checkbox"
                  value="member"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">Team Members</span>
              </label>
              <label className="flex items-center">
                <input
                  {...register('targetRoles')}
                  type="checkbox"
                  value="participant"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">Participants</span>
              </label>
              <label className="flex items-center">
                <input
                  {...register('targetRoles')}
                  type="checkbox"
                  value="manager"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">Managers</span>
              </label>
            </div>
            {errors.targetRoles && (
              <p className="mt-1 text-sm text-red-600">{errors.targetRoles.message}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Notification'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Notification History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Notification History</h3>
        
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                        📢 Announcement
                      </span>
                      <span className="text-sm text-gray-500">
                        Sent to: {Array.isArray(notification.targetRoles) ? notification.targetRoles.join(', ') : notification.targetRoles}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {notification.createdAt.toLocaleDateString()} at {notification.createdAt.toLocaleTimeString()}
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
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-600">No notifications sent yet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotificationCenter;