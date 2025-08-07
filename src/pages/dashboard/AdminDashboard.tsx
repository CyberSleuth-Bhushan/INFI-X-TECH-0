import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, Event, Registration } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Import admin components
import EventManagement from '../../components/admin/EventManagement';
import UserManagement from '../../components/admin/UserManagement';
import UpdatesManagement from '../../components/admin/UpdatesManagement';
import ActivityLogs from '../../components/admin/ActivityLogs';
import NotificationCenter from '../../components/admin/NotificationCenter';
import GrievanceManagement from '../../components/admin/GrievanceManagement';
import AdminProfile from '../../components/admin/AdminProfile';
import TeamChat from '../../components/dashboard/TeamChat';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    members: 0,
    participants: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data()) as User[];
        
        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        
        // Fetch registrations
        const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
        const registrations = registrationsSnapshot.docs.map(doc => doc.data()) as Registration[];

        const members = users.filter(u => u.role === 'member').length;
        const participants = users.filter(u => u.role === 'participant').length;

        setStats({
          totalUsers: users.length,
          totalEvents: events.length,
          totalRegistrations: registrations.length,
          members,
          participants
        });

        // Prepare chart data
        const eventStats = events.map(event => ({
          name: event.eventName.substring(0, 15) + '...',
          registrations: registrations.filter(r => r.eventId === event.id).length
        }));

        setChartData(eventStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navigationItems = [
    { path: '', label: 'Dashboard', icon: '📊' },
    { path: 'profile', label: 'My Profile', icon: '👤' },
    { path: 'events', label: 'Events', icon: '📅' },
    { path: 'users', label: 'Users', icon: '👥' },
    { path: 'updates', label: 'Updates', icon: '📝' },
    { path: 'grievances', label: 'Grievances', icon: '📝' },
    { path: 'activity-logs', label: 'Activity Logs', icon: '📋' },
    { path: 'notifications', label: 'Notifications', icon: '📢' },
    { path: 'chat', label: 'Team Chat', icon: '💬' },
  ];

  const currentPath = location.pathname.split('/').pop() || '';

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
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
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">👑</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Admin Panel</h2>
                <p className="text-sm text-gray-500">{user.personalDetails.name}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPath === item.path
                      ? 'bg-red-50 text-red-600 border-r-2 border-red-600'
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
            className="p-8"
          >
            <Routes>
              <Route index element={
                <AdminOverview 
                  stats={stats}
                  chartData={chartData}
                  loading={loading}
                />
              } />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="events" element={<EventManagement />} />
              <Route path="users/*" element={<UserManagement />} />
              <Route path="updates/*" element={<UpdatesManagement />} />
              <Route path="grievances" element={<GrievanceManagement />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="chat" element={<TeamChat />} />
            </Routes>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Admin Overview Component
const AdminOverview: React.FC<{
  stats: any;
  chartData: any[];
  loading: boolean;
}> = ({ stats, chartData, loading }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: '📅',
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Registrations',
      value: stats.totalRegistrations,
      icon: '📝',
      color: 'bg-purple-500',
      change: '+25%'
    },
    {
      title: 'Members',
      value: stats.members,
      icon: '⭐',
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  const pieData = [
    { name: 'Members', value: stats.members, color: '#3B82F6' },
    { name: 'Participants', value: stats.participants, color: '#10B981' }
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard 👑
        </h1>
        <p className="text-gray-600">
          Manage your platform, users, and events from this central hub.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <motion.p 
                  className="text-3xl font-bold text-gray-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-green-600 text-sm font-medium">{stat.change}</p>
              </div>
              <div className={`w-16 h-16 ${stat.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Event Registrations Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Event Registrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="registrations" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="events"
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium text-gray-900">Manage Events</p>
              <p className="text-sm text-gray-600">Create and edit events</p>
            </div>
          </Link>
          
          <Link
            to="users"
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-600">Add members and participants</p>
            </div>
          </Link>
          
          <Link
            to="notifications"
            className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-2xl">📢</span>
            <div>
              <p className="font-medium text-gray-900">Send Notifications</p>
              <p className="text-sm text-gray-600">Communicate with team</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;