import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Notification } from '../../types';

// Import member dashboard components
import MemberProfile from '../../components/dashboard/MemberProfile';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import ChangePassword from '../../components/dashboard/ChangePassword';
import TeamChat from '../../components/dashboard/TeamChat';

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to notifications in real-time
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('targetRoles', 'array-contains', 'member'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.length); // Simple unread logic
    });

    return unsubscribe;
  }, [user]);

  const navigationItems = [
    { path: '', label: 'Overview', icon: '📊' },
    { path: 'profile', label: 'My Profile', icon: '👤' },
    { path: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
    { path: 'chat', label: 'Team Chat', icon: '💬' },
  ];

  const currentPath = location.pathname.split('/').pop() || '';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle first-time login
  if (user.isFirstLogin && !location.pathname.includes('change-password')) {
    return <ChangePassword />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-64 bg-white shadow-lg min-h-screen"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.personalDetails.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{user.personalDetails.name}</h2>
                <p className="text-sm text-gray-500">{user.customId}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    currentPath === item.path
                      ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8"
          >
            <Routes>
              <Route index element={
                <MemberOverview 
                  user={user} 
                  notifications={notifications}
                />
              } />
              <Route path="profile" element={<MemberProfile />} />
              <Route path="notifications" element={<NotificationsPanel notifications={notifications} />} />
              <Route path="chat" element={<TeamChat />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Routes>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Member Overview Component
const MemberOverview: React.FC<{
  user: any;
  notifications: Notification[];
}> = ({ user, notifications }) => {
  const recentNotifications = notifications.slice(0, 3);

  const stats = [
    {
      title: 'Member Since',
      value: user.createdAt.toLocaleDateString(),
      icon: '📅',
      color: 'bg-blue-500'
    },
    {
      title: 'Notifications',
      value: notifications.length,
      icon: '🔔',
      color: 'bg-green-500'
    },
    {
      title: 'Status',
      value: 'Active',
      icon: '✅',
      color: 'bg-purple-500'
    },
    {
      title: 'Role',
      value: 'Member',
      icon: '👤',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user.personalDetails.name}! 👋
        </h1>
        <p className="text-gray-600">
          Stay updated with team announcements and manage your profile.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Notifications</h3>
          <Link
            to="notifications"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {recentNotifications.length > 0 ? (
          <div className="space-y-4">
            {recentNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold">📢</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">{notification.message}</p>
                  <p className="text-sm text-gray-500">
                    {notification.createdAt.toLocaleDateString()} at {notification.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-600">No notifications yet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MemberDashboard;