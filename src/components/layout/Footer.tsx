import React from 'react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <motion.footer 
      className="bg-secondary-800 text-white py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold">INFI X TECH</span>
          </div>
          <p className="text-secondary-300 mb-4">
            Empowering innovation through technology and collaboration
          </p>
          <div className="border-t border-secondary-700 pt-4">
            <p className="text-sm text-secondary-400">
              © 2025 CyberSleuth-Bhushan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;