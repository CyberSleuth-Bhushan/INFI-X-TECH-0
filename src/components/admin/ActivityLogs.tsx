import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ActivityLog } from '../../types';

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'manager' | 'admin'>('all');

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ActivityLog[];
      
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      // No fallback data - show empty state instead
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.userRole === filter;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'publish': return '📢';
      case 'unpublish': return '📝';
      default: return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'publish': return 'bg-purple-100 text-purple-800';
      case 'unpublish': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-blue-100 text-blue-800';
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
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="text-gray-600">Monitor all system activities and changes</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4">
        {(['all', 'manager', 'admin'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === filterOption
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            <span className="ml-2 text-sm">
              ({filterOption === 'all' ? logs.length : logs.filter(l => l.userRole === filterOption).length})
            </span>
          </button>
        ))}
      </div>

      {/* Activity Logs List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-200 last:border-b-0 p-4 hover:bg-gray-50"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{log.userName}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(log.userRole)}`}>
                      {log.userRole}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-2">{log.description}</p>

                  {log.changes && log.changes.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Changes:</p>
                      {log.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">{change.field}:</span>
                          <span className="text-red-600 line-through ml-2">{change.oldValue}</span>
                          <span className="text-green-600 ml-2">→ {change.newValue}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Resource: {log.resourceType}</span>
                    <span>•</span>
                    <span>{log.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No activity logs found
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "No activities have been logged yet."
              : `No ${filter} activities found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;