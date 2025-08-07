import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Grievance } from '../../types';

interface GrievanceFormData {
  title: string;
  description: string;
  category: 'technical' | 'administrative' | 'academic' | 'other';
  priority: 'low' | 'medium' | 'high';
}

const ParticipantGrievance: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<GrievanceFormData>();

  useEffect(() => {
    fetchGrievances();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGrievances = async () => {
    if (!user) return;

    try {
      const grievancesQuery = query(
        collection(db, 'grievances'),
        where('participantId', '==', user.uid),
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

  const onSubmit = async (data: GrievanceFormData) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const grievanceData: Partial<Grievance> = {
        participantId: user.uid,
        participantName: user.personalDetails.name,
        participantEmail: user.email,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'pending',
        submittedAt: new Date()
      };

      await addDoc(collection(db, 'grievances'), grievanceData);
      
      alert('Grievance submitted successfully! You will receive updates on its status.');
      reset();
      setShowForm(false);
      fetchGrievances();
    } catch (error) {
      console.error('Error submitting grievance:', error);
      alert('Failed to submit grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Grievance Portal</h2>
          <p className="text-gray-600">Submit and track your grievances and concerns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'Submit New Grievance'}
        </button>
      </div>

      {/* Grievance Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Submit New Grievance</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="input-field"
                placeholder="Brief description of your concern"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input-field"
                placeholder="Provide detailed information about your grievance..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  <option value="technical">Technical Issues</option>
                  <option value="administrative">Administrative</option>
                  <option value="academic">Academic</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="input-field"
                >
                  <option value="">Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Grievance'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Grievances List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Grievances</h3>
        
        {grievances.length > 0 ? (
          grievances.map((grievance, index) => (
            <motion.div
              key={grievance.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{grievance.title}</h4>
                  <p className="text-gray-600 mb-3">{grievance.description}</p>
                  
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(grievance.status)}`}>
                      {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(grievance.priority)}`}>
                      {grievance.priority.charAt(0).toUpperCase() + grievance.priority.slice(1)} Priority
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {grievance.category.charAt(0).toUpperCase() + grievance.category.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Submitted: {grievance.submittedAt.toLocaleDateString()} at {grievance.submittedAt.toLocaleTimeString()}
                  </p>
                  
                  {grievance.resolvedAt && (
                    <p className="text-sm text-green-600">
                      Resolved: {grievance.resolvedAt.toLocaleDateString()} at {grievance.resolvedAt.toLocaleTimeString()}
                    </p>
                  )}
                  
                  {grievance.adminNotes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Admin Response:</p>
                      <p className="text-sm text-blue-700">{grievance.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No grievances submitted yet
            </h3>
            <p className="text-gray-600">
              If you have any concerns or issues, feel free to submit a grievance using the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantGrievance;