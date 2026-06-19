import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private sb = inject(SupabaseService).client;

  async send(type: string, data: Record<string, string>): Promise<void> {
    try {
      const supabaseUrl = environment.supabase.url;
      const anonKey     = environment.supabase.key;
      console.log('[EmailService] sending type:', type, 'to:', data['to_email']);
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ type, data }),
      });
      const json = await res.json().catch(() => null);
      console.log('[EmailService] response status:', res.status, json);
      if (!res.ok) console.error('[EmailService] edge fn error:', json);
    } catch (e) {
      console.warn('[EmailService] send failed:', e);
    }
  }
}
