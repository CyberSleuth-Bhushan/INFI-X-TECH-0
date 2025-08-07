import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types';

const Events: React.FC = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          orderBy('startDate', 'desc')
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Event[];
        
        setEvents(eventsData);

        // If eventId is provided, fetch specific event
        if (eventId) {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            const eventData = {
              id: eventDoc.id,
              ...eventDoc.data(),
              startDate: eventDoc.data().startDate?.toDate() || new Date(),
              endDate: eventDoc.data().endDate?.toDate() || new Date(),
              createdAt: eventDoc.data().createdAt?.toDate() || new Date()
            } as Event;
            setSelectedEvent(eventData);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [eventId]);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const checkEligibility = (event: Event) => {
    if (!user) return false;
    // Simple eligibility check - can be enhanced based on requirements
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </motion.div>
      </div>
    );
  }

  // Event Detail View
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 py-12"
        >
          {/* Back Button */}
          <Link
            to="/events"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 transition-colors"
          >
            ← Back to Events
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedEvent.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                    selectedEvent.status === 'active' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                  <span className="text-gray-500">
                    {selectedEvent.startDate.toLocaleDateString()} - {selectedEvent.endDate.toLocaleDateString()}
                  </span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-6">
                  {selectedEvent.eventName}
                </h1>

                <div 
                  className="prose max-w-none mb-8"
                  dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                />

                {/* Schedule */}
                {selectedEvent.schedule && selectedEvent.schedule.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Schedule</h3>
                    <div className="space-y-4">
                      {selectedEvent.schedule.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="text-primary-600 font-semibold min-w-[80px]">
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-gray-600 text-sm">{item.location}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {selectedEvent.requirements.map((req, index) => (
                        <li key={index} className="text-gray-600">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 sticky top-6"
              >
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {selectedEvent.fees === 0 ? 'Free' : `₹${selectedEvent.fees}`}
                  </div>
                  <div className="text-gray-600">Registration Fee</div>
                </div>

                {/* Eligibility */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Eligibility</h4>
                  <ul className="space-y-2">
                    {selectedEvent.eligibility.map((criteria, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Apply Button */}
                {user ? (
                  checkEligibility(selectedEvent) ? (
                    <Link
                      to={`/participant-dashboard/apply/${selectedEvent.id}`}
                      className="w-full btn-primary text-center block"
                    >
                      Apply Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Not Eligible
                    </button>
                  )
                ) : (
                  <Link
                    to="/register"
                    className="w-full btn-primary text-center block"
                  >
                    Register to Apply
                  </Link>
                )}

                <div className="mt-4 text-center text-sm text-gray-500">
                  Registration closes on {selectedEvent.startDate.toLocaleDateString()}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Events List View
  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-6 py-12"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Events
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover exciting hackathons, workshops, and tech events designed to inspire innovation and foster collaboration.
          </p>
        </div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {(['all', 'upcoming', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                filter === status
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-sm">
                ({status === 'all' ? events.length : events.filter(e => e.status === status).length})
              </span>
            </button>
          ))}
        </motion.div>

        {/* Events Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      event.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                      event.status === 'active' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {event.startDate.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {event.eventName}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {event.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-primary-600 font-semibold">
                      {event.fees === 0 ? 'Free' : `₹${event.fees}`}
                    </span>
                    <span className="text-sm text-gray-500">
                      {event.eligibility.length} eligibility criteria
                    </span>
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="w-full btn-primary text-center block"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "We're working on some amazing events. Stay tuned!"
                : `No ${filter} events at the moment.`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn-secondary"
              >
                View All Events
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Events;