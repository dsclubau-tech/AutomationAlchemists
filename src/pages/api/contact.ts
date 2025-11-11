// File: src/pages/api/contact.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// ✅ Use the same schema as the frontend
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
  user_id: z.string().uuid().nullable().optional(),
});

// ✅ Create Supabase server client (use service key for full insert access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Only use service role key on server side
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ✅ Parse and validate the incoming body
    const parsed = contactSchema.parse(req.body);

    // ✅ Insert into Supabase table securely
    const { error } = await supabase.from('contacts').insert(parsed);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Message stored successfully!' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
