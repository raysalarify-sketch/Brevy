import { createClient } from '@supabase/supabase-js'; // Fresh build trigger

// 이 값들은 나중에 관리자님의 Supabase 프로젝트 설정에서 가져와 .env 파일에 넣으시면 됩니다.
const supabaseUrl = 'https://dvhkpwgoklfxujogtfxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aGtwd2dva2xmeHVqb2d0Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODM0ODgsImV4cCI6MjA5MjM1OTQ4OH0.CFEN1KdK7d-vKSp5F6gjG7QqjQrQad1hyB3KyBg8jh0';

if (!supabaseUrl || !supabaseAnonKey) {
  const foundKeys = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
  console.error('Supabase Config Missing! Debug Info:', {
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length,
    foundViteKeys: foundKeys
  });
  console.warn('Database features will be disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : { 
      from: () => ({ 
        select: () => ({ 
          eq: () => ({ single: () => Promise.resolve({ data: null, error: 'Config missing' }) }),
          order: () => ({ limit: () => Promise.resolve({ data: [], error: 'Config missing' }) }),
          limit: () => Promise.resolve({ data: [], error: 'Config missing' })
        }), 
        insert: () => Promise.resolve({ error: 'Config missing' }),
        delete: () => ({ eq: () => Promise.resolve({ error: 'Config missing' }) })
      }) 
    };
