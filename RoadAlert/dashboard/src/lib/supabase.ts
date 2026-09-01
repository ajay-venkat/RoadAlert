import { createClient } from '@supabase/supabase-js';

// These should be environment variables in a real app (.env.local)
// We provide dummy variables so the app compiles if not provided
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ReportStatus = 'New' | 'In Progress' | 'Resolved';

export interface Report {
  id: string;
  photo_url: string;
  lat: number;
  lon: number;
  constituency_id: string;
  status: ReportStatus;
  created_at: string;
  constituencies?: {
    name: string;
    mla_name: string;
  };
}
