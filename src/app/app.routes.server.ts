import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Admin, agent, customer portals — client-only (not indexed by Google)
  { path: 'admin/properties/:id/view', renderMode: RenderMode.Client },
  { path: 'admin/leads/:id',           renderMode: RenderMode.Client },
  { path: 'admin/**',                  renderMode: RenderMode.Client },
  { path: 'agent/leads/:id/followups', renderMode: RenderMode.Client },
  { path: 'agent/leads/:id',           renderMode: RenderMode.Client },
  { path: 'agent/**',                  renderMode: RenderMode.Client },
  { path: 'my/**',                     renderMode: RenderMode.Client },
  { path: 'customer',                  renderMode: RenderMode.Client },

  // Dynamic detail pages with params — SSR on each request
  { path: 'properties/:id',          renderMode: RenderMode.Server },
  { path: 'property-search/:slug',   renderMode: RenderMode.Server },
  { path: 'off-plan/:id',            renderMode: RenderMode.Server },
  { path: 'projects/:id',            renderMode: RenderMode.Server },
  { path: 'guides/:slug',            renderMode: RenderMode.Server },
  { path: 'blog/:slug',              renderMode: RenderMode.Server },
  { path: 'news/:slug',              renderMode: RenderMode.Server },
  { path: 'areas/:slug',             renderMode: RenderMode.Server },
  { path: 'developers/:slug',        renderMode: RenderMode.Server },
  { path: 'commercial/:id',          renderMode: RenderMode.Server },
  { path: 'luxury-project/:id',      renderMode: RenderMode.Server },
  { path: 'luxury-property/:id',     renderMode: RenderMode.Server },
  { path: 'branded-residence/:id',   renderMode: RenderMode.Server },

  // All other routes — prerender at build time
  { path: '**', renderMode: RenderMode.Prerender },
];
