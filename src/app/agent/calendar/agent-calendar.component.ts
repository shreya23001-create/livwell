import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type EventType = 'viewing' | 'meeting' | 'followup' | 'call';

interface CalendarEvent {
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
export class AgentCalendarComponent {
  today = new Date();
  currentYear  = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth()); // 0-based

  showModal   = signal(false);
  editingId   = signal<number | null>(null);
  deleteId    = signal<number | null>(null);
  selectedDay = signal<string | null>(null);

  form = signal({
    title: '', type: 'viewing' as EventType,
    date: '', time: '10:00', duration: 60,
    client: '', property: '', notes: '',
  });
  formErrors = signal<Record<string, string>>({});

  events = signal<CalendarEvent[]>([
    { id: 1, title: 'Property Viewing', type: 'viewing', date: this.dateStr(0), time: '10:00', duration: 60, client: 'Mohammed Al-Rashidi', property: 'Luxury 2BR Downtown Dubai', notes: 'First viewing — client prefers high floor' },
    { id: 2, title: 'Follow-up Call', type: 'followup', date: this.dateStr(0), time: '14:00', duration: 30, client: 'Priya Nair', notes: 'Discuss payment plan options' },
    { id: 3, title: 'Client Meeting', type: 'meeting', date: this.dateStr(1), time: '11:00', duration: 90, client: 'Ahmed Hassan', property: 'Villa Arabian Ranches', notes: 'Bring brochures and floor plans' },
    { id: 4, title: 'Property Viewing', type: 'viewing', date: this.dateStr(2), time: '09:30', duration: 45, client: 'Sarah Williams', property: 'Studio JVC' },
    { id: 5, title: 'Discovery Call', type: 'call', date: this.dateStr(3), time: '15:00', duration: 30, client: 'Omar Khalid' },
    { id: 6, title: 'Property Viewing', type: 'viewing', date: this.dateStr(5), time: '10:30', duration: 60, client: 'Fatima Al-Zahra', property: 'Penthouse Palm Jumeirah' },
    { id: 7, title: 'Negotiation Meeting', type: 'meeting', date: this.dateStr(7), time: '13:00', duration: 120, client: 'David Chen', property: 'Townhouse Dubai Hills' },
  ]);

  private dateStr(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  // Calendar grid
  monthName = computed(() => new Date(this.currentYear(), this.currentMonth(), 1)
    .toLocaleString('en-AE', { month: 'long', year: 'numeric' }));

  calendarDays = computed(() => {
    const year = this.currentYear(), month = this.currentMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: string; day: number; inMonth: boolean }[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, 1 - (firstDay - i));
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      days.push({ date: dt.toISOString().split('T')[0], day: d, inMonth: true });
    }
    // Trailing cells to complete grid
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
    this.form.set({ title: '', type: 'viewing', date: date ?? this.today.toISOString().split('T')[0], time: '10:00', duration: 60, client: '', property: '', notes: '' });
    this.formErrors.set({});
    this.showModal.set(true);
  }

  openEdit(ev: CalendarEvent): void {
    this.editingId.set(ev.id);
    this.form.set({ title: ev.title, type: ev.type, date: ev.date, time: ev.time, duration: ev.duration, client: ev.client, property: ev.property ?? '', notes: ev.notes ?? '' });
    this.formErrors.set({});
    this.showModal.set(true);
  }

  saveEvent(): void {
    const f = this.form();
    const errs: Record<string, string> = {};
    if (!f.title.trim())  errs['title']  = 'Title is required.';
    if (!f.date)          errs['date']   = 'Date is required.';
    if (!f.client.trim()) errs['client'] = 'Client name is required.';
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    const id = this.editingId();
    if (id !== null) {
      this.events.update(list => list.map(e => e.id === id ? { ...e, ...f } : e));
    } else {
      this.events.update(list => [...list, { id: Date.now(), ...f }]);
    }
    this.showModal.set(false);
    this.selectedDay.set(f.date);
  }

  confirmDelete(id: number): void { this.deleteId.set(id); }
  doDelete(): void {
    const id = this.deleteId();
    if (id !== null) this.events.update(list => list.filter(e => e.id !== id));
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

  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly typeOptions: EventType[] = ['viewing', 'meeting', 'followup', 'call'];
}
