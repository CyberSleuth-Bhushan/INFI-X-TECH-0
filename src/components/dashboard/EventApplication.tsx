import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types';
import { processPayment, createRazorpayOrder } from '../../services/paymentService';

interface ApplicationFormData {
  teamName?: string;
  teamMembers: { name: string; email: string }[];
}

const EventApplication: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    watch
  } = useForm<ApplicationFormData>({
    defaultValues: {
      teamMembers: [{ name: '', email: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'teamMembers'
  });

  const teamName = watch('teamName');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = {
            id: eventDoc.id,
            ...eventDoc.data(),
            startDate: eventDoc.data().startDate?.toDate() || new Date(),
            endDate: eventDoc.data().endDate?.toDate() || new Date(),
            createdAt: eventDoc.data().createdAt?.toDate() || new Date()
          } as Event;
          setEvent(eventData);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const checkEligibility = () => {
    if (!user || !event) return false;
    // Simple eligibility check - can be enhanced
    return true;
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user || !event) return;

    setSubmitting(true);

    try {
      const registrationData = {
        eventId: event.id,
        participantId: user.uid,
        teamName: data.teamName || null,
        teamMembers: data.teamMembers.filter(member => member.name && member.email),
        paymentStatus: event.fees === 0 ? 'not-required' : 'pending',
        registrationDate: new Date()
      };

      // Create registration document first
      await addDoc(collection(db, 'registrations'), registrationData);
      
      // Handle payment process
      if (event.fees > 0) {
        try {
          // Create Razorpay order
          const orderId = await createRazorpayOrder(event.fees * 100, 'INR', event.eventName);
          
          // Process payment with Razorpay
          const paymentResult = await processPayment({
            amount: event.fees * 100, // Convert to paise
            currency: 'INR',
            orderId: orderId,
            eventName: event.eventName,
            participantName: user.personalDetails.name,
            participantEmail: user.email,
            participantPhone: user.personalDetails.phone
          });

          if (paymentResult.success) {
            // Update registration with payment details
            await addDoc(collection(db, 'registrations'), {
              ...registrationData,
              paymentStatus: 'completed',
              paymentId: paymentResult.paymentId,
              orderId: paymentResult.orderId,
              paymentDate: new Date()
            });
            setStep(3); // Payment success
          } else {
            throw new Error(paymentResult.error || 'Payment failed');
          }
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          // You might want to show an error message to the user
          alert('Payment failed. Please try again.');
        }
      } else {
        setStep(3); // Direct success for free events
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
        <button onClick={() => navigate('/events')} className="btn-primary">
          Back to Events
        </button>
      </div>
    );
  }

  if (!checkEligibility()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Eligible</h2>
        <p className="text-gray-600 mb-6">You don't meet the eligibility criteria for this event.</p>
        <button onClick={() => navigate('/events')} className="btn-primary">
          Back to Events
        </button>
      </div>
    );
  }

  // Success Step
  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your application for {event.eventName} has been submitted successfully.
          {event.fees === 0 ? ' You\'re all set!' : ' Payment confirmation will be sent to your email.'}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/participant-dashboard/events')}
            className="btn-primary"
          >
            View My Events
          </button>
          <button
            onClick={() => navigate('/events')}
            className="btn-secondary"
          >
            Browse More Events
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-primary-600 hover:text-primary-700 mb-4"
        >
          ← Back to Event Details
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Apply for {event.eventName}</h1>
        <p className="text-gray-600">Complete your application to participate in this event</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            {step === 1 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Name (Optional)
                    </label>
                    <input
                      {...register('teamName')}
                      type="text"
                      className="input-field"
                      placeholder="Enter your team name"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave blank if participating individually
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Members
                    </label>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex space-x-4 mb-4">
                        <div className="flex-1">
                          <input
                            {...register(`teamMembers.${index}.name` as const)}
                            type="text"
                            className="input-field"
                            placeholder="Member name"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            {...register(`teamMembers.${index}.email` as const)}
                            type="email"
                            className="input-field"
                            placeholder="Member email"
                          />
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700 px-3 py-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => append({ name: '', email: '' })}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Team Member
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting Application...
                      </div>
                    ) : (
                      event.fees === 0 ? 'Submit Application' : 'Proceed to Payment'
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Event Summary */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 sticky top-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Summary</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Event</p>
                <p className="font-medium">{event.eventName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Registration Fee</p>
                <p className="font-medium text-primary-600">
                  {event.fees === 0 ? 'Free' : `₹${event.fees}`}
                </p>
              </div>

              {teamName && (
                <div>
                  <p className="text-sm text-gray-600">Team</p>
                  <p className="font-medium">{teamName}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-lg text-primary-600">
                  {event.fees === 0 ? 'Free' : `₹${event.fees}`}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventApplication;