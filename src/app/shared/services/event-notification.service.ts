import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface EventAlert {
  id: number;
  title: string;
  type: string;
  date: string;
  time: string;
  client: string;
  property?: string;
  minutesUntil: number;
}

@Injectable({ providedIn: 'root' })
export class EventNotificationService implements OnDestroy {
  private sb   = inject(SupabaseService).client;
  private auth = inject(AuthService);

  alerts        = signal<EventAlert[]>([]);
  dismissedIds  = new Set<number>();
  private timer: any;

  async start(): Promise<void> {
    await this.check();
    // Check every 5 minutes
    this.timer = setInterval(() => this.check(), 5 * 60 * 1000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  ngOnDestroy(): void { this.stop(); }

  async check(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const now   = new Date();
    const today = now.toISOString().split('T')[0];

    // Fetch today's and tomorrow's events (to catch near-midnight events)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data } = await this.sb
      .from('calendar_events')
      .select('id, title, type, date, time, duration, client, property')
      .in('date', [today, tomorrowStr])
      .order('date').order('time');

    if (!data) return;

    const upcoming: EventAlert[] = [];
    for (const ev of data) {
      if (this.dismissedIds.has(ev.id)) continue;

      const eventDt    = new Date(`${ev.date}T${ev.time}:00`);
      const diffMs     = eventDt.getTime() - now.getTime();
      const diffMins   = Math.floor(diffMs / 60000);

      // Show alert if event is within the next 35 minutes
      if (diffMins >= 0 && diffMins <= 35) {
        upcoming.push({
          id:           ev.id,
          title:        ev.title,
          type:         ev.type,
          date:         ev.date,
          time:         ev.time,
          client:       ev.client,
          property:     ev.property,
          minutesUntil: diffMins,
        });
      }
    }

    this.alerts.set(upcoming);
  }

  dismiss(id: number): void {
    this.dismissedIds.add(id);
    this.alerts.update(list => list.filter(a => a.id !== id));
  }

  dismissAll(): void {
    this.alerts().forEach(a => this.dismissedIds.add(a.id));
    this.alerts.set([]);
  }
}
