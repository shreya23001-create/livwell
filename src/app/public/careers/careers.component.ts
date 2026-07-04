import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

interface JobPost {
  id: number;
  title: string;
  type: string;
  location: string;
  tag: string;
  description: string;
  is_active: boolean;
}

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

interface Value {
  icon: string;
  title: string;
  desc: string;
}

interface Faq {
  q: string;
  a: string;
}

interface ApplyForm {
  name: string;
  email: string;
  phone: string;
  resumeFile: File | null;
  resumeName: string;
}

const EMPTY_FORM = (): ApplyForm => ({
  name: '', email: '', phone: '', resumeFile: null, resumeName: '',
});

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './careers.component.html',
  styleUrl: './careers.component.scss',
})
export class CareersComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  openFaq      = signal<number | null>(null);

  // ── Jobs from DB ─────────────────────────────────────
  jobs         = signal<JobPost[]>([]);
  jobsLoading  = signal(true);

  // ── Apply modal ──────────────────────────────────────
  applyJob     = signal<JobPost | null>(null);
  applyForm    = signal<ApplyForm>(EMPTY_FORM());
  submitting   = signal(false);
  submitted    = signal(false);
  formErrors   = signal<Record<string, string>>({});

  readonly values: Value[] = [
    { icon: 'integrity',      title: 'Integrity',            desc: 'We operate with complete transparency and honesty in every client interaction and internal decision.' },
    { icon: 'innovation',     title: 'Innovation',           desc: 'We continuously explore new tools, technologies, and ideas to stay ahead in a dynamic market.' },
    { icon: 'excellence',     title: 'Excellence',           desc: 'We hold ourselves to the highest standards in service delivery, market knowledge, and professionalism.' },
    { icon: 'respect',        title: 'Respect',              desc: 'We celebrate diversity and treat every colleague, client, and partner with dignity and fairness.' },
    { icon: 'authenticity',   title: 'Authenticity',         desc: 'We are genuine in our relationships — with clients, with each other, and with the communities we serve.' },
    { icon: 'collaboration',  title: 'Collaboration',        desc: 'We succeed together. Sharing knowledge and supporting each other is at the heart of our culture.' },
    { icon: 'social',         title: 'Social Responsibility', desc: 'We invest in our communities and uphold ethical standards that go beyond the transaction.' },
    { icon: 'kindness',       title: 'Kindness',             desc: 'A culture of care and compassion makes Livwell a place where people genuinely thrive.' },
  ];

  readonly team: TeamMember[] = [
    { name: 'Ankush Sharma', role: 'CEO & Founder',          avatar: 'images/ceo-new.png' },
    { name: 'Anuj Verma',    role: 'Senior Property Advisor', avatar: 'images/Anuj.jpeg' },
    { name: 'Niket Shah',    role: 'Off-Plan Specialist',     avatar: 'images/Niket .jpeg' },
    { name: 'Yash Patel',    role: 'Leasing Consultant',      avatar: 'images/Yash.jpeg' },
  ];

  readonly reviews = [
    { name: 'James Carter',      rating: 5, text: 'Livwell helped me find my dream apartment in Dubai Marina. The team was incredibly professional and made the entire process smooth.' },
    { name: 'Fatima Al Rashid',  rating: 5, text: 'Outstanding service from start to finish. My agent was knowledgeable, patient, and always available. Highly recommend Livwell.' },
    { name: 'Robert Wilson',     rating: 5, text: 'Best real estate agency in Dubai. They found us an off-plan villa within our budget and guided us through every step of the investment.' },
    { name: 'Priya Mehta',       rating: 4, text: 'Very professional team. Great market knowledge and transparent communication throughout the buying process.' },
  ];

  readonly faqs: Faq[] = [
    { q: 'Is real estate a good career choice in Dubai?', a: 'Absolutely. Dubai\'s real estate market is one of the most dynamic in the world, offering exceptional earning potential, an international client base, and a fast-paced environment that rewards ambitious professionals.' },
    { q: 'Do I need investment to start a career in Dubai?', a: 'No personal financial investment is required to start a career as a property advisor. You will need a RERA certification and a valid real estate brokerage card, both of which Livwell supports you in obtaining.' },
    { q: 'What kind of training do you offer?', a: 'We provide comprehensive onboarding, product training, CRM training, market orientation sessions, and ongoing mentorship from senior advisors. New joiners are fully supported in their first 90 days.' },
    { q: 'What skills are important to succeed in Dubai real estate?', a: 'Strong communication, resilience, market curiosity, and a genuine desire to help clients are the most important traits. Language skills are a big plus given Dubai\'s international clientele.' },
    { q: 'Why join Livwell Properties as a real estate agent?', a: 'Livwell offers an exceptional commission structure, a strong brand presence, cutting-edge marketing tools, a collaborative culture, and access to some of Dubai\'s most exclusive listings.' },
    { q: 'What is the earning potential as a real estate agent in Dubai?', a: 'Earnings vary based on performance but top agents consistently earn AED 500K–2M+ per year. There is no ceiling — your income is directly tied to your effort and results.' },
    { q: 'How long does it take to become a real estate agent in Dubai?', a: 'After completing the RERA certification course (4 days) and passing the exam, you can begin working immediately. Most new agents close their first deal within 30–60 days with proper mentoring.' },
    { q: 'Can foreigners work as real estate agents in Dubai?', a: 'Yes. Dubai welcomes international talent. You will need a valid UAE residence visa, an Emirates ID, and a RERA brokerage card — all of which Livwell supports you in obtaining.' },
  ];

  async ngOnInit() {
    const { data } = await this.sb
      .from('job_posts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    this.jobs.set((data as JobPost[]) ?? []);
    this.jobsLoading.set(false);
  }

  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  openApply(job: JobPost) {
    this.applyJob.set(job);
    this.applyForm.set(EMPTY_FORM());
    this.formErrors.set({});
    this.submitted.set(false);
    document.body.style.overflow = 'hidden';
  }

  closeApply() {
    this.applyJob.set(null);
    this.submitted.set(false);
    document.body.style.overflow = '';
  }

  patchForm(key: keyof ApplyForm, val: any) {
    this.applyForm.update(f => ({ ...f, [key]: val }));
  }

  onResumeChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      this.toast.error('Only PDF, DOC or DOCX files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File size must be under 5MB');
      return;
    }
    this.patchForm('resumeFile', file);
    this.patchForm('resumeName', file.name);
  }

  private validate(): boolean {
    const f = this.applyForm();
    const errors: Record<string, string> = {};
    if (!f.name.trim())  errors['name']  = 'Name is required';
    if (!f.email.trim()) errors['email'] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors['email'] = 'Invalid email';
    if (!f.phone.trim()) errors['phone'] = 'Phone is required';
    if (!f.resumeFile)   errors['resume'] = 'Resume is required';
    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  async submitApplication() {
    if (!this.validate()) return;
    const job  = this.applyJob()!;
    const form = this.applyForm();
    this.submitting.set(true);

    try {
      // Upload resume to Supabase Storage
      const ext  = form.resumeFile!.name.split('.').pop()?.toLowerCase() || 'pdf';
      const path = `resumes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadErr } = await this.sb.storage
        .from('imagesFolder')
        .upload(path, form.resumeFile!, { contentType: form.resumeFile!.type, upsert: true });

      if (uploadErr) { this.toast.error('Resume upload failed: ' + uploadErr.message); this.submitting.set(false); return; }

      const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(uploadData.path);

      // Insert application record
      const { error: insertErr } = await this.sb.from('job_applications').insert({
        job_post_id:  job.id,
        job_title:    job.title,
        name:         form.name.trim(),
        email:        form.email.trim(),
        phone:        form.phone.trim(),
        resume_url:   pub.publicUrl,
        resume_name:  form.resumeName,
        status:       'new',
      });

      if (insertErr) { this.toast.error(insertErr.message); this.submitting.set(false); return; }

      this.submitted.set(true);
    } catch (e: any) {
      this.toast.error(e?.message || 'Submission failed');
    } finally {
      this.submitting.set(false);
    }
  }
}
