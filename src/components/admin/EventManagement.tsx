import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Event, Registration } from '../../types';

interface EventFormData {
  eventName: string;
  description: string;
  eligibility: string;
  fees: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  requirements: string;
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EventFormData>();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Event[];
      
      setEvents(eventsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setSubmitting(true);

    try {
      const eventData = {
        eventName: data.eventName,
        description: data.description,
        eligibility: data.eligibility.split(',').map(item => item.trim()),
        fees: Number(data.fees),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status,
        requirements: data.requirements.split(',').map(item => item.trim()),
        schedule: [], // Can be enhanced to include schedule input
        createdAt: editingEvent ? editingEvent.createdAt : new Date()
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventData);
      } else {
        await addDoc(collection(db, 'events'), eventData);
      }

      await fetchEvents();
      setShowForm(false);
      setEditingEvent(null);
      reset();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    reset({
      eventName: event.eventName,
      description: event.description,
      eligibility: event.eligibility.join(', '),
      fees: event.fees,
      startDate: event.startDate.toISOString().split('T')[0],
      endDate: event.endDate.toISOString().split('T')[0],
      status: event.status,
      requirements: event.requirements.join(', ')
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const downloadParticipants = async (eventId: string) => {
    try {
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registrations = registrationsSnapshot.docs.map(doc => doc.data()) as Registration[];

      // Create CSV content
      const csvContent = [
        ['Participant ID', 'Team Name', 'Team Members', 'Payment Status', 'Registration Date'].join(','),
        ...registrations.map(reg => [
          reg.participantId,
          reg.teamName || 'Individual',
          reg.teamMembers?.map(m => m.name).join('; ') || '',
          reg.paymentStatus,
          reg.registrationDate instanceof Date ? reg.registrationDate.toLocaleDateString() : new Date(reg.registrationDate).toLocaleDateString()
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event_${eventId}_participants.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading participants:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600">Create and manage events for your community</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowForm(true);
            setEditingEvent(null);
            reset();
          }}
          className="btn-primary"
        >
          Create Event
        </motion.button>
      </div>

      {/* Event Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
                reset();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name
              </label>
              <input
                {...register('eventName', { required: 'Event name is required' })}
                type="text"
                className="input-field"
                placeholder="Enter event name"
              />
              {errors.eventName && (
                <p className="mt-1 text-sm text-red-600">{errors.eventName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Fee (₹)
              </label>
              <input
                {...register('fees', { required: 'Fee is required', min: 0 })}
                type="number"
                className="input-field"
                placeholder="0 for free events"
              />
              {errors.fees && (
                <p className="mt-1 text-sm text-red-600">{errors.fees.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                {...register('startDate', { required: 'Start date is required' })}
                type="date"
                className="input-field"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                {...register('endDate', { required: 'End date is required' })}
                type="date"
                className="input-field"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="input-field"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligibility (comma-separated)
              </label>
              <input
                {...register('eligibility', { required: 'Eligibility is required' })}
                type="text"
                className="input-field"
                placeholder="Students, Professionals, etc."
              />
              {errors.eligibility && (
                <p className="mt-1 text-sm text-red-600">{errors.eligibility.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input-field"
                placeholder="Event description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements (comma-separated)
              </label>
              <input
                {...register('requirements')}
                type="text"
                className="input-field"
                placeholder="Laptop, Student ID, etc."
              />
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
                    {editingEvent ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingEvent ? 'Update Event' : 'Create Event'
                )}
              </motion.button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                  reset();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Events List */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{event.eventName}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                    event.status === 'active' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fee</p>
                    <p className="font-medium">{event.fees === 0 ? 'Free' : `₹${event.fees}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Eligibility</p>
                    <p className="font-medium">{event.eligibility.join(', ')}</p>
                  </div>
                </div>

                <p className="text-gray-600 line-clamp-2">{event.description}</p>
              </div>

              <div className="flex flex-col space-y-2 ml-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEdit(event)}
                  className="btn-secondary text-sm"
                >
                  Edit
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => downloadParticipants(event.id)}
                  className="btn-primary text-sm"
                >
                  Download CSV
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(event.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {events.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl shadow-lg"
        >
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-6">Create your first event to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Create Event
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default EventManagement;