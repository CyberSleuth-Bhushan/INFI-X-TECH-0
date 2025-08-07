
import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Terms and Conditions
        </h1>
        
        <div className="prose max-w-none">
          <p>
            Welcome to INFI X TECH. By using our website and services, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">
            1. Data Privacy and Usage
          </h2>
          <p>
            We are committed to protecting your privacy. The personal information you provide during registration is collected for the sole purpose of generating certificates for events you participate in. 
          </p>
          <ul>
            <li>We do not collect any sensitive personal or secret data.</li>
            <li>Your data will not be shared with any third parties.</li>
            <li>Your information is used exclusively for official INFI X TECH purposes.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">
            2. About INFI X TECH
          </h2>
          <p>
            INFI X TECH is a personally formed and run group of individuals passionate about technology. Our mission is to help and motivate students by providing knowledge and preparation for hackathons and other tech-related events.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">
            3. Registration and Fees
          </h2>
          <p>
            Any fees charged for events are utilized for the following purposes:
          </p>
          <ul>
            <li>Maintenance and upkeep of the INFI X TECH website.</li>
            <li>Covering expenses related to organizing and hosting events.</li>
            <li>Prizes and awards for event winners.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">
            4. User Conduct
          </h2>
          <p>
            All participants are expected to maintain a respectful and professional demeanor during events and in all interactions with other members of the IN_I X TECH community. Any form of harassment or misconduct will not be tolerated.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">
            5. Acceptance of Terms
          </h2>
          <p>
            By creating an account and registering for our events, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
