import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

// Export payment functions
export * from './payment';

// Generate unique ID for users
export const generateUniqueId = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin role (for member creation) or allow for participant registration
  if (data.role === 'member') {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required for member creation');
    }
  }

  const { role } = data;
  
  if (!role || !['participant', 'member'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role specified');
  }

  try {
    const prefix = role === 'participant' ? 'PRIXT' : 'MIXT';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const customId = `${prefix}-${randomNum}`;

      // Check if ID already exists
      const existingUser = await db.collection('users')
        .where('customId', '==', customId)
        .limit(1)
        .get();

      if (existingUser.empty) {
        return { customId };
      }

      attempts++;
    }

    throw new functions.https.HttpsError('internal', 'Unable to generate unique ID after multiple attempts');
  } catch (error) {
    console.error('Error generating unique ID:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate unique ID');
  }
});

// Create member with temporary password (admin only)
export const createMemberWithTempPassword = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { email, personalDetails } = data;

  if (!email || !personalDetails) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and personal details are required');
  }

  try {
    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      emailVerified: false
    });

    // Generate unique member ID
    const customId = await generateUniqueMemberId();

    // Create user document in Firestore
    const newUser = {
      uid: userRecord.uid,
      email: userRecord.email,
      role: 'member',
      personalDetails,
      educationalDetails: {
        institution: '',
        course: '',
        year: ''
      },
      customId,
      isFirstLogin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(newUser);

    return {
      user: newUser,
      temporaryPassword: tempPassword
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create member');
  }
});

// Delete user (admin only)
export const deleteUser = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    // Delete user from Firebase Auth
    await admin.auth().deleteUser(userId);

    // Delete user document from Firestore
    await db.collection('users').doc(userId).delete();

    // Delete related registrations
    const registrations = await db.collection('registrations')
      .where('participantId', '==', userId)
      .get();

    const batch = db.batch();
    registrations.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

// Export participant registrations for an event (admin only)
export const exportEventRegistrations = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    // Get event details
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    // Get registrations for the event
    const registrations = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .get();

    const registrationData = [];

    for (const regDoc of registrations.docs) {
      const registration = regDoc.data();
      
      // Get participant details
      const participantDoc = await db.collection('users').doc(registration.participantId).get();
      const participant = participantDoc.data();

      registrationData.push({
        registrationId: regDoc.id,
        participantName: participant?.personalDetails?.name || 'N/A',
        participantEmail: participant?.email || 'N/A',
        participantPhone: participant?.personalDetails?.phone || 'N/A',
        institution: participant?.educationalDetails?.institution || 'N/A',
        teamName: registration.teamName || 'Individual',
        teamMembers: registration.teamMembers || [],
        paymentStatus: registration.paymentStatus,
        registrationDate: registration.registrationDate
      });
    }

    return {
      eventName: eventDoc.data()?.eventName,
      totalRegistrations: registrationData.length,
      registrations: registrationData
    };
  } catch (error) {
    console.error('Error exporting registrations:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export registrations');
  }
});

// Helper function to generate temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to generate unique member ID
async function generateUniqueMemberId(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const customId = `MIXT-${randomNum}`;

    const existingUser = await db.collection('users')
      .where('customId', '==', customId)
      .limit(1)
      .get();

    if (existingUser.empty) {
      return customId;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique member ID');
}