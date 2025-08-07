import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Event } from '../../types';

const Home: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    eventsOrganized: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch upcoming events
        const eventsQuery = query(
          collection(db, 'events'),
          where('status', '==', 'upcoming'),
          orderBy('startDate', 'asc'),
          limit(3)
        );
        
        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Event[];
        
        setUpcomingEvents(events);

        // Fetch stats
        const allEventsQuery = query(collection(db, 'events'));
        const allEventsSnapshot = await getDocs(allEventsQuery);
        
        const usersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'participant')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        setStats({
          eventsOrganized: allEventsSnapshot.size,
          totalParticipants: usersSnapshot.size
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to default values
        setStats({
          eventsOrganized: 5,
          totalParticipants: 100
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 text-white py-20 overflow-hidden"
      >
        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-10 -right-10 w-96 h-96 bg-white opacity-5 rounded-full"
          ></motion.div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -3, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-10 -left-10 w-80 h-80 bg-white opacity-5 rounded-full"
          ></motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center">
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <motion.img
                src="/assets/images/IXT.png"
                alt="INFI X TECH"
                className="w-72 h-auto mx-auto mb-6 drop-shadow-2xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLDivElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-48 h-36 mx-auto mb-6 bg-white bg-opacity-20 rounded-2xl shadow-2xl items-center justify-center hidden">
                <span className="text-6xl font-bold">IXT</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
            >
              Empowering Innovation Through Technology
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed"
            >
              Empowering innovation through technology and collaboration. Join us in building the future, one hackathon at a time.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/events">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-primary-600 px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform"
                >
                  View Events
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-2 inline-block"
                  >
                    →
                  </motion.span>
                </motion.button>
              </Link>
              
              <Link to="/team">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-primary-600 transition-all duration-300"
                >
                  Meet Our Team
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose INFI X TECH?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide a comprehensive platform for innovation, learning, and collaboration
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation Hub</h3>
              <p className="text-gray-600">
                A dynamic space where creative minds come together to build the future through cutting-edge technology and innovative solutions.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Team</h3>
              <p className="text-gray-600">
                Learn from industry experts and experienced professionals who are passionate about sharing knowledge and mentoring the next generation.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Events</h3>
              <p className="text-gray-600">
                Participate in well-organized hackathons, workshops, and tech events designed to challenge your skills and expand your horizons.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-20 bg-gray-50"
      >
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <motion.h2 
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  About <span className="text-primary-600">INFI X TECH</span>
                </motion.h2>
                <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full mb-8"></div>
              </div>
              
              <div className="space-y-6">
                <motion.p 
                  className="text-base sm:text-lg text-gray-700 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  INFI X TECH is a <strong className="text-primary-600">dynamic community</strong> of tech enthusiasts, innovators, and problem-solvers. 
                  We organize cutting-edge hackathons and tech events that bring together brilliant minds 
                  to create solutions for tomorrow's challenges.
                </motion.p>
                <motion.p 
                  className="text-base sm:text-lg text-gray-700 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Our mission is to <strong className="text-secondary-600">foster innovation</strong>, encourage collaboration, and provide a platform 
                  where creativity meets technology. Join us in shaping the future of technology.
                </motion.p>
              </div>
              
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-primary-600 mb-3">
                    {loading ? '...' : `${stats.eventsOrganized}+`}
                  </div>
                  <div className="text-gray-700 font-medium">Events Organized</div>
                  <div className="w-12 h-1 bg-primary-600 rounded-full mx-auto mt-2"></div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-secondary-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-secondary-600 mb-3">
                    {loading ? '...' : `${stats.totalParticipants}+`}
                  </div>
                  <div className="text-gray-700 font-medium">Participants</div>
                  <div className="w-12 h-1 bg-secondary-600 rounded-full mx-auto mt-2"></div>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
                </div>
                
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6"
                  >
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">Our Vision</h3>
                  </motion.div>
                  <motion.p 
                    className="text-lg opacity-95 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 0.95, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    To create a world where technology serves humanity, innovation knows no bounds, 
                    and every idea has the potential to change the world.
                  </motion.p>
                </div>
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-400 rounded-full opacity-20"
              ></motion.div>
              
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-300 rounded-full opacity-30"
              ></motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Upcoming Events Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-20 bg-gray-50"
      >
        <div className="container mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't miss out on our exciting upcoming events. Join us for innovation, learning, and networking.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <motion.div
              variants={containerVariants}
              className="grid md:grid-cols-3 gap-8"
            >
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
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
                      {event.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-primary-600 font-semibold">
                        {event.fees === 0 ? 'Free' : `₹${event.fees}`}
                      </span>
                      <Link
                        to={`/events/${event.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Learn More →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Exciting Events Coming Soon!
              </h3>
              <p className="text-gray-600 mb-6">
                We're working on some amazing events. Stay tuned for updates!
              </p>
              <Link to="/events" className="btn-primary">
                View All Events
              </Link>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="text-center mt-12">
            <Link to="/events" className="btn-primary">
              View All Events
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;