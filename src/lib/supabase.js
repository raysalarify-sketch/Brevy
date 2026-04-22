import { createClient } from '@supabase/supabase-js';

// 이 값들은 나중에 관리자님의 Supabase 프로젝트 설정에서 가져와 .env 파일에 넣으시면 됩니다.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Config Missing! Debug Info:', {
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length,
    envKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
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
