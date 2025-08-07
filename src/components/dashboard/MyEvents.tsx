import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Event, Registration } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MyEventsProps {
  registrations: Registration[];
  events: Event[];
}

const MyEvents: React.FC<MyEventsProps> = ({ registrations, events }) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const getEventDetails = (eventId: string) => {
    return events.find(event => event.id === eventId);
  };

  const filteredRegistrations = registrations.filter(registration => {
    const event = getEventDetails(registration.eventId);
    if (!event) return false;
    
    if (filter === 'all') return true;
    if (filter === 'upcoming') return event.status === 'upcoming' || event.status === 'active';
    if (filter === 'completed') return event.status === 'completed';
    return false;
  });

  const generatePDF = async (registration: Registration) => {
    const event = getEventDetails(registration.eventId);
    if (!event) return;

    setDownloadingPdf(registration.id);

    try {
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '800px';
      pdfContent.style.padding = '40px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      
      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 32px; margin-bottom: 10px;">INFI X TECH</h1>
          <h2 style="color: #64748b; font-size: 24px; margin-bottom: 30px;">Participation Certificate</h2>
        </div>
        
        <div style="border: 3px solid #2563eb; padding: 30px; border-radius: 10px;">
          <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 20px;">Event: ${event.eventName}</h3>
          
          <div style="margin-bottom: 20px;">
            <strong>Participant Details:</strong><br>
            Name: ${registration.participantId}<br>
            Registration Date: ${registration.registrationDate.toLocaleDateString()}<br>
            ${registration.teamName ? `Team: ${registration.teamName}<br>` : ''}
          </div>
          
          ${registration.teamMembers && registration.teamMembers.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <strong>Team Members:</strong><br>
              ${registration.teamMembers.map(member => `${member.name} (${member.email})`).join('<br>')}
            </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <strong>Event Details:</strong><br>
            Date: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}<br>
            Status: ${registration.paymentStatus}<br>
            Fee: ${event.fees === 0 ? 'Free' : `₹${event.fees}`}
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <p style="color: #64748b;">Generated on ${new Date().toLocaleDateString()}</p>
            <p style="color: #64748b; font-size: 12px;">© 2025 CyberSleuth-Bhushan. All rights reserved.</p>
          </div>
        </div>
      `;

      document.body.appendChild(pdfContent);

      // Generate PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${event.eventName}_Certificate.pdf`);
      document.body.removeChild(pdfContent);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloadingPdf(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600">Track your event registrations and participation</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-8">
        {(['all', 'upcoming', 'completed'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === filterOption
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-primary-50'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            <span className="ml-2 text-sm">
              ({filterOption === 'all' ? registrations.length : 
                registrations.filter(reg => {
                  const event = getEventDetails(reg.eventId);
                  if (!event) return false;
                  if (filterOption === 'upcoming') return event.status === 'upcoming' || event.status === 'active';
                  if (filterOption === 'completed') return event.status === 'completed';
                  return false;
                }).length})
            </span>
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredRegistrations.length > 0 ? (
        <div className="grid gap-6">
          {filteredRegistrations.map((registration) => {
            const event = getEventDetails(registration.eventId);
            if (!event) return null;

            return (
              <motion.div
                key={registration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Event Date</p>
                        <p className="font-medium">
                          {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Registration Date</p>
                        <p className="font-medium">{registration.registrationDate.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          registration.paymentStatus === 'completed' ? 'bg-green-100 text-green-600' :
                          registration.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {registration.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Fee</p>
                        <p className="font-medium">{event.fees === 0 ? 'Free' : `₹${event.fees}`}</p>
                      </div>
                    </div>

                    {registration.teamName && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Team</p>
                        <p className="font-medium">{registration.teamName}</p>
                        {registration.teamMembers && registration.teamMembers.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Team Members</p>
                            <div className="flex flex-wrap gap-2">
                              {registration.teamMembers.map((member, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                                >
                                  {member.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Link
                      to={`/events/${event.id}`}
                      className="btn-secondary text-center"
                    >
                      View Event
                    </Link>
                    
                    {registration.paymentStatus === 'completed' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => generatePDF(registration)}
                        disabled={downloadingPdf === registration.id}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingPdf === registration.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </div>
                        ) : (
                          'Download PDF'
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl shadow-lg"
        >
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't registered for any events yet."
              : `No ${filter} events found.`
            }
          </p>
          <Link to="/events" className="btn-primary">
            Browse Events
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default MyEvents;