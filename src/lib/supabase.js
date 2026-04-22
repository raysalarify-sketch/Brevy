import { createClient } from '@supabase/supabase-js';

// 이 값들은 나중에 관리자님의 Supabase 프로젝트 설정에서 가져와 .env 파일에 넣으시면 됩니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
