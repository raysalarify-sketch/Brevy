import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvhkpwgoklfxujogtfxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aGtwd2dva2xmeHVqb2d0Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODM0ODgsImV4cCI6MjA5MjM1OTQ4OH0.CFEN1KdK7d-vKSp5F6gjG7QqjQrQad1hyB3KyBg8jh0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);