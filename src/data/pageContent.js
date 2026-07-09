// Per-page content. Pages studied on the live site get real content; every other
// route gets structured, believable content from generate() so no page is empty.

import { ROUTES } from './nav.js'

// ── Hand-written content for pages studied on the live site ──────────────────
const SPECIFIC = {
  'about/overview': {
    lead: 'A prominent landmark of learning in Bengaluru, spread over a picturesque 3.5-acre campus in New Town, Yelahanka.',
    body: [
      'Seshadripuram First Grade College (SFGC) is committed to high standards of academic excellence through value-based education. With the best of faculty and infrastructure, the campus ambience is conducive to learning and forging your future.',
      'The campus is centrally and conveniently located on the Doddaballapur–Bengaluru Highway and is surrounded by industries, large and small, which provides rich avenues for industry–academia interaction. The college is permanently affiliated to Bengaluru City University, recognised by UGC under 2(f) & 12(B), accredited NAAC A+ and ISO 9001:2015 certified.',
    ],
    highlights: [
      { icon: '🏆', title: 'NAAC A+', text: 'Accredited with A+ grade for institutional quality.' },
      { icon: '📜', title: 'ISO 9001:2015', text: 'Certified quality management systems.' },
      { icon: '🌳', title: '3.5-Acre Campus', text: 'Green, well-equipped and centrally located.' },
      { icon: '🤝', title: 'Industry Links', text: 'Surrounded by industry for real-world exposure.' },
    ],
  },
  'about/vision-mission': {
    lead: 'Value-based education that builds dynamic leaders, entrepreneurs, academicians and professionals.',
    sections: [
      {
        heading: 'Our Vision',
        body: [
          'To constantly strive towards meeting the social need for affordable, relevant and quality education by inclusion and expansion of newer streams of academia, and to provide world-class infrastructure for learning, research and the application of knowledge.',
        ],
      },
      {
        heading: 'Our Mission',
        body: [
          'To excel in all activities, create an atmosphere of effective learning, generate a spirit of enquiry, induce healthy challenges and competitions, encourage sustainable accomplishments, and ensure enriching rewards to everyone — students, teachers, trustees, associates and society at large.',
        ],
      },
    ],
  },
  'about/principal-desk': {
    lead: "Dr. S. N. Venkatesh — Principal, Seshadripuram First Grade College.",
    body: [
      'S.F.G.C nurtures and supports a unique system of education structured on values and combines the tenets of academic excellence with corporate professionalism.',
      'The primary objective of education at S.F.G.C is to create dynamic leaders in the corporate sector, entrepreneurs, academicians, researchers and professionals who contribute to the development of society and the nation at large. We are committed to maintaining high academic standards and preparing our students to secure rewarding employment on graduation.',
      'At the same time, we believe that S.F.G.C students should develop as individuals — gaining in self-confidence and developing a sense of enterprise.',
    ],
  },
  'about/management': {
    lead: 'Seshadripuram Educational Trust (SET) — a public charitable trust founded on the ideals of accessible, quality education.',
    body: [
      'The Seshadripuram Group of Institutions was founded originally in 1930 by two educational enthusiasts of Seshadripuram — Smt. Anandamma and Smt. Seethamma — who started a primary school with about 20 children in two rooms in the present main campus of Seshadripuram.',
      'Seshadripuram Educational Trust (SET), a public charitable trust, was established in 1980 by the Seshadripuram Educational Association (registered in 1944). The institution has grown from strength to strength; today the total student strength is about 20,000, with about 24 educational institutions from kindergarten to postgraduate courses and about 1,000 employees.',
    ],
    sections: [
      {
        heading: 'Mission Statement',
        body: [
          'Seshadripuram Educational Trust believes that individuals from each stratum of society need affordable, relevant and quality education to fulfil personal aspirations. The Trust commits itself to a mission to excel in all its activities and to emerge as a global conglomerate of premier academic institutions.',
        ],
      },
      {
        heading: 'Why Study at Seshadripuram Institutions',
        list: [
          'Top quality education',
          'State-of-the-art infrastructure',
          'Diverse academic community',
          'Generous merit scholarships',
          'Outstanding faculty',
          'MoUs signed with top Universities in the USA, the UK and Europe',
          'Agreements signed for internships and placements',
          'Eminent visiting faculty',
        ],
      },
    ],
  },
  'admission': {
    lead: 'Admissions are open for the 2026–27 academic year across all UG and PG programmes.',
    body: [
      'SFGC follows a transparent, merit-based admission process. Applicants may apply online or visit the campus admission office. Seats are offered subject to eligibility and availability across our Commerce, Management, Science and Computer Application streams.',
    ],
    highlights: [
      { icon: '📝', title: 'Apply Online', text: 'Fill the enquiry form and submit required documents.' },
      { icon: '✅', title: 'Eligibility Check', text: 'Meet the qualifying criteria for your chosen programme.' },
      { icon: '🎓', title: 'Merit & Interaction', text: 'Selection based on academic merit and interaction.' },
      { icon: '💳', title: 'Confirm Seat', text: 'Pay the fee to confirm your admission.' },
    ],
    cta: true,
  },
  'students/placements': {
    lead: 'A dedicated Career Guidance & Placement Cell connects students with leading recruiters.',
    body: [
      'The college maintains strong ties with the corporate world through its Centre for Guidance and Employment (CGE). Regular training in aptitude, communication and domain skills prepares students for campus recruitment.',
    ],
    sections: [
      {
        heading: 'Our Recruiters',
        list: [
          'ICICI Bank', 'L&T', 'Amazon', 'Deloitte', 'Concentrix', 'Wipro', 'TCS',
          'Airtel', 'State Street', 'Punjab National Bank', 'Gallagher', 'Trident Hyundai',
        ],
      },
    ],
  },
}

// ── Generic generator for every other route ──────────────────────────────────
function generate(slug) {
  const meta = ROUTES[slug] || { label: 'Page', sectionLabel: 'SFGC' }
  const label = meta.label
  const section = meta.sectionLabel
  return {
    lead: `${label} — part of the ${section} at Seshadripuram First Grade College.`,
    body: [
      `Welcome to the ${label} page. At SFGC, ${label.toLowerCase()} reflects our commitment to value-based education, holistic development and academic excellence within the ${section} domain.`,
      `This section supports students and stakeholders with the information, resources and guidance they need. For specific queries relating to ${label.toLowerCase()}, please reach out to the college office at info@sfgc.ac.in or 080-22955369.`,
    ],
    highlights: [
      { icon: '🎯', title: 'Purpose', text: `Advancing ${label.toLowerCase()} in line with the college's vision.` },
      { icon: '👥', title: 'For Students', text: 'Support, opportunities and mentorship for every learner.' },
      { icon: '📈', title: 'Excellence', text: 'Consistent quality benchmarked to NAAC A+ standards.' },
      { icon: '🌏', title: 'Impact', text: 'Contributing to society and the nation at large.' },
    ],
  }
}

export function getPageContent(slug) {
  return SPECIFIC[slug] || generate(slug)
}
