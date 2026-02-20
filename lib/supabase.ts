import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://llevczjsjurdfejwcqpo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZXZjempzanVyZGZlandjcXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODM1OTcsImV4cCI6MjA4NzA1OTU5N30.9nWTv5IK7nARAy8Odp-2_GiOvCLETueOBuNf_Q4PV1E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/galeria/ultimo-culto/`;