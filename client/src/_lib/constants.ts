export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '';
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1';

export const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'career_fair', label: 'Career Fair' },
  { value: 'training', label: 'Training' },
  { value: 'alumni_meetup', label: 'Alumni Meetup' },
  { value: 'other', label: 'Other' },
] as const;

export const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
] as const;

export const REACTIONS = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'] as const;
