export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator' | 'user';
  avatar?: string;
  bio?: string;
  round?: string;
  batch?: string;
  course?: string;
  phone?: string;
  address?: string;
  points: number;
  created_at: string;
  email_verified_at?: string;
  profile?: UserProfile;
  badges?: Badge[];
  is_admin: boolean;
}

export interface UserProfile {
  id: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills: string[];
  experience: Experience[];
  certifications: Certification[];
  projects: Project[];
}

export interface Experience {
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  description: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface Project {
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

export interface Post {
  id: number;
  body: string;
  media?: string[];
  tags?: string[];
  user_id: number;
  community_id?: number;
  author: User;
  community?: Community;
  reactions_count: number;
  comments_count: number;
  likes_count: number;
  loves_count: number;
  created_at: string;
  is_from_friend?: boolean;
  moderation_status?: string;
  user_reaction?: string;
}

export interface Comment {
  id: number;
  body: string;
  post_id: number;
  user_id: number;
  parent_id?: number;
  user: User;
  created_at: string;
}

export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export interface Notification {
  id: number;
  type: string;
  data: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  event_type: string;
  location?: string;
  online_url?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  image?: string;
  status: string;
  creator: User;
  registrations_count: number;
  attended_count: number;
  user_registration?: EventRegistration;
  created_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  status: string;
  qr_code: string;
  checked_in_at?: string;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  is_private: boolean;
  tags: string[];
  members_count: number;
  owner: User;
  joined?: boolean;
}

export interface Job {
  id: number;
  title: string;
  company: Company;
  description: string;
  type: string;
  location?: string;
  salary_range?: string;
  skills_required: string[];
  deadline?: string;
  status: string;
  match_score?: number;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  logo?: string;
  industry?: string;
  location?: string;
}

export interface Conversation {
  id: number;
  type: string;
  last_message_at: string;
  users: User[];
  last_message?: Message;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  message_type: string;
  attachments?: any[];
  created_at: string;
  sender: User;
}

export interface LiveStream {
  id: number;
  title: string;
  description?: string;
  stream_key: string;
  rtmp_url: string;
  hls_url: string;
  status: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  creator: User;
  event?: Event;
}

export interface DashboardMetrics {
  users: { total: number; active: number; new_today: number; by_role: Record<string, number> };
  engagement: { posts: number; comments: number; reactions: number; messages: number };
  events: { total: number; upcoming: number; registrations: number; attendance_rate: number };
  scholarships: { total: number; active_batches: number };
  activity: Array<{ date: string; posts: number; comments: number; registrations: number }>;
}

export interface PaginationMeta {
  current: number;
  last: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Badge {
  id: number;
  name: string;
  icon: string;
  description?: string;
  earned_at?: string;
}
