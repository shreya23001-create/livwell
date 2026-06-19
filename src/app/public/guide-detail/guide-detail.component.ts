import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface GuideStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

interface Guide {
  slug: string;
  title: string;
  subtitle: string;
  hero: string;
  intro: string;
  steps: GuideStep[];
  cta: string;
  ctaLink: string;
}

export const ALL_GUIDES: { slug: string; title: string; sub: string; icon: string }[] = [
  { slug: 'buying-guide',       title: 'Buying Guide',          sub: 'How to Buy Property in Dubai',       icon: '🏠' },
  { slug: 'off-plan-guide',     title: 'Off-Plan Guide',         sub: 'How to Buy Off-Plan in Dubai',       icon: '🏗️' },
  { slug: 'renting-guide',      title: 'Renting Guide',          sub: 'How to Rent Property in Dubai',      icon: '🔑' },
  { slug: 'selling-guide',      title: 'Selling Guide',          sub: 'How to Sell Property in Dubai',      icon: '💰' },
  { slug: 'mortgage-guide',     title: 'Mortgage Guide',         sub: 'Home Finance in Dubai Explained',    icon: '🏦' },
  { slug: 'tenancy-contract',   title: 'Tenancy Contract',       sub: 'Ejari & Tenancy Rights in Dubai',    icon: '📋' },
  { slug: 'bounced-cheque',     title: 'Bounced Cheque Guide',   sub: 'Your Rights & Options in Dubai',     icon: '⚠️' },
  { slug: 'dld-fees',           title: 'DLD Fees Guide',         sub: 'Transfer Costs Fully Explained',     icon: '🏛️' },
  { slug: 'golden-visa',        title: 'Golden Visa Guide',      sub: 'UAE Residency Through Investment',   icon: '🌟' },
];

const GUIDES: Guide[] = [
  {
    slug: 'buying-guide',
    title: 'Buying Guide',
    subtitle: 'How to Buy Property in Dubai',
    hero: 'Your complete step-by-step guide to purchasing real estate in Dubai — from setting your budget to receiving your keys.',
    intro: 'Dubai\'s real estate market offers world-class properties, tax-free investment returns, and a straightforward buying process for both residents and international investors. Follow these steps to make a confident, informed purchase.',
    cta: 'Browse Properties for Sale',
    ctaLink: '/properties',
    steps: [
      { number: 1,  icon: '💰', title: 'Set Your Budget',              description: 'Determine your total budget including the property price, Dubai Land Department (DLD) transfer fee (4%), agency fee (2%), and registration costs. Factor in mortgage arrangement fees if financing.' },
      { number: 2,  icon: '🏦', title: 'Get Mortgage Pre-Approval',    description: 'If you require financing, approach UAE-based banks for a mortgage pre-approval. Residents can borrow up to 80% LTV, and non-residents up to 75% LTV. Having pre-approval strengthens your negotiating position.' },
      { number: 3,  icon: '🤝', title: 'Choose a Registered Agent',    description: 'Work with a RERA-registered agent. At Livwell, our agents are fully certified and have deep knowledge of the Dubai market, ensuring you find the right property at the right price.' },
      { number: 4,  icon: '🔍', title: 'Search & View Properties',     description: 'Browse verified listings and schedule viewings. Consider the location, building facilities, service charges, and proximity to schools, transport, and amenities.' },
      { number: 5,  icon: '📝', title: 'Make an Offer',                description: 'Once you find your ideal property, make a formal offer through your agent. Negotiate price, payment terms, and any conditions. The seller will either accept, counter, or decline.' },
      { number: 6,  icon: '📄', title: 'Sign the MOU',                 description: 'A Memorandum of Understanding (Form F) is signed by both parties. The buyer pays a 10% security deposit held in trust until the DLD transfer is complete.' },
      { number: 7,  icon: '⚖️', title: 'Sales Progression',            description: 'Your agent co-ordinates between mortgage provider, seller, and developer. Legal due diligence is carried out — title deed verification, service charge clearance, and any outstanding payments.' },
      { number: 8,  icon: '✅', title: 'Apply for NOC',                description: 'The seller applies for a No Objection Certificate from the developer confirming there are no outstanding service charges or developer fees on the property.' },
      { number: 9,  icon: '🏛️', title: 'Transfer at DLD',              description: 'Both buyer and seller (or their legal representatives) attend the Dubai Land Department office. The transfer fee is paid, and ownership officially passes to the buyer.' },
      { number: 10, icon: '🔑', title: 'Receive Your Keys',            description: 'Once the title deed is issued in your name, keys are handed over. Your agent will guide you through utility connections and building registration.' },
    ],
  },
  {
    slug: 'off-plan-guide',
    title: 'Buying Off-Plan Guide',
    subtitle: 'How to Buy Off-Plan Property in Dubai',
    hero: 'Everything you need to know about investing in Dubai\'s off-plan property market — from developer selection to handover.',
    intro: 'Off-plan properties in Dubai offer attractive entry prices, flexible payment plans, and the potential for significant capital appreciation before completion. Here is how to navigate the process safely and confidently.',
    cta: 'Explore Off-Plan Projects',
    ctaLink: '/projects',
    steps: [
      { number: 1, icon: '🎯', title: 'Define Your Requirements',      description: 'Clarify your investment goals — are you buying to live, rent, or resell? Decide on your preferred location, property type, size, and budget. Off-plan typically requires a lower initial deposit (5–20%).' },
      { number: 2, icon: '🏗️', title: 'Research the Developer',        description: 'Only buy from RERA-registered developers with a strong track record. Review their completed projects, delivery timelines, and customer reviews. Livwell works exclusively with reputable, regulated developers.' },
      { number: 3, icon: '📊', title: 'Understand the Payment Plan',   description: 'Most Dubai developers offer installment plans — for example 20/40/40 (20% on booking, 40% during construction, 40% on handover). Ensure the plan aligns with your cash flow.' },
      { number: 4, icon: '📋', title: 'Reserve & Sign Agreement',      description: 'Pay the booking deposit (typically 5–10%) to secure your unit. Then sign the Sale and Purchase Agreement (SPA) which outlines the full payment schedule, handover date, and specifications.' },
      { number: 5, icon: '💳', title: 'Maintain Payment Schedule',     description: 'Make payments as per the SPA schedule. Payments go into an escrow account regulated by RERA, ensuring your funds are protected and only released at construction milestones.' },
      { number: 6, icon: '🔎', title: 'Snagging Inspection',          description: 'Before taking possession, conduct a thorough snagging inspection. Note any defects and ensure they are rectified by the developer before you sign off on the handover.' },
      { number: 7, icon: '🏠', title: 'Complete Handover',             description: 'Once satisfied, complete the handover paperwork, pay any outstanding balance, and receive your title deed and keys. Your investment is now complete.' },
    ],
  },
  {
    slug: 'renting-guide',
    title: 'Renting Guide',
    subtitle: 'How to Rent Property in Dubai',
    hero: 'A practical guide for tenants — covering everything from budgeting and viewings to contract signing and moving in.',
    intro: 'Renting in Dubai is a straightforward process once you understand the local practices. Leases are typically annual, paid via post-dated cheques, and regulated by RERA. Here is what to expect at every stage.',
    cta: 'Browse Rental Properties',
    ctaLink: '/properties',
    steps: [
      { number: 1, icon: '💰', title: 'Set Your Rental Budget',        description: 'In Dubai, rent is typically paid via 1–4 post-dated cheques for the full year. Budget for the annual rent, a security deposit (5% unfurnished / 10% furnished), and agency fee (typically 5% of annual rent).' },
      { number: 2, icon: '🔍', title: 'Search for Properties',         description: 'Browse verified listings through Livwell. Filter by area, property type, number of bedrooms, and budget. Consider commute time, nearby schools, parking, and building facilities.' },
      { number: 3, icon: '🏠', title: 'Schedule Viewings',             description: 'Book viewings with your agent. Visit multiple properties to compare conditions, natural light, storage space, and building quality. Note the condition of appliances, fixtures, and AC units.' },
      { number: 4, icon: '📝', title: 'Make an Offer',                 description: 'Once you find the right property, make an offer through your agent. You can negotiate on rent, number of cheques, and minor furnishing requests. Fewer cheques typically means higher rent.' },
      { number: 5, icon: '📄', title: 'Sign the Tenancy Contract',     description: 'The tenancy agreement is drafted and signed by both parties. It should specify the rent amount, payment schedule, lease duration, maintenance responsibilities, and any agreed terms.' },
      { number: 6, icon: '📋', title: 'Register with Ejari',           description: 'All Dubai tenancy contracts must be registered with Ejari (the official online rental registration system). Ejari registration is required for DEWA connection and visa renewals.' },
      { number: 7, icon: '💡', title: 'Connect DEWA',                  description: 'Apply for a Dubai Electricity and Water Authority (DEWA) connection using your Ejari certificate. This can be done online and takes 1–2 business days. A refundable deposit is required.' },
      { number: 8, icon: '📦', title: 'Move In',                       description: 'Conduct a check-in inspection with your landlord or agent and document the property condition with photos. Keep copies of all documents — tenancy contract, Ejari certificate, and DEWA connection.' },
      { number: 9, icon: '📅', title: 'Understand Renewal Rules',      description: 'RERA\'s rent calculator determines the maximum increase at renewal. Landlords must give 90 days written notice of any rent change. If no notice is given, the lease auto-renews on the same terms.' },
    ],
  },
  {
    slug: 'selling-guide',
    title: 'Selling Guide',
    subtitle: 'How to Sell Property in Dubai',
    hero: 'A step-by-step guide to selling your Dubai property quickly, at the right price, and with minimum hassle.',
    intro: 'Selling property in Dubai involves a clear legal process regulated by RERA and the Dubai Land Department. Whether you are selling a ready property or an off-plan unit, this guide walks you through every stage.',
    cta: 'List Your Property',
    ctaLink: '/contact',
    steps: [
      { number: 1,  icon: '🎨', title: 'Prepare Your Property',        description: 'Before listing, ensure your property is clean, well-maintained, and presented at its best. Consider minor repairs, repainting, and decluttering. Professional photography significantly increases enquiry rates.' },
      { number: 2,  icon: '📊', title: 'Get a Market Appraisal',       description: 'Your Livwell agent will conduct a comparative market analysis based on recent sales in your building and area. This gives you a realistic, data-backed asking price to attract genuine buyers.' },
      { number: 3,  icon: '📋', title: 'Sign the Listing Agreement',   description: 'Sign a Form A (Listing Agreement) with your registered agent. This authorises them to market your property. Ensure the agreed asking price, commission rate (typically 2%), and exclusivity terms are clearly stated.' },
      { number: 4,  icon: '📣', title: 'Market Your Property',         description: 'Your agent lists your property on major portals and Livwell\'s own platform with professional photos and a compelling description. Quality listings with accurate details attract more serious buyers.' },
      { number: 5,  icon: '👁️', title: 'Conduct Viewings',             description: 'Be flexible with viewing times to maximise buyer access. Your agent accompanies all viewings. Ensure the property is tidy and well-lit for each showing.' },
      { number: 6,  icon: '🤝', title: 'Negotiate & Accept an Offer',  description: 'Your agent presents all offers and advises on negotiation strategy. Once you agree on a price and terms, both parties sign a Memorandum of Understanding (MOU / Form F). The buyer pays a 10% deposit.' },
      { number: 7,  icon: '🏦', title: 'Handle Mortgage Considerations',description: 'If the buyer is taking a mortgage, or if your property has an existing mortgage, the bank(s) need to be co-ordinated. Mortgage discharge and new mortgage drawdown must align with the DLD transfer date.' },
      { number: 8,  icon: '✅', title: 'Apply for NOC',                description: 'Apply to the developer for a No Objection Certificate (NOC) confirming no outstanding service charges or fees. The NOC typically takes 5–10 working days and is required before the DLD transfer.' },
      { number: 9,  icon: '💡', title: 'Disconnect Utilities',         description: 'Clear your DEWA account and obtain a clearance letter. Cancel any building-specific access cards, parking permits, or gym memberships before the transfer date.' },
      { number: 10, icon: '🏛️', title: 'Complete Transfer at DLD',     description: 'Attend the Dubai Land Department with the buyer. The DLD transfer fee (4%, paid by buyer) and trustee fee are settled. Ownership is transferred and the new title deed issued.' },
      { number: 11, icon: '💰', title: 'Receive Your Proceeds',        description: 'Once the title deed is transferred, the buyer releases the balance payment via manager\'s cheque or bank transfer. Your agent\'s commission is settled. Your sale is complete.' },
    ],
  },
  {
    slug: 'mortgage-guide',
    title: 'Mortgage & Home Finance Guide',
    subtitle: 'Home Finance in Dubai Explained',
    hero: 'Understand Dubai mortgage options, eligibility requirements, interest rates, and how to secure the best deal for your purchase.',
    intro: 'Financing a property in Dubai is available to both UAE residents and non-residents through a range of local and international banks. Understanding the rules, ratios, and process will help you borrow confidently and cost-effectively.',
    cta: 'Browse Properties for Sale',
    ctaLink: '/properties',
    steps: [
      { number: 1, icon: '📊', title: 'Understand Loan-to-Value (LTV)', description: 'UAE residents can borrow up to 80% of property value for properties under AED 5M, and 70% above AED 5M. Non-residents are capped at 75% LTV. The remaining amount is your down payment.' },
      { number: 2, icon: '🔍', title: 'Check Your Eligibility',         description: 'Banks assess your monthly income, employment status, existing liabilities, and credit score (Al Etihad Credit Bureau). Most banks require a minimum salary of AED 15,000/month for residents.' },
      { number: 3, icon: '🏦', title: 'Compare Lenders & Rates',        description: 'Interest rates in Dubai are either fixed (for 1–5 years) or variable (linked to EIBOR). Compare rates from multiple banks — even a 0.25% difference saves tens of thousands over a 25-year term.' },
      { number: 4, icon: '📋', title: 'Get Pre-Approval',               description: 'Submit your income documents, bank statements (6 months), passport, and Emirates ID to receive a mortgage pre-approval letter. This is valid for 60–90 days and shows sellers you are a serious buyer.' },
      { number: 5, icon: '🏠', title: 'Property Valuation',             description: 'Once you identify a property, the bank appoints a RERA-approved valuer. The mortgage is calculated on the lower of the purchase price or the valuation. Valuation fees are typically AED 2,500–3,500.' },
      { number: 6, icon: '📄', title: 'Final Offer Letter',             description: 'After valuation, the bank issues a formal offer letter detailing the loan amount, term, rate, and monthly repayment. Review the terms carefully — particularly early settlement fees (typically 1% of outstanding balance).' },
      { number: 7, icon: '🔑', title: 'Mortgage Registration at DLD',   description: 'The mortgage is registered with the Dubai Land Department alongside the property transfer. A mortgage registration fee of 0.25% of the loan amount applies, plus AED 290 in admin fees.' },
    ],
  },
  {
    slug: 'tenancy-contract',
    title: 'Tenancy Contract Guide',
    subtitle: 'Ejari & Tenancy Rights in Dubai',
    hero: 'Everything landlords and tenants need to know about Dubai tenancy contracts, Ejari registration, renewals, and rights.',
    intro: 'Dubai\'s rental market is governed by RERA Law No. 26 of 2007 and its amendments. The Ejari system ensures all tenancy contracts are formally registered, protecting both landlords and tenants throughout the tenancy lifecycle.',
    cta: 'Browse Rental Properties',
    ctaLink: '/properties',
    steps: [
      { number: 1, icon: '📝', title: 'Draft the Tenancy Agreement',    description: 'The tenancy contract should clearly state: the agreed annual rent, payment schedule (number of cheques), lease start and end dates, security deposit amount, and any agreed special conditions.' },
      { number: 2, icon: '✍️', title: 'Both Parties Sign',              description: 'Both landlord and tenant must sign the tenancy contract. If there is a property management company involved, they may sign on behalf of the landlord with a valid Power of Attorney.' },
      { number: 3, icon: '📋', title: 'Register with Ejari',            description: 'The tenancy must be registered with Ejari — Dubai\'s official rental index. Registration can be done via the Dubai REST app, Ejari website, or authorised typing centres. The fee is approximately AED 220.' },
      { number: 4, icon: '📜', title: 'Ejari Certificate Issued',       description: 'Once registered, an Ejari certificate is issued within minutes online. This certificate is required to connect DEWA utilities, apply for family visas, and renew labour cards or trade licences.' },
      { number: 5, icon: '🔄', title: 'Renewal Process',                description: 'The landlord must give 90 days written notice before the contract end date if they wish to change any terms (including rent). If no notice is given, the contract automatically renews on the same terms.' },
      { number: 6, icon: '📊', title: 'RERA Rent Calculator',           description: 'RERA publishes a rent index updated annually. Any rent increase at renewal must comply with this index. If current rent is within 10% of market rate, no increase is permitted. Increases are capped at 5–20% based on the gap.' },
      { number: 7, icon: '⚖️', title: 'Dispute Resolution',             description: 'If a dispute arises, either party can file with the Rental Dispute Settlement Centre (RDSC) at the Dubai Land Department. Disputes about rent increases, evictions, or maintenance are handled here.' },
    ],
  },
  {
    slug: 'bounced-cheque',
    title: 'Bounced Cheque Guide',
    subtitle: 'Your Rights & Options in Dubai',
    hero: 'A practical guide for landlords and tenants on handling bounced cheques in Dubai — legal procedures, penalties, and resolution options.',
    intro: 'Cheques remain the primary payment method for rent in Dubai. A bounced cheque is a serious matter under UAE law and can have significant legal consequences. Understanding your rights and options is essential for both landlords and tenants.',
    cta: 'Talk to Our Team',
    ctaLink: '/contact',
    steps: [
      { number: 1, icon: '⚠️', title: 'What is a Bounced Cheque?',     description: 'A cheque bounces when there are insufficient funds in the account, the account is closed, or a stop payment order is placed. In Dubai, presenting a cheque you know cannot be honoured is a criminal offence.' },
      { number: 2, icon: '🏦', title: 'Bank Notification',              description: 'When a cheque is returned, the bank issues a "Return Cheque Notice" stating the reason. Keep this document — it is essential for any legal proceedings. Banks typically charge AED 50–100 for the return.' },
      { number: 3, icon: '📞', title: 'Contact the Issuer Immediately', description: 'Before taking legal action, contact the cheque issuer. Many bounced cheques are due to administrative errors or temporary cash flow issues. Request a replacement cheque or an alternative payment arrangement.' },
      { number: 4, icon: '📋', title: 'File a Police Complaint',        description: 'If the issuer does not resolve the matter, you can file a criminal complaint at any police station. The original bounced cheque and the bank return notice are required. The issuer may be summoned and prosecuted.' },
      { number: 5, icon: '⚖️', title: 'Civil Case at RDSC',            description: 'For rental cheques specifically, landlords can also file a civil case at the Rental Dispute Settlement Centre (RDSC) for recovery of the amount plus damages. This runs alongside or instead of the criminal process.' },
      { number: 6, icon: '🔄', title: 'Decriminalisation Update',       description: 'As of 2022, cheques under AED 200,000 that bounce due to insufficient funds may be handled civilly rather than criminally, though criminal provisions still apply in cases of fraud or wilful non-payment.' },
      { number: 7, icon: '🛡️', title: 'How to Protect Yourself',       description: 'Always verify a tenant\'s financial standing before accepting cheques. Consider requesting a credit check or references. Landlords can also opt for cash payment, bank transfer, or use property management companies for added security.' },
    ],
  },
  {
    slug: 'dld-fees',
    title: 'DLD Fees & Transfer Costs',
    subtitle: 'A Complete Breakdown of Buying Costs in Dubai',
    hero: 'A full breakdown of all fees, charges, and costs involved in buying or selling property in Dubai — so there are no surprises.',
    intro: 'Buying property in Dubai involves several fees beyond the purchase price. Understanding all costs upfront helps you budget accurately and avoid any surprises at the transfer stage. Here is a complete breakdown of every charge you may encounter.',
    cta: 'Browse Properties for Sale',
    ctaLink: '/properties',
    steps: [
      { number: 1, icon: '🏛️', title: 'DLD Transfer Fee — 4%',         description: 'The Dubai Land Department charges 4% of the purchase price as a transfer fee. This is paid at the DLD office during the ownership transfer. It is typically split between buyer and seller unless otherwise agreed — in practice, most sellers require the buyer to pay the full 4%.' },
      { number: 2, icon: '📄', title: 'DLD Admin Fee',                  description: 'In addition to the 4% transfer fee, a flat administrative fee of AED 580 (for properties under AED 500,000) or AED 4,000 (for properties above AED 500,000) is charged for processing the transfer.' },
      { number: 3, icon: '🏠', title: 'Title Deed Issuance Fee',        description: 'A fee of AED 250 is charged for issuance of the new title deed in the buyer\'s name. This is settled at the DLD office on the day of transfer.' },
      { number: 4, icon: '🤝', title: 'Agency Commission — 2%',         description: 'The buyer\'s agent charges 2% of the purchase price plus 5% VAT. If the same agent represents both parties, they may charge 2% from each side. Always confirm commission terms in writing before proceeding.' },
      { number: 5, icon: '🔎', title: 'Property Valuation Fee',         description: 'For mortgage purchases, a DLD-approved valuer assesses the property. This costs AED 2,500–3,500 and is paid by the buyer. Cash buyers are not required to have a formal valuation, though it is recommended.' },
      { number: 6, icon: '🏦', title: 'Mortgage Registration Fee',      description: 'If purchasing with a mortgage, a 0.25% mortgage registration fee is payable to the DLD on the loan amount, plus AED 290 in admin fees. This is in addition to any bank arrangement or processing fees.' },
      { number: 7, icon: '🏗️', title: 'Off-Plan Developer Fees',        description: 'Off-plan purchases may have additional charges including an Oqood registration fee (4% of property value, paid at SPA signing), knowledge fee (AED 10), and innovation fee (AED 10). Some developers also charge an NOC fee at handover.' },
      { number: 8, icon: '📊', title: 'Total Cost Summary',             description: 'For a typical AED 2M ready property purchase (cash): DLD fee AED 80,000 + admin AED 4,000 + title deed AED 250 + agency AED 40,000 + VAT AED 2,000 = approximately AED 126,250 in fees on top of the purchase price (~6.3%).' },
    ],
  },
  {
    slug: 'golden-visa',
    title: 'UAE Golden Visa Guide',
    subtitle: 'UAE Residency Through Real Estate Investment',
    hero: 'How to secure a UAE Golden Visa through property investment — eligibility, property thresholds, duration, and the full application process.',
    intro: 'The UAE Golden Visa offers long-term residency of 5 or 10 years to property investors, entrepreneurs, skilled professionals, and outstanding students. For real estate investors, it is one of the most attractive pathways to residency in the region.',
    cta: 'Explore Investment Properties',
    ctaLink: '/properties',
    steps: [
      { number: 1, icon: '🌟', title: 'Eligibility for Investors',      description: 'Real estate investors who own property worth at least AED 2 million (either one property or multiple properties totalling AED 2M+) are eligible for a 10-year Golden Visa. The property must be fully paid — mortgaged properties may qualify if the equity portion meets the threshold.' },
      { number: 2, icon: '🏠', title: 'Property Requirements',          description: 'The property must be located in Dubai (or other UAE emirate) and registered with the Dubai Land Department. Off-plan properties qualify once a minimum of AED 2M has been paid to the developer and confirmed via a DLD letter.' },
      { number: 3, icon: '📋', title: 'Required Documents',             description: 'You will need: a valid passport, UAE entry permit or residence visa, Emirates ID (if already a resident), title deed or DLD valuation letter confirming AED 2M+ value, and a good conduct certificate from your home country.' },
      { number: 4, icon: '🏛️', title: 'Apply Through ICP or GDRFA',    description: 'Applications are submitted through the Federal Authority for Identity, Citizenship, Customs and Ports Security (ICP) or the General Directorate of Residency and Foreigners Affairs (GDRFA) in Dubai. Many applicants use a registered typing centre.' },
      { number: 5, icon: '📄', title: 'Medical & Emirates ID',          description: 'As part of the visa process, you will complete a medical fitness test (chest X-ray and blood test) and enrol your biometrics for the Emirates ID. These are standard requirements for all UAE residency visas.' },
      { number: 6, icon: '👨‍👩‍👧', title: 'Sponsor Family Members',         description: 'Golden Visa holders can sponsor their spouse, children (of any age), and domestic helpers on the same 10-year visa. Sponsored family members do not need to meet the investment threshold independently.' },
      { number: 7, icon: '✅', title: 'Visa Validity & Renewal',        description: 'The Golden Visa is issued for 10 years and is renewable as long as you continue to meet the eligibility criteria (i.e., maintain property ownership above AED 2M). Unlike standard visas, there is no requirement to enter the UAE every 6 months to keep it valid.' },
      { number: 8, icon: '💼', title: 'Other Golden Visa Categories',   description: 'Beyond real estate, Golden Visas are available to entrepreneurs (with a DED-licensed startup valued at AED 500K+), skilled professionals (doctors, engineers, scientists), outstanding students (top 5% in UAE/international universities), and humanitarian pioneers.' },
    ],
  },
];

@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './guide-detail.component.html',
  styleUrl: './guide-detail.component.scss',
})
export class GuideDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);

  guide    = signal<Guide | null>(null);
  allGuides = ALL_GUIDES;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.guide.set(GUIDES.find(g => g.slug === slug) ?? null);
  }
}
