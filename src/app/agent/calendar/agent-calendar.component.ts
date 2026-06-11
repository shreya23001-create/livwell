import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

export type EventType = 'viewing' | 'meeting' | 'followup' | 'call';

export interface CalendarEvent {
  id: number;
  title: string;
  type: EventType;
  date: string;     // YYYY-MM-DD
  time: string;     // HH:MM
  duration: number; // minutes
  client: string;
  property?: string;
  notes?: string;
}

@Component({
  selector: 'app-agent-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-calendar.component.html',
  styleUrl: './agent-calendar.component.scss',
})
export class AgentCalendarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  today = new Date();
  currentYear  = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth());

  showModal   = signal(false);
  editingId   = signal<number | null>(null);
  deleteId    = signal<number | null>(null);
  selectedDay = signal<string | null>(null);
  loading     = signal(false);
  saving      = signal(false);
  saveError   = signal('');

  form = signal({
    title: '', type: 'viewing' as EventType,
    date: '', time: '10:00', duration: 60,
    client: '', property: '', notes: '',
  });
  formErrors = signal<Record<string, string>>({});
  events     = signal<CalendarEvent[]>([]);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    await this.loadEvents();
  }

  ngOnDestroy(): void {}

  private async loadEvents(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.sb
      .from('calendar_events')
      .select('id, title, type, date, time, duration, client, property, notes')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (!error && data) {
      this.events.set(data.map((r: any) => ({
        id:       r.id,
        title:    r.title,
        type:     r.type as EventType,
        date:     r.date,
        time:     r.time,
        duration: r.duration,
        client:   r.client,
        property: r.property ?? '',
        notes:    r.notes    ?? '',
      })));
    }
    this.loading.set(false);
  }

  // Calendar grid
  monthName = computed(() => new Date(this.currentYear(), this.currentMonth(), 1)
    .toLocaleString('en-AE', { month: 'long', year: 'numeric' }));

  calendarDays = computed(() => {
    const year = this.currentYear(), month = this.currentMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: string; day: number; inMonth: boolean }[] = [];

    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, 1 - (firstDay - i));
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      days.push({ date: dt.toISOString().split('T')[0], day: d, inMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false });
    }
    return days;
  });

  eventsForDay(date: string): CalendarEvent[] {
    return this.events().filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }

  selectedDayEvents = computed(() => {
    const d = this.selectedDay();
    return d ? this.eventsForDay(d) : [];
  });

  isToday(date: string): boolean {
    return date === this.today.toISOString().split('T')[0];
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) { this.currentMonth.set(11); this.currentYear.update(y => y - 1); }
    else this.currentMonth.update(m => m - 1);
    this.selectedDay.set(null);
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) { this.currentMonth.set(0); this.currentYear.update(y => y + 1); }
    else this.currentMonth.update(m => m + 1);
    this.selectedDay.set(null);
  }

  selectDay(date: string): void {
    this.selectedDay.set(this.selectedDay() === date ? null : date);
  }

  openAdd(date?: string): void {
    this.editingId.set(null);
    this.form.set({
      title: '', type: 'viewing',
      date: date ?? this.today.toISOString().split('T')[0],
      time: '10:00', duration: 60,
      client: '', property: '', notes: '',
    });
    this.formErrors.set({});
    this.saveError.set('');
    this.showModal.set(true);
  }

  openEdit(ev: CalendarEvent): void {
    this.editingId.set(ev.id);
    this.form.set({
      title: ev.title, type: ev.type, date: ev.date, time: ev.time,
      duration: ev.duration, client: ev.client,
      property: ev.property ?? '', notes: ev.notes ?? '',
    });
    this.formErrors.set({});
    this.saveError.set('');
    this.showModal.set(true);
  }

  async saveEvent(): Promise<void> {
    const f = this.form();
    const errs: Record<string, string> = {};
    if (!f.title.trim())  errs['title']  = 'Title is required.';
    if (!f.date)          errs['date']   = 'Date is required.';
    if (!f.client.trim()) errs['client'] = 'Client name is required.';
    if (f.duration <= 0)  errs['duration'] = 'Duration must be greater than 0.';
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.saveError.set('');

    const user       = this.auth.currentUser();
    const agent_id   = user?.id    ?? '';
    const agent_email = user?.email ?? '';

    const id = this.editingId();
    if (id !== null) {
      const { error } = await this.sb
        .from('calendar_events')
        .update({ title: f.title.trim(), type: f.type, date: f.date, time: f.time, duration: f.duration, client: f.client.trim(), property: f.property, notes: f.notes, notified: false })
        .eq('id', id);
      if (error) { this.saveError.set('Failed to save: ' + error.message); this.saving.set(false); return; }
    } else {
      const { error } = await this.sb
        .from('calendar_events')
        .insert({ agent_id, agent_email, title: f.title.trim(), type: f.type, date: f.date, time: f.time, duration: f.duration, client: f.client.trim(), property: f.property, notes: f.notes });
      if (error) { this.saveError.set('Failed to save: ' + error.message); this.saving.set(false); return; }
    }

    await this.loadEvents();
    this.saving.set(false);
    this.showModal.set(false);
    this.selectedDay.set(f.date);
  }

  confirmDelete(id: number): void { this.deleteId.set(id); }

  async doDelete(): Promise<void> {
    const id = this.deleteId();
    if (id !== null) {
      await this.sb.from('calendar_events').delete().eq('id', id);
      this.events.update(list => list.filter(e => e.id !== id));
    }
    this.deleteId.set(null);
  }

  typeLabel(t: EventType): string {
    return { viewing: 'Viewing', meeting: 'Meeting', followup: 'Follow-up', call: 'Call' }[t];
  }

  formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  upcomingEvents = computed(() => {
    const today = this.today.toISOString().split('T')[0];
    return this.events()
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
  });

  readonly weekDays    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly typeOptions: EventType[] = ['viewing', 'meeting', 'followup', 'call'];
}
