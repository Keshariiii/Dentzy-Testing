/**
 * Shared static copy, media paths, catalog arrays, and contact metadata for Desktop & Mobile landing pages.
 * Single source of truth for Hero, Services, Process, About, Products, FutureServices, PerfectSmile, Contact, and Footer.
 */

export const HERO_MEDIA = {
  videoSrc: '/hero-bg.mp4',
  aboutVideoSrc: '/images/about-bg.mp4',
  productsVideoSrc: '/products-bg.mp4',
  logoSrc: '/dentzy-logo-v2.png',
  iconSrc: '/dentzy-icon.png',
  cuzImage: '/images/dentzy-cuz.webp',
  perfectSmileImage: '/images/perfect-smile.webp',
  line1: 'CRAFTED WITH CARE',
  line2: 'FOR PATIENTS WELFARE',
};

export const SERVICES_DATA = [
  {
    key: 'denture',
    displayTitle: 'Denture',
    title: 'Denture',
    image: '/images/denture.webp',
    description:
      "Tooth loss can significantly affect a person's appearance, confidence, and ability to chew and speak properly.",
  },
  {
    key: 'zirconia',
    displayTitle: 'Zirconia',
    title: 'Zirconia',
    image: '/images/zirconia.webp',
    description:
      'A zirconia crown is a full-coverage dental restoration made from zirconium dioxide, a high-strength ceramic material.',
  },
  {
    key: 'pfm',
    displayTitle: 'PFM',
    title: 'PFM',
    image: '/images/pfm.webp',
    description:
      'A PFM crown (Porcelain-Fused-to-Metal crown) has long been one of the most trusted restorations in dentistry.',
  },
  {
    key: 'metal',
    displayTitle: 'Metal',
    title: 'Metal',
    image: '/images/metal.webp',
    description:
      'A dental metal crown is a full-coverage restoration that protects and strengthens a damaged or heavily restored tooth.',
  },
];

export const PRODUCTS_DATA = [
  {
    key: 'denture',
    title: 'Complete Denture (single arch)',
    image: '/images/denture.webp',
    alt: 'Complete Denture',
    desc: "Tooth loss can significantly affect a person's appearance, confidence, and ability to chew and speak properly. A complete denture (single arch) is a reliable and time-tested solution for patients who have lost all teeth in either the upper (maxillary) or lower (mandibular) arch.",
  },
  {
    key: 'flexible',
    title: 'Flexible Denture',
    image: '/images/flexible-denture.webp',
    alt: 'Flexible Denture',
    desc: 'Flexible dentures are removable dental prostheses made from advanced thermoplastic materials rather than conventional acrylic or metal frameworks. Their flexible nature allows the denture to adapt comfortably to the natural contours of the gums, offering a secure and natural fit.',
  },
  {
    key: 'rpd',
    title: 'Removable Partial Denture',
    image: '/images/rpd.webp',
    alt: 'Removable Partial Denture',
    desc: 'Missing one or more teeth can affect chewing, speech, and overall confidence. A Removable Partial Denture (RPD) is a practical and effective tooth replacement option that restores function and aesthetics while preserving remaining natural teeth.',
  },
  {
    key: 'metal-cb',
    title: 'Metal Crowns and Bridges',
    image: '/images/metal.webp',
    alt: 'Metal Crowns and Bridges',
    desc: 'A dental metal crown is a full-coverage restoration that protects and strengthens a damaged or heavily restored tooth. A metal bridge replaces one or more missing teeth by anchoring artificial teeth to metal crowns placed on adjacent natural teeth.',
  },
  {
    key: 'pfm-prod',
    title: 'PFM',
    image: '/images/pfm.webp',
    alt: 'PFM',
    desc: 'A PFM crown (Porcelain-Fused-to-Metal crown) has long been one of the most trusted restorations in dentistry. Known for combining the strength of metal with the natural appearance of porcelain, PFM crowns offer a reliable and cost-effective solution for restoring damaged or weakened teeth.',
  },
  {
    key: 'zirconia-p',
    title: 'Zirconia',
    image: '/images/zirconia.webp',
    alt: 'Zirconia',
    desc: 'A zirconia crown is a full-coverage dental restoration made from zirconium dioxide, a high-strength ceramic material. It can be fabricated as monolithic zirconia (single solid structure) or layered zirconia (zirconia core with ceramic layering for enhanced aesthetics). Zirconia crowns are designed using advanced CAD/CAM technology, ensuring exceptional precision and consistency.',
    bullets: [
      'Monolithic zirconia (single solid structure)',
      'Layered zirconia (zirconia core with ceramic layering for enhanced aesthetics)',
    ],
  },
];

export const PROCESS_STEPS = [
  { step: 1, key: 'receive', label: 'Receive' },
  { step: 2, key: 'revive', label: 'Revive' },
  { step: 3, key: 'restore', label: 'Restore' },
];

export const PROCESS_COPY = {
  subtitle: 'Three steps from impression to perfection',
  cuzSubtitle: 'If "Dentzy" were a person, they would be a tech-savvy craftsman.',
  cuzImage: '/images/dentzy-cuz.webp',
  cuzAlt: 'Tech-savvy craftsman',
};

export const WHY_CHOOSE_DATA = [
  { key: 'quality', title: 'Quality Guarantee', desc: '5-10 years warranty on all restorations' },
  { key: 'turnaround', title: 'Fast Turnaround', desc: '5-7 days standard, 2-3 days rush' },
  { key: 'digital', title: 'Digital Workflow', desc: 'STL uploads for digital impressions' },
  { key: 'support', title: 'Dedicated Support', desc: 'Mon-Sat, 9 AM - 6 PM IST' },
];

export const ABOUT_DATA = {
  bannerSubtitle: 'WE ARE HERE TO WIN YOUR HEART AND EARN YOUR SMILE.',
  detailsTitle: 'Excellence Behind Every Smile',
  intro:
    "At DENTZY, we are dedicated to delivering the restorations that meet the needs of today's dentistry. We ensure consistent quality, accuracy, and aesthetics in every case we handle. Our focus is simple - to support dentists with reliable solutions that help create confident, natural-looking smiles.",
  paragraphs: [
    'Dentzy is a leading Indian dental brand founded by Tanish Dinesh Poojari, a Certified Dental Technician (CDT). Built on a legacy of excellence, Dentzy is backed by its parent company, Namrata Dental Solutions, which has been a trusted leader in the dental laboratory industry mainly in Maharashtra for more than 30 years. By combining decades of technical expertise with modern innovation, Dentzy continues to set new standards in dental craftsmanship.',
    'After observing the frequent friction between dental laboratories and clinicians — often caused by poor customer service and a lack of mutual understanding — we recognized a significant gap in the industry. To bridge this divide, we envisioned a fully digital dental laboratory ecosystem. Our goal is to streamline workflows and foster seamless communication between the dental lab, the dentist, and the patient.',
  ],
};

export const PERFECT_SMILE_DATA = {
  headlineLines: ['EVERYONE', 'DESERVES A', 'PERFECT', 'SMILE,'],
  subtitle: "and we're here to help you achieve yours",
  footerLines: ['Crafted With Care,', 'For Patients Welfare.'],
  image: '/images/perfect-smile.webp',
  imageAlt: 'Hands holding dental mold',
};

export const FUTURE_SERVICES = {
  text: 'We will continue to expand our offerings with new services in the future.',
};

export const CONTACT_INFO = {
  phone: '+91 95036 68112',
  phoneHref: 'tel:+919503668112',
  whatsappUrl: 'https://wa.me/919503668112',
  email: 'support@dentzy.in',
  emailHref: 'mailto:support@dentzy.in',
  labName: 'Namrata Dental Solutions',
  shortAddress: 'Vasai-Virar, Maharashtra',
  fullAddress: 'Dindayal Nagar, Vasai West - 401202, Maharashtra, India',
  hours: 'Mon-Sat, 9 AM - 6 PM IST',
  footerHours: 'Mon – Sat | 9:00 AM – 7:00 PM',
  footerHoursNote: '(Order related query)',
};
