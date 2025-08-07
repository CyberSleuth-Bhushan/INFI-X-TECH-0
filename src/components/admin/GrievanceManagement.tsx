import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Grievance, ActivityLog } from '../../types';

const GrievanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      const grievancesQuery = query(
        collection(db, 'grievances'),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(grievancesQuery);
      const grievancesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate() || null
      })) as Grievance[];
      
      setGrievances(grievancesData);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGrievanceStatus = async (grievanceId: string, newStatus: string) => {
    if (!user) return;

    setUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        adminNotes: adminNotes || undefined,
        resolvedBy: user.personalDetails.name
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolvedAt = new Date();
      }

      await updateDoc(doc(db, 'grievances', grievanceId), updateData);

      // Log activity
      const activityLog: Partial<ActivityLog> = {
        userId: user.uid,
        userName: user.personalDetails.name,
        userRole: user.role,
        action: 'update',
        resourceType: 'user', // Using existing type
        resourceId: grievanceId,
        timestamp: new Date(),
        description: `Updated grievance status to ${newStatus}`
      };

      await addDoc(collection(db, 'activityLogs'), activityLog);

      // Update local state
      setGrievances(prev => prev.map(g => 
        g.id === grievanceId 
          ? { 
              ...g, 
              status: newStatus as any, 
              adminNotes: adminNotes || g.adminNotes,
              resolvedBy: user.personalDetails.name,
              resolvedAt: (newStatus === 'resolved' || newStatus === 'closed') ? new Date() : g.resolvedAt
            }
          : g
      ));

      setSelectedGrievance(null);
      setAdminNotes('');
      alert('Grievance updated successfully!');
    } catch (error) {
      console.error('Error updating grievance:', error);
      alert('Failed to update grievance. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredGrievances = grievances.filter(grievance => {
    if (filter === 'all') return true;
    return grievance.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
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
          <h2 className="text-2xl font-bold text-gray-900">Grievance Management</h2>
          <p className="text-gray-600">Manage and resolve participant grievances</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4">
        {(['all', 'pending', 'in-progress', 'resolved', 'closed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            <span className="ml-2 text-sm">
              ({status === 'all' ? grievances.length : grievances.filter(g => g.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grievances List */}
      <div className="space-y-4">
        {filteredGrievances.length > 0 ? (
          filteredGrievances.map((grievance, index) => (
            <motion.div
              key={grievance.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{grievance.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(grievance.status)}`}>
                      {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1).replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(grievance.priority)}`}>
                      {grievance.priority.charAt(0).toUpperCase() + grievance.priority.slice(1)} Priority
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{grievance.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Participant:</span> {grievance.participantName}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {grievance.participantEmail}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {grievance.category.charAt(0).toUpperCase() + grievance.category.slice(1)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium">Submitted:</span> {grievance.submittedAt.toLocaleDateString()} at {grievance.submittedAt.toLocaleTimeString()}
                    {grievance.resolvedAt && (
                      <>
                        <br />
                        <span className="font-medium">Resolved:</span> {grievance.resolvedAt.toLocaleDateString()} at {grievance.resolvedAt.toLocaleTimeString()}
                        {grievance.resolvedBy && <span> by {grievance.resolvedBy}</span>}
                      </>
                    )}
                  </div>
                  
                  {grievance.adminNotes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Admin Notes:</p>
                      <p className="text-sm text-blue-700">{grievance.adminNotes}</p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => {
                      setSelectedGrievance(grievance);
                      setAdminNotes(grievance.adminNotes || '');
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No grievances found
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "No grievances have been submitted yet."
                : `No ${filter.replace('-', ' ')} grievances found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Grievance Management Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Manage Grievance</h3>
              <button
                onClick={() => {
                  setSelectedGrievance(null);
                  setAdminNotes('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900">{selectedGrievance.title}</h4>
                <p className="text-gray-600 mt-1">{selectedGrievance.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Participant:</span> {selectedGrievance.participantName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedGrievance.participantEmail}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {selectedGrievance.category}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> {selectedGrievance.priority}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add notes about the resolution or actions taken..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'in-progress', 'resolved', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateGrievanceStatus(selectedGrievance.id, status)}
                      disabled={updating}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        selectedGrievance.status === status
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {updating ? 'Updating...' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GrievanceManagement;