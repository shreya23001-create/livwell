import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

export interface JobPost {
  id: number;
  title: string;
  type: string;
  location: string;
  tag: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface JobApplication {
  id: number;
  job_post_id: number;
  job_title: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  resume_name: string;
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected';
  created_at: string;
}

const EMPTY_JOB = (): Partial<JobPost> => ({
  title: '', type: 'Full Time', location: 'Dubai, UAE', tag: '', description: '', is_active: true,
});

@Component({
  selector: 'app-admin-careers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-careers.component.html',
  styleUrl: './admin-careers.component.scss',
})
export class AdminCareersComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  // ── Data ─────────────────────────────────────────────
  jobs         = signal<JobPost[]>([]);
  applications = signal<JobApplication[]>([]);
  loading      = signal(true);

  // ── Tabs ─────────────────────────────────────────────
  activeTab = signal<'jobs' | 'applications'>('applications');

  // ── Job form modal ───────────────────────────────────
  jobModalOpen  = signal(false);
  editingJobId  = signal<number | null>(null);
  jobForm       = signal<Partial<JobPost>>(EMPTY_JOB());
  savingJob     = signal(false);

  // ── Filters ──────────────────────────────────────────
  searchApps   = signal('');
  filterStatus = signal<JobApplication['status'] | ''>('');
  filterJob    = signal('');

  // ── Application detail ───────────────────────────────
  selectedApp  = signal<JobApplication | null>(null);

  readonly statuses: JobApplication['status'][] = ['new', 'reviewed', 'shortlisted', 'rejected'];

  readonly statusColors: Record<JobApplication['status'], string> = {
    new: '#6366f1', reviewed: '#f59e0b', shortlisted: '#10b981', rejected: '#ef4444',
  };

  filteredApps = computed(() => {
    const q   = this.searchApps().toLowerCase();
    const st  = this.filterStatus();
    const job = this.filterJob();
    return this.applications().filter(a =>
      (!q  || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) &&
      (!st  || a.status === st) &&
      (!job || String(a.job_post_id) === job)
    );
  });

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    const [{ data: jobs }, { data: apps }] = await Promise.all([
      this.sb.from('job_posts').select('*').order('created_at', { ascending: false }),
      this.sb.from('job_applications').select('*').order('created_at', { ascending: false }),
    ]);
    this.jobs.set((jobs as JobPost[]) ?? []);
    this.applications.set((apps as JobApplication[]) ?? []);
    this.loading.set(false);
  }

  // ── Job CRUD ─────────────────────────────────────────
  openAddJob() {
    this.editingJobId.set(null);
    this.jobForm.set(EMPTY_JOB());
    this.jobModalOpen.set(true);
  }

  openEditJob(job: JobPost) {
    this.editingJobId.set(job.id);
    this.jobForm.set({ ...job });
    this.jobModalOpen.set(true);
  }

  closeJobModal() { this.jobModalOpen.set(false); }

  patchJob(key: keyof JobPost, val: any) {
    this.jobForm.update(f => ({ ...f, [key]: val }));
  }

  async saveJob() {
    const f = this.jobForm();
    if (!f.title?.trim()) { this.toast.error('Title is required'); return; }
    this.savingJob.set(true);
    const payload = {
      title: f.title?.trim(), type: f.type, location: f.location,
      tag: f.tag?.trim(), description: f.description?.trim(), is_active: f.is_active ?? true,
    };
    const id = this.editingJobId();
    const { error } = id
      ? await this.sb.from('job_posts').update(payload).eq('id', id)
      : await this.sb.from('job_posts').insert(payload);
    this.savingJob.set(false);
    if (error) { this.toast.error(error.message); return; }
    this.toast.success(id ? 'Job updated' : 'Job posted');
    this.jobModalOpen.set(false);
    await this.load();
  }

  async toggleJobActive(job: JobPost) {
    await this.sb.from('job_posts').update({ is_active: !job.is_active }).eq('id', job.id);
    await this.load();
  }

  async deleteJob(job: JobPost) {
    if (!confirm(`Delete "${job.title}"?`)) return;
    await this.sb.from('job_posts').delete().eq('id', job.id);
    this.toast.success('Job deleted');
    await this.load();
  }

  // ── Application actions ───────────────────────────────
  openApp(app: JobApplication) { this.selectedApp.set(app); }
  closeApp() { this.selectedApp.set(null); }

  async updateStatus(app: JobApplication, status: JobApplication['status']) {
    await this.sb.from('job_applications').update({ status }).eq('id', app.id);
    this.applications.update(list => list.map(a => a.id === app.id ? { ...a, status } : a));
    if (this.selectedApp()?.id === app.id) {
      this.selectedApp.update(a => a ? { ...a, status } : a);
    }
    this.toast.success('Status updated');
  }

  async deleteApp(app: JobApplication) {
    if (!confirm(`Delete application from ${app.name}?`)) return;
    await this.sb.from('job_applications').delete().eq('id', app.id);
    this.applications.update(list => list.filter(a => a.id !== app.id));
    if (this.selectedApp()?.id === app.id) this.selectedApp.set(null);
    this.toast.success('Application deleted');
  }

  appCount(jobId: number) {
    return this.applications().filter(a => a.job_post_id === jobId).length;
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
