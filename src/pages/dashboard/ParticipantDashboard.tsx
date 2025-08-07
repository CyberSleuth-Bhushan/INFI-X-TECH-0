import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Event, Registration, Notification } from '../../types';

// Import dashboard components
import ParticipantProfile from '../../components/dashboard/ParticipantProfile';
import MyEvents from '../../components/dashboard/MyEvents';
import EventApplication from '../../components/dashboard/EventApplication';
import ParticipantGrievance from '../../components/dashboard/ParticipantGrievance';

const ParticipantDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch user's registrations
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('participantId', '==', user.uid),
          orderBy('registrationDate', 'desc')
        );
        const registrationsSnapshot = await getDocs(registrationsQuery);
        const registrationsData = registrationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registrationDate: doc.data().registrationDate?.toDate() || new Date()
        })) as Registration[];
        setRegistrations(registrationsData);

        // Fetch available events
        const eventsQuery = query(
          collection(db, 'events'),
          orderBy('startDate', 'desc')
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Event[];
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const navigationItems = [
    { path: '', label: 'Overview', icon: '📊' },
    { path: 'profile', label: 'My Profile', icon: '👤' },
    { path: 'events', label: 'My Events', icon: '📅' },
    { path: 'notifications', label: 'Notifications', icon: '🔔' },
    { path: 'grievance', label: 'Grievance Portal', icon: '📝' },
  ];

  const currentPath = location.pathname.split('/').pop() || '';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPath === item.path
                      ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
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
            transition={{ duration: 0.5 }}
            className="p-8"
          >
            <Routes>
              <Route index element={
                <DashboardOverview 
                  user={user} 
                  registrations={registrations} 
                  events={events}
                  loading={loading}
                />
              } />
              <Route path="profile" element={<ParticipantProfile />} />
              <Route path="events" element={<MyEvents registrations={registrations} events={events} />} />
              <Route path="notifications" element={<ParticipantNotifications />} />
              <Route path="grievance" element={<ParticipantGrievance />} />
              <Route path="apply/:eventId" element={<EventApplication />} />
            </Routes>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Participant Notifications Component
const ParticipantNotifications: React.FC = () => {
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
          notification.targetRoles?.includes('participant') || 
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

// Dashboard Overview Component
const DashboardOverview: React.FC<{
  user: any;
  registrations: Registration[];
  events: Event[];
  loading: boolean;
}> = ({ user, registrations, events, loading }) => {
  const upcomingEvents = events.filter(event => 
    event.status === 'upcoming' && event.startDate > new Date()
  );

  const stats = [
    {
      title: 'Events Registered',
      value: registrations.length,
      icon: '📅',
      color: 'bg-blue-500'
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents.length,
      icon: '🚀',
      color: 'bg-green-500'
    },
    {
      title: 'Completed Events',
      value: registrations.filter(reg => {
        const event = events.find(e => e.id === reg.eventId);
        return event && event.status === 'completed';
      }).length,
      icon: '✅',
      color: 'bg-purple-500'
    },
    {
      title: 'Profile Completion',
      value: calculateProfileCompletion(user),
      icon: '👤',
      color: 'bg-orange-500',
      suffix: '%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.personalDetails.name}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your events and profile.
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
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}{stat.suffix || ''}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Registrations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Registrations</h3>
          {registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.slice(0, 3).map((registration) => {
                const event = events.find(e => e.id === registration.eventId);
                return (
                  <div key={registration.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-bold">📅</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event?.eventName || 'Unknown Event'}</p>
                      <p className="text-sm text-gray-500">
                        Registered on {registration.registrationDate.toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      registration.paymentStatus === 'completed' ? 'bg-green-100 text-green-600' :
                      registration.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {registration.paymentStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-600">No registrations yet</p>
              <Link to="/events" className="text-primary-600 hover:text-primary-700 font-medium">
                Browse Events →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">🚀</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.eventName}</p>
                    <p className="text-sm text-gray-500">
                      {event.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/events/${event.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-gray-600">No upcoming events</p>
              <Link to="/events" className="text-primary-600 hover:text-primary-700 font-medium">
                Explore Events →
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Helper function to calculate profile completion
const calculateProfileCompletion = (user: any): number => {
  const fields = [
    user.personalDetails.name,
    user.personalDetails.phone,
    user.personalDetails.dob,
    user.educationalDetails.institution,
    user.educationalDetails.course,
    user.educationalDetails.year,
    user.email
  ];
  
  const completedFields = fields.filter(field => field && field.trim() !== '').length;
  return Math.round((completedFields / fields.length) * 100);
};

export default ParticipantDashboard;