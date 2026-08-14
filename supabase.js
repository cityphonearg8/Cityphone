import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://tueisfzfphrrkvjfsg.supabase.co'
const supabaseKey = 'sb_publishable_6vYa3ePc4nZL4AadG7oB2g_2PF7PDXh'

export const supabase = createClient(supabaseUrl, supabaseKey)


