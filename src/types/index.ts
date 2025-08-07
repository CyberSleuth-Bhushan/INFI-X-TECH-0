export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'member' | 'participant' | 'manager';
  personalDetails: {
    name: string;
    phone: string;
    dob: string;
    bio?: string;
  };
  educationalDetails: {
    institution: string;
    course: string;
    year: string;
  };
  customId: string;
  isFirstLogin: boolean;
  isActive?: boolean;
  profilePhotoUrl?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    portfolio?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  eventName: string;
  description: string;
  eligibility: string[];
  fees: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  schedule: {
    title: string;
    time: string;
    location: string;
  }[];
  requirements: string[];
  createdAt: Date;
}

export interface Registration {
  id: string;
  eventId: string;
  participantId: string;
  teamName?: string;
  teamMembers?: {
    name: string;
    email: string;
  }[];
  paymentStatus: 'pending' | 'completed' | 'not-required';
  registrationDate: Date;
}

export interface Notification {
  id: string;
  message: string;
  targetRoles: string[];
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string, 
    password: string, 
    personalDetails: {
      name: string;
      phone: string;
      dob: string;
    },
    educationalDetails: {
      institution: string;
      course: string;
      year: string;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  googleSignIn: () => Promise<void>;
}

export interface Update {
  id: string;
  title: string;
  content: string;
  type: 'blog' | 'photo' | 'video' | 'event-update';
  mediaUrls?: string[]; // Google Drive links for photos/videos
  eventId?: string; // If related to a specific event
  authorId: string;
  authorName: string;
  status: 'draft' | 'published';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  resourceType: 'event' | 'update' | 'user' | 'registration' | 'profile';
  resourceId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
  description: string;
}

export interface Grievance {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  title: string;
  description: string;
  category: 'technical' | 'administrative' | 'academic' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  submittedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  adminNotes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

export interface FormData {
  [key: string]: any;
}