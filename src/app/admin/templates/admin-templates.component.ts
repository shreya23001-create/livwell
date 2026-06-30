import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

interface EmailTemplate {
  id: number;
  key: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  from_name: string;
  from_email: string;
  enabled: boolean;
  variables: string[];
}

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id'>[] = [
  {
    key: 'signup_welcome',
    label: 'Welcome / Sign Up',
    description: 'Sent to new customers when they register.',
    subject: 'Welcome to Livwell, {{name}}!',
    from_name: 'Livwell', from_email: 'onboarding@resend.dev', enabled: true,
    variables: ['name', 'email'],
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 0"><div style="background-color:#1a5c3a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="90" height="90" style="width:90px;height:90px;border-radius:50%;background-color:#fff;padding:6px;display:inline-block;margin-bottom:14px" /></div><div style="background-color:#226b47;padding:28px 40px 32px;text-align:center"><h1 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 10px;line-height:1.3">Welcome, {{name}}! 🎉</h1><p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.65;margin:0">Your gateway to premium real estate in Dubai.<br>Your account is ready — let's find your perfect home.</p></div><div style="background-color:#fff;padding:36px 40px 32px"><p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 28px">Hi <strong>{{name}}</strong>, we are thrilled to have you on board. At Livwell, we connect you with Dubai's finest properties — from ready-to-move homes to exclusive off-plan investments — backed by a team of dedicated experts.</p><div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">What you can do now</div><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="47%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;vertical-align:top"><div style="width:44px;height:44px;background-color:#dcfce7;border-radius:10px;margin-bottom:12px;text-align:center;line-height:44px;font-size:20px">🔍</div><div style="font-size:14px;font-weight:700;color:#111;margin-bottom:5px">Search Listings</div><div style="font-size:12px;color:#6b7280;line-height:1.55">Browse hundreds of verified properties &amp; projects across Dubai.</div></td><td width="6%"></td><td width="47%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;vertical-align:top"><div style="width:44px;height:44px;background-color:#dcfce7;border-radius:10px;margin-bottom:12px;text-align:center;line-height:44px;font-size:20px">❤️</div><div style="font-size:14px;font-weight:700;color:#111;margin-bottom:5px">Save Favourites</div><div style="font-size:12px;color:#6b7280;line-height:1.55">Shortlist the homes you love and revisit them any time.</div></td></tr><tr><td colspan="3" style="height:12px"></td></tr><tr><td width="47%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;vertical-align:top"><div style="width:44px;height:44px;background-color:#dcfce7;border-radius:10px;margin-bottom:12px;text-align:center;line-height:44px;font-size:20px">💬</div><div style="font-size:14px;font-weight:700;color:#111;margin-bottom:5px">Talk to an Agent</div><div style="font-size:12px;color:#6b7280;line-height:1.55">Message our expert agents and get real-time responses.</div></td><td width="6%"></td><td width="47%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;vertical-align:top"><div style="width:44px;height:44px;background-color:#dcfce7;border-radius:10px;margin-bottom:12px;text-align:center;line-height:44px;font-size:20px">📋</div><div style="font-size:14px;font-weight:700;color:#111;margin-bottom:5px">Track Enquiries</div><div style="font-size:12px;color:#6b7280;line-height:1.55">View all your requests in one dashboard — easy to follow up.</div></td></tr></table><div style="text-align:center;padding:32px 0 20px"><a href="https://testlivwelldubai.vercel.app/" style="display:inline-block;padding:14px 44px;background-color:#1a5c3a;color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px">Explore Properties →</a></div><p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">Questions? Simply reply to this email — we are always here to help.</p></div><div style="background-color:#1a5c3a;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="48" height="48" style="width:48px;height:48px;border-radius:50%;background-color:#fff;padding:3px;display:inline-block;margin-bottom:8px" /><div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;margin-bottom:6px">Livwell</div><div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8">Livwell Real Estate LLC &nbsp;·&nbsp; Dubai, UAE<br><a href="https://testlivwelldubai.vercel.app/" style="color:rgba(255,255,255,0.65);text-decoration:none">testlivwelldubai.vercel.app</a> &nbsp;·&nbsp; © 2026</div></div></div></body></html>`,
  },
  {
    key: 'forgot_password',
    label: 'Forgot Password',
    description: 'Sent when a user requests a password reset.',
    subject: 'Reset your Livwell password',
    from_name: 'Livwell', from_email: 'onboarding@resend.dev', enabled: true,
    variables: ['name', 'reset_url'],
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 0"><div style="background-color:#1a5c3a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="90" height="90" style="width:90px;height:90px;border-radius:50%;background-color:#fff;padding:6px;display:inline-block;margin-bottom:14px" /></div><div style="background-color:#fff;padding:36px 40px 32px"><h2 style="margin:0 0 12px;font-size:22px;color:#111;font-weight:700">Reset your password</h2><p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px">Hi <strong>{{name}}</strong>, we received a request to reset your Livwell password. Click the button below to set a new one. If you did not request this, you can safely ignore this email.</p><div style="text-align:center;margin:28px 0"><a href="{{reset_url}}" style="display:inline-block;padding:14px 40px;background-color:#1a5c3a;color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px">Reset My Password →</a></div><div style="background-color:#fef9ec;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-top:8px"><div style="font-size:13px;color:#92400e">⏰ This link expires in <strong>1 hour</strong>. After that you will need to request a new one.</div></div><p style="color:#9ca3af;font-size:13px;margin-top:24px">If you did not request a password reset, no action is needed — your account remains secure.</p></div><div style="background-color:#1a5c3a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="48" height="48" style="width:48px;height:48px;border-radius:50%;background-color:#fff;padding:3px;display:inline-block;margin-bottom:8px" /><div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;margin-bottom:6px">Livwell</div><div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8">Livwell Real Estate LLC &nbsp;·&nbsp; Dubai, UAE<br><a href="https://testlivwelldubai.vercel.app/" style="color:rgba(255,255,255,0.65);text-decoration:none">testlivwelldubai.vercel.app</a> &nbsp;·&nbsp; © 2026</div></div></div></body></html>`,
  },
  {
    key: 'enquiry_property',
    label: 'Property Enquiry',
    description: 'Sent to the lead when they enquire about a property.',
    subject: 'Thanks for your enquiry — {{property_title}}',
    from_name: 'Livwell', from_email: 'onboarding@resend.dev', enabled: true,
    variables: ['name', 'property_title', 'agent_name', 'agent_phone'],
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 0"><div style="background-color:#1a5c3a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="90" height="90" style="width:90px;height:90px;border-radius:50%;background-color:#fff;padding:6px;display:inline-block;margin-bottom:14px" /></div><div style="background-color:#fff;padding:36px 40px 32px"><div style="display:inline-block;background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:16px">Enquiry Received</div><h2 style="margin:0 0 10px;font-size:22px;color:#111;font-weight:700">Thank you, {{name}}!</h2><p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px">We have received your enquiry for <strong style="color:#111">{{property_title}}</strong>. Our agent will review your request and get back to you shortly — usually within a few hours.</p><div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Your Dedicated Agent</div><div style="display:flex;align-items:center;gap:14px"><div style="width:48px;height:48px;border-radius:50%;background-color:#1a5c3a;color:#fff;font-size:20px;font-weight:700;text-align:center;line-height:48px;flex-shrink:0">A</div><div><div style="font-size:16px;font-weight:700;color:#111;margin-bottom:4px">{{agent_name}}</div><div style="font-size:13px;color:#1a5c3a;font-weight:600">📞 {{agent_phone}}</div></div></div></div><div style="text-align:center;margin:28px 0"><a href="https://testlivwelldubai.vercel.app/" style="display:inline-block;padding:14px 40px;background-color:#1a5c3a;color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px">Browse More Properties →</a></div></div><div style="background-color:#1a5c3a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="48" height="48" style="width:48px;height:48px;border-radius:50%;background-color:#fff;padding:3px;display:inline-block;margin-bottom:8px" /><div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;margin-bottom:6px">Livwell</div><div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8">Livwell Real Estate LLC &nbsp;·&nbsp; Dubai, UAE<br><a href="https://testlivwelldubai.vercel.app/" style="color:rgba(255,255,255,0.65);text-decoration:none">testlivwelldubai.vercel.app</a> &nbsp;·&nbsp; © 2026</div></div></div></body></html>`,
  },
  {
    key: 'enquiry_project',
    label: 'Project Enquiry',
    description: 'Sent to the lead when they enquire about an off-plan project.',
    subject: 'Thanks for your interest — {{project_title}}',
    from_name: 'Livwell', from_email: 'onboarding@resend.dev', enabled: true,
    variables: ['name', 'project_title', 'agent_name', 'agent_phone'],
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 0"><div style="background-color:#1a5c3a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="90" height="90" style="width:90px;height:90px;border-radius:50%;background-color:#fff;padding:6px;display:inline-block;margin-bottom:14px" /><div style="color:#fff;font-size:26px;font-weight:700;margin-bottom:4px">Livwell</div></div><div style="background-color:#fff;padding:36px 40px 32px"><div style="display:inline-block;background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:16px">Interest Received</div><h2 style="margin:0 0 10px;font-size:22px;color:#111;font-weight:700">Thank you, {{name}}!</h2><p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px">We have received your interest in the <strong style="color:#111">{{project_title}}</strong> project. One of our off-plan specialists will reach out shortly to discuss pricing, payment plans, and availability.</p><div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Your Project Specialist</div><div style="display:flex;align-items:center;gap:14px"><div style="width:48px;height:48px;border-radius:50%;background-color:#1a5c3a;color:#fff;font-size:20px;font-weight:700;text-align:center;line-height:48px;flex-shrink:0">A</div><div><div style="font-size:16px;font-weight:700;color:#111;margin-bottom:4px">{{agent_name}}</div><div style="font-size:13px;color:#1a5c3a;font-weight:600">📞 {{agent_phone}}</div></div></div></div><div style="text-align:center;margin:28px 0"><a href="https://testlivwelldubai.vercel.app/projects" style="display:inline-block;padding:14px 40px;background-color:#1a5c3a;color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px">Explore More Projects →</a></div></div><div style="background-color:#1a5c3a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="48" height="48" style="width:48px;height:48px;border-radius:50%;background-color:#fff;padding:3px;display:inline-block;margin-bottom:8px" /><div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;margin-bottom:6px">Livwell</div><div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8">Livwell Real Estate LLC &nbsp;·&nbsp; Dubai, UAE<br><a href="https://testlivwelldubai.vercel.app/" style="color:rgba(255,255,255,0.65);text-decoration:none">testlivwelldubai.vercel.app</a> &nbsp;·&nbsp; © 2026</div></div></div></body></html>`,
  },
  {
    key: 'enquiry_commercial',
    label: 'Commercial Enquiry',
    description: 'Sent to the lead when they enquire about a commercial property.',
    subject: 'Thanks for your commercial enquiry — {{property_title}}',
    from_name: 'Livwell', from_email: 'onboarding@resend.dev', enabled: true,
    variables: ['name', 'property_title', 'agent_name', 'agent_phone'],
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 0"><div style="background-color:#1a5c3a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="90" height="90" style="width:90px;height:90px;border-radius:50%;background-color:#fff;padding:6px;display:inline-block;margin-bottom:14px" /><div style="color:#fff;font-size:26px;font-weight:700;margin-bottom:4px">Livwell</div></div><div style="background-color:#fff;padding:36px 40px 32px"><div style="display:inline-block;background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:16px">Enquiry Received</div><h2 style="margin:0 0 10px;font-size:22px;color:#111;font-weight:700">Thank you, {{name}}!</h2><p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px">We have received your commercial property enquiry for <strong style="color:#111">{{property_title}}</strong>. Our commercial specialist will review your request and get in touch with you shortly.</p><div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Your Commercial Specialist</div><div style="display:flex;align-items:center;gap:14px"><div style="width:48px;height:48px;border-radius:50%;background-color:#1a5c3a;color:#fff;font-size:20px;font-weight:700;text-align:center;line-height:48px;flex-shrink:0">A</div><div><div style="font-size:16px;font-weight:700;color:#111;margin-bottom:4px">{{agent_name}}</div><div style="font-size:13px;color:#1a5c3a;font-weight:600">📞 {{agent_phone}}</div></div></div></div><div style="text-align:center;margin:28px 0"><a href="https://testlivwelldubai.vercel.app/commercial-properties" style="display:inline-block;padding:14px 40px;background-color:#1a5c3a;color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px">Browse More Commercial →</a></div></div><div style="background-color:#1a5c3a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="48" height="48" style="width:48px;height:48px;border-radius:50%;background-color:#fff;padding:3px;display:inline-block;margin-bottom:8px" /><div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;margin-bottom:6px">Livwell</div><div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8">Livwell Real Estate LLC &nbsp;·&nbsp; Dubai, UAE<br><a href="https://testlivwelldubai.vercel.app/" style="color:rgba(255,255,255,0.65);text-decoration:none">testlivwelldubai.vercel.app</a> &nbsp;·&nbsp; © 2026</div></div></div></body></html>`,
  },
  {
    key: 'agent_credentials',
    label: 'Agent Account Created',
    description: 'Sent to newly created agents with their login credentials.',
    subject: 'Your Livwell Agent account is ready',
    from_name: 'Livwell Admin', from_email: 'onboarding@resend.dev', enabled: true,
    variables: ['name', 'email', 'password', 'portal_url'],
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:24px 0"><div style="background-color:#1a5c3a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="90" height="90" style="width:90px;height:90px;border-radius:50%;background-color:#fff;padding:6px;display:inline-block;margin-bottom:14px" /><div style="color:#fff;font-size:26px;font-weight:700;margin-bottom:4px">Livwell</div></div><div style="background-color:#fff;padding:36px 40px 32px"><h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:700">Welcome to the team, {{name}}! 🏡</h2><p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px">We are excited to have you on board as part of the Livwell family. Your agent account is set up and ready. Use the credentials below to log in to your portal.</p><div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:22px 24px;margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:#166534;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px">Your Login Credentials</div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:9px 0;font-size:13px;color:#6b7280;width:110px;vertical-align:top">Portal URL</td><td style="padding:9px 0;font-size:13px;font-weight:700;color:#111"><a href="{{portal_url}}" style="color:#1a5c3a;text-decoration:none">{{portal_url}}</a></td></tr><tr><td style="padding:9px 0;font-size:13px;color:#6b7280;border-top:1px solid #dcfce7;vertical-align:top">Email</td><td style="padding:9px 0;font-size:13px;font-weight:700;color:#111;border-top:1px solid #dcfce7">{{email}}</td></tr><tr><td style="padding:9px 0;font-size:13px;color:#6b7280;border-top:1px solid #dcfce7;vertical-align:top">Password</td><td style="padding:9px 0;font-size:13px;font-weight:700;color:#111;border-top:1px solid #dcfce7;letter-spacing:1px">{{password}}</td></tr></table></div><div style="background-color:#f9fafb;border-radius:12px;padding:20px 24px;margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px">What you can do in the portal</div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-bottom:12px;vertical-align:top;width:44px"><div style="width:32px;height:32px;border-radius:50%;background-color:#dcfce7;text-align:center;line-height:32px;font-size:15px">📋</div></td><td style="padding-bottom:12px;padding-left:12px;vertical-align:top"><div style="font-size:14px;font-weight:600;color:#111;margin-bottom:2px">Manage Your Leads</div><div style="font-size:12px;color:#6b7280;line-height:1.5">View, track, and follow up on all incoming property enquiries assigned to you.</div></td></tr><tr><td style="padding-bottom:12px;vertical-align:top"><div style="width:32px;height:32px;border-radius:50%;background-color:#dcfce7;text-align:center;line-height:32px;font-size:15px">💬</div></td><td style="padding-bottom:12px;padding-left:12px;vertical-align:top"><div style="font-size:14px;font-weight:600;color:#111;margin-bottom:2px">Message Clients Directly</div><div style="font-size:12px;color:#6b7280;line-height:1.5">Communicate with leads through the built-in messaging system.</div></td></tr><tr><td style="padding-bottom:12px;vertical-align:top"><div style="width:32px;height:32px;border-radius:50%;background-color:#dcfce7;text-align:center;line-height:32px;font-size:15px">🏠</div></td><td style="padding-bottom:12px;padding-left:12px;vertical-align:top"><div style="font-size:14px;font-weight:600;color:#111;margin-bottom:2px">Access Property Listings</div><div style="font-size:12px;color:#6b7280;line-height:1.5">Browse and manage all Livwell property and project listings.</div></td></tr><tr><td style="vertical-align:top"><div style="width:32px;height:32px;border-radius:50%;background-color:#dcfce7;text-align:center;line-height:32px;font-size:15px">👤</div></td><td style="padding-left:12px;vertical-align:top"><div style="font-size:14px;font-weight:600;color:#111;margin-bottom:2px">Update Your Profile</div><div style="font-size:12px;color:#6b7280;line-height:1.5">Add your photo, bio, and contact details so clients know who you are.</div></td></tr></table></div><div style="text-align:center;margin:28px 0 20px"><a href="{{portal_url}}" style="display:inline-block;padding:14px 40px;background-color:#1a5c3a;color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px">Log In to Agent Portal →</a></div><p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">If you need help getting started, reach out to your administrator — we are here to help.</p></div><div style="background-color:#1a5c3a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center"><img src="https://testlivwelldubai.vercel.app/images/livwell%20fav%20logo.png" alt="Livwell" width="48" height="48" style="width:48px;height:48px;border-radius:50%;background-color:#fff;padding:3px;display:inline-block;margin-bottom:8px" /><div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;margin-bottom:6px">Livwell</div><div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8">Livwell Real Estate LLC &nbsp;·&nbsp; Dubai, UAE<br><a href="https://testlivwelldubai.vercel.app/" style="color:rgba(255,255,255,0.65);text-decoration:none">testlivwelldubai.vercel.app</a> &nbsp;·&nbsp; © 2026<br>This email is confidential — do not share your credentials.</div></div></div></body></html>`,
  },
];

@Component({
  selector: 'app-admin-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-templates.component.html',
  styleUrl: './admin-templates.component.scss',
})
export class AdminTemplatesComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  templates    = signal<EmailTemplate[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  selected     = signal<EmailTemplate | null>(null);
  previewMode  = signal(true);
  testEmail    = signal('');
  sendingTest  = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    this.loading.set(true);

    // Upsert defaults so the DB always reflects the latest template designs
    const rows = DEFAULT_TEMPLATES.map(t => ({
      key:         t.key,
      label:       t.label,
      description: t.description,
      subject:     t.subject,
      body:        t.body,
      from_name:   t.from_name,
      from_email:  t.from_email,
      variables:   t.variables,
    }));
    await this.sb.from('email_templates').upsert(rows, { onConflict: 'key', ignoreDuplicates: false });

    const { data } = await this.sb
      .from('email_templates')
      .select('*')
      .order('id');

    if (data && data.length > 0) {
      const HIDDEN_KEYS = ['signup_welcome', 'customer_credentials', 'customer_account_credentials'];
      const HIDDEN_LABELS = ['customer account credentials'];
      this.templates.set((data as EmailTemplate[]).filter(t =>
        !HIDDEN_KEYS.includes(t.key) && !HIDDEN_LABELS.includes(t.label.toLowerCase())
      ));
    }

    this.loading.set(false);
    if (this.templates().length > 0 && !this.selected()) {
      this.selected.set({ ...this.templates()[0] });
    }
  }

  selectTemplate(tpl: EmailTemplate): void {
    this.selected.set({ ...tpl });
  }

  async save(): Promise<void> {
    const t = this.selected();
    if (!t) return;
    this.saving.set(true);
    const { error } = await this.sb.from('email_templates').update({
      subject:    t.subject,
      body:       t.body,
      from_name:  t.from_name,
      from_email: t.from_email,
      enabled:    t.enabled,
    }).eq('id', t.id);
    this.saving.set(false);
    if (error) { this.toast.error('Failed to save template.'); return; }
    // Update list
    this.templates.update(list => list.map(l => l.id === t.id ? { ...t } : l));
    this.toast.success('Template saved.');
  }

  async toggleEnabled(tpl: EmailTemplate): Promise<void> {
    const newVal = !tpl.enabled;
    await this.sb.from('email_templates').update({ enabled: newVal }).eq('id', tpl.id);
    this.templates.update(list => list.map(l => l.id === tpl.id ? { ...l, enabled: newVal } : l));
    if (this.selected()?.id === tpl.id) this.selected.update(s => s ? { ...s, enabled: newVal } : s);
  }

  async sendTest(): Promise<void> {
    const t = this.selected();
    const email = this.testEmail().trim();
    if (!t || !email) return;
    this.sendingTest.set(true);

    // Build dummy data for preview variables
    const dummyData: Record<string, string> = {
      to_email:       email,
      name:           'Test User',
      email:          email,
      property_title: 'Luxury Apartment — Downtown Dubai',
      project_title:  'Creek Horizon Residences',
      agent_name:     'Sarah Johnson',
      agent_phone:    '+971 50 123 4567',
      reset_url:      'https://testlivwelldubai.vercel.app/reset-password?token=TEST',
      portal_url:     'https://testlivwelldubai.vercel.app/agent/login',
      password:       'TempPass@123',
    };

    const { data: { session } } = await this.sb.auth.getSession();
    const res = await fetch(
      `${(this.sb as any).supabaseUrl}/functions/v1/send-email`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ type: t.key, data: dummyData }),
      }
    );
    this.sendingTest.set(false);
    if (res.ok) this.toast.success('Test email sent to ' + email);
    else { const b = await res.json(); this.toast.error('Failed: ' + (b.error || 'Unknown error')); }
  }

  wrapVar(v: string): string { return '{{' + v + '}}'; }

  get previewHtml(): string {
    const t = this.selected();
    if (!t) return '';
    const dummy: Record<string, string> = {
      name: 'Test User', email: 'test@example.com',
      property_title: 'Luxury Apartment — Downtown Dubai',
      project_title: 'Creek Horizon Residences',
      agent_name: 'Sarah Johnson', agent_phone: '+971 50 123 4567',
      reset_url: '#', portal_url: 'https://testlivwelldubai.vercel.app/agent/login', password: 'TempPass@123',
    };
    return t.body.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => dummy[k] ?? `{{${k}}}`);
  }
}
