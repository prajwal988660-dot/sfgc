/**
 * Editorial content for the public site, carried over from the study of the
 * live SFGC website (sfgc.ac.in). This is the single place to correct a fact,
 * a name or a figure — no component should hard-code copy.
 */

export const COLLEGE = {
  name: 'Seshadripuram First Grade College',
  short: 'SFGC',
  tagline: 'Value-based education since 1930',
  location: 'Yelahanka, Bengaluru',
  addressLines: [
    'Seshadripuram First Grade College',
    'New Town, Yelahanka',
    'Doddaballapur–Bengaluru Highway',
    'Bengaluru — 560 064, Karnataka, India',
  ],
  affiliation:
    'Permanently affiliated to Dr. Manmohan Singh Bengaluru City University and recognised by UGC under 2(f) & 12(B)',
  accreditation: 'NAAC accredited A+ Grade',
  iso: 'ISO 9001:2015 Certified',
  email: 'info@sfgc.ac.in',
  admissionsEmail: 'admissions@sfgc.ac.in',
  phone: '080-22955369',
  phoneHref: 'tel:+918022955369',
  established: 1930,
  trust: 'Seshadripuram Educational Trust (SET)',
  website: 'https://www.sfgc.ac.in/',
  mapEmbed:
    'https://www.google.com/maps?q=Seshadripuram+First+Grade+College+Yelahanka+Bengaluru&output=embed',
  mapLink:
    'https://www.google.com/maps/search/?api=1&query=Seshadripuram+First+Grade+College+Yelahanka+Bengaluru',
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/' },
    { label: 'Instagram', href: 'https://www.instagram.com/' },
    { label: 'YouTube', href: 'https://www.youtube.com/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  ],
} as const

export const BADGES = [
  { label: 'NAAC A+', detail: 'Accredited' },
  { label: 'UGC 2(f) & 12(B)', detail: 'Recognised' },
  { label: 'ISO 9001:2015', detail: 'Certified' },
  { label: 'Est. 1930', detail: 'Heritage' },
] as const

/** Hero rotator — every caption is a real achievement of the college. */
export const HERO_SLIDES = [
  {
    tag: 'State Award 2025',
    title: 'Karnataka State Best NSS Unit Award',
    caption:
      "SFGC's NSS Unit won the Karnataka State Best NSS Unit Award, and Prof. Naveen Kumar K S was honoured as Best NSS Officer for 2022–23.",
    from: '#0f2b56',
    to: '#3e0f55',
  },
  {
    tag: 'World Record',
    title: 'A Guinness World Record, by our own student',
    caption: 'Guinness World Record achieved by SFGC student H. Kishan.',
    from: '#092f5e',
    to: '#0e7490',
  },
  {
    tag: 'Silver Jubilee',
    title: 'Education for Wisdom and Compassion',
    caption:
      'Silver Jubilee lecture on “Education for Wisdom and Compassion to Rebuild Nation” by His Holiness the Dalai Lama.',
    from: '#5a1a78',
    to: '#0b2039',
  },
  {
    tag: 'Nobel Laureate',
    title: 'Silver Jubilee Talk by Shri Kailash Satyarthi',
    caption: 'Silver Jubilee Talk by Shri Kailash Satyarthi, Nobel Laureate.',
    from: '#0b3d2e',
    to: '#0f2b56',
  },
  {
    tag: 'Innovation',
    title: 'Innovations in Modern Education',
    caption:
      'Silver Jubilee lecture by Dr. Sam Pitroda on “Innovations in Modern Education for Aspiring Minds”.',
    from: '#6b1230',
    to: '#0b2039',
  },
] as const

export const WELCOME = [
  'The primary objective of education at S.F.G.C is to create dynamic leaders in the corporate sector, entrepreneurs, academicians, researchers and professionals who contribute to the development of society and the nation at large. We are committed to maintaining high academic standards and preparing our students to secure rewarding employment on graduation.',
  'S.F.G.C is committed to high standards of academic excellence through value-based education. With the best of faculty and infrastructure, the campus ambience is conducive to learning.',
  'The campus is a prominent landmark in Bengaluru. Spread over 3.5 acres in New Town, Yelahanka, on the Doddaballapur–Bengaluru Highway, it offers the facilities, infrastructure and learning resources of a modern institution — and is surrounded by industry, providing rich avenues for industry–academia interaction.',
] as const

export const VISION =
  'To constantly strive towards meeting the social need for affordable, relevant and quality education by inclusion and expansion of newer streams of academia, and to provide world-class infrastructure for learning, research and the application of knowledge.'

export const MISSION =
  'To excel in all activities, create an atmosphere of effective learning, generate a spirit of enquiry, induce healthy challenges and competitions, encourage sustainable accomplishments, and ensure enriching rewards to everyone — students, teachers, trustees, associates and society at large.'

export const PRINCIPAL = {
  name: 'Dr. S. N. Venkatesh',
  title: 'Principal',
  message:
    'S.F.G.C nurtures and supports a unique system of education structured on values, combining the tenets of academic excellence with corporate professionalism. Our primary objective is to create dynamic leaders, entrepreneurs, academicians, researchers and professionals who contribute to society and the nation. At the same time, we believe every S.F.G.C student should grow as an individual — gaining self-confidence and a sense of enterprise.',
} as const

/** Animated counters on the homepage. */
export const STATS = [
  { value: 1930, label: 'Established', suffix: '', decimals: 0 },
  { value: 20000, label: 'Students across SET', suffix: '+', decimals: 0 },
  { value: 24, label: 'SET Institutions', suffix: '', decimals: 0 },
  { value: 3.5, label: 'Acre Campus', suffix: '', decimals: 1 },
] as const

export const PLACEMENT_STATS = [
  { value: 92, label: 'Placement Rate', suffix: '%', decimals: 0 },
  { value: 160, label: 'Recruiting Partners', suffix: '+', decimals: 0 },
  { value: 8.5, label: 'Highest Package', suffix: ' LPA', decimals: 1 },
  { value: 45, label: 'Placement Drives / Year', suffix: '+', decimals: 0 },
] as const

export const RECRUITERS = [
  'Amazon',
  'Deloitte',
  'TCS',
  'Wipro',
  'ICICI Bank',
  'L&T',
  'Concentrix',
  'Airtel',
  'State Street',
  'Punjab National Bank',
  'Gallagher',
  'Trident Hyundai',
  'Emertxe',
  'Resource Pro',
  'NIMS',
  'Red Carpet',
] as const

export const COURSES = {
  ug: [
    {
      code: 'B.Com',
      name: 'Bachelor of Commerce',
      duration: '3 Years',
      icon: 'LineChart',
      blurb:
        'Accounting, taxation, corporate law and finance, with strong preparation for CA, CS and CMA pathways.',
    },
    {
      code: 'B.Com + BDA',
      name: 'B.Com with Big Data Analytics',
      duration: '3 Years',
      icon: 'Database',
      blurb:
        'Commerce fundamentals paired with analytics, visualisation and business intelligence tooling.',
    },
    {
      code: 'BCA',
      name: 'Bachelor of Computer Applications',
      duration: '3 Years',
      icon: 'Code2',
      blurb:
        'Programming, data structures, databases, networks and full-stack development with lab-led teaching.',
    },
    {
      code: 'BBA',
      name: 'Bachelor of Business Administration',
      duration: '3 Years',
      icon: 'Briefcase',
      blurb:
        'Management, marketing, HR and entrepreneurship, taught through case studies and live projects.',
    },
    {
      code: 'BBA Aviation',
      name: 'BBA in Aviation Management',
      duration: '3 Years',
      icon: 'Plane',
      blurb:
        'Airport and airline operations, aviation safety and hospitality, with industry certification.',
    },
    {
      code: 'BSc BBG',
      name: 'Biotechnology, Botany & Genetics',
      duration: '3 Years',
      icon: 'Dna',
      blurb:
        'Molecular biology, genetics and plant science supported by well-equipped research laboratories.',
    },
    {
      code: 'BSc EMC',
      name: 'Electronics, Mathematics & Computer Science',
      duration: '3 Years',
      icon: 'CircuitBoard',
      blurb:
        'A rigorous quantitative combination bridging electronics, applied mathematics and computing.',
    },
  ],
  pg: [
    {
      code: 'M.Com',
      name: 'Master of Commerce',
      duration: '2 Years',
      icon: 'GraduationCap',
      blurb:
        'Advanced accounting, financial management and research methodology for academia and industry.',
    },
    {
      code: 'MCA',
      name: 'Master of Computer Applications',
      duration: '2 Years',
      icon: 'MonitorSmartphone',
      blurb:
        'Software engineering, cloud, AI and enterprise systems with a capstone industry project.',
    },
    {
      code: 'MBA',
      name: 'Master of Business Administration',
      duration: '2 Years',
      icon: 'TrendingUp',
      blurb:
        'Specialisations across finance, marketing, HR and analytics, with internships and mentoring.',
    },
    {
      code: 'Global MBA',
      name: 'SAGE — Global MBA',
      duration: '2 Years',
      icon: 'Globe2',
      blurb:
        'An internationally benchmarked curriculum with global electives and cross-border exposure.',
    },
  ],
} as const

export const DEPARTMENTS = [
  {
    name: 'Commerce',
    slug: 'commerce',
    icon: 'Calculator',
    blurb:
      'The largest department at SFGC, preparing students for accounting, taxation, banking and professional courses.',
    programmes: ['B.Com', 'B.Com with BDA', 'M.Com'],
  },
  {
    name: 'Management',
    slug: 'management',
    icon: 'Briefcase',
    blurb:
      'Industry-connected management education spanning general management, aviation and global business.',
    programmes: ['BBA', 'BBA Aviation', 'MBA', 'Global MBA'],
  },
  {
    name: 'Computer Science',
    slug: 'computer-science',
    icon: 'Code2',
    blurb:
      'Modern computing education with dedicated labs, coding culture and an active technical fest.',
    programmes: ['BCA', 'MCA', 'BSc EMC'],
  },
  {
    name: 'Life Science',
    slug: 'life-science',
    icon: 'Dna',
    blurb:
      'Biotechnology, botany and genetics supported by research-grade laboratory infrastructure.',
    programmes: ['BSc BBG'],
  },
  {
    name: 'Physical Science',
    slug: 'physical-science',
    icon: 'Atom',
    blurb:
      'Electronics, mathematics and applied sciences taught with an emphasis on problem solving.',
    programmes: ['BSc EMC'],
  },
  {
    name: 'Languages',
    slug: 'languages',
    icon: 'Languages',
    blurb:
      'English, Kannada, Hindi and Sanskrit — building communication skills alongside literary study.',
    programmes: ['Foundation courses'],
  },
  {
    name: 'Physical Education',
    slug: 'physical-education',
    icon: 'Dumbbell',
    blurb:
      'Multi-gym, coaching and inter-collegiate teams that keep campus life active and competitive.',
    programmes: ['Sports & fitness'],
  },
  {
    name: 'Library',
    slug: 'library',
    icon: 'Library',
    blurb:
      'A well-stocked central library with digital resources, journals and dedicated reading halls.',
    programmes: ['Learning resources'],
  },
] as const

export const FACILITIES = [
  { name: 'Smart Classrooms', icon: 'Presentation', blurb: 'ICT-enabled rooms with projection and recording.' },
  { name: 'Central Library', icon: 'Library', blurb: 'Books, journals, e-resources and quiet reading halls.' },
  { name: 'Sabhangana', icon: 'Theater', blurb: 'The college’s signature hall for seminars and lectures.' },
  { name: 'Main Auditorium', icon: 'Mic2', blurb: 'Full-scale venue for convocations, fests and guest talks.' },
  { name: 'Laboratories', icon: 'FlaskConical', blurb: 'Computer, electronics and life-science labs.' },
  { name: 'Multi Gym', icon: 'Dumbbell', blurb: 'Equipped fitness centre with trained supervision.' },
  { name: 'Canteen', icon: 'UtensilsCrossed', blurb: 'Hygienic, affordable dining at the heart of campus.' },
  { name: 'Halls of Residence', icon: 'Building2', blurb: 'Secure hostel accommodation for outstation students.' },
  { name: 'Wellness Centre', icon: 'HeartPulse', blurb: 'Health support and student counselling services.' },
] as const

export const ACHIEVEMENTS = [
  {
    year: '2025',
    title: 'Karnataka State Best NSS Unit',
    detail:
      'The NSS Unit received the state’s highest recognition; Prof. Naveen Kumar K S was named Best NSS Officer.',
  },
  {
    year: '2024',
    title: 'Guinness World Record',
    detail: 'SFGC student H. Kishan entered the Guinness World Records.',
  },
  {
    year: '2023',
    title: 'NAAC A+ Accreditation',
    detail: 'Reaccredited with A+ grade, affirming institutional quality across all criteria.',
  },
  {
    year: '2022',
    title: 'Silver Jubilee Lecture Series',
    detail:
      'Hosted His Holiness the Dalai Lama, Nobel Laureate Shri Kailash Satyarthi and Dr. Sam Pitroda.',
  },
] as const

/** Cells and committees the students page links to. */
export const STUDENT_CELLS = [
  'Student Council',
  'Career & Placements',
  'Mentoring',
  'Anti-Ragging Cell',
  'Grievance Redressal Cell',
  'Internal Complaints Committee',
  'Counselling Cell',
  'Women Empowerment Cell',
  'SC/ST Cell',
  'OBC Cell',
  'Minority Cell',
  'Competitive Exam Corner',
] as const

export const ACTIVITIES = [
  { name: 'NSS', blurb: 'State-award-winning unit running village adoption and social outreach camps.' },
  { name: 'NCC', blurb: 'Army wing with parades, camps and certificate examinations.' },
  { name: 'Youth Red Cross', blurb: 'Blood donation drives, first-aid training and health awareness.' },
  { name: 'Cultural Activities', blurb: 'Music, dance, theatre and the annual Sambhram fest.' },
  { name: 'Eco Watch', blurb: 'Campus sustainability, tree planting and waste-reduction initiatives.' },
  { name: 'Civil Defence', blurb: 'Disaster-preparedness training in partnership with civil authorities.' },
] as const

export const NAV_LINKS = [
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'An Overview', href: '/about' },
      { label: 'Vision & Mission', href: '/about#vision' },
      { label: "Principal's Desk", href: '/about#principal' },
      { label: 'Achievements', href: '/about#achievements' },
      { label: 'The Trust (SET)', href: '/about#trust' },
    ],
  },
  {
    label: 'Academics',
    href: '/departments',
    children: [
      { label: 'Departments', href: '/departments' },
      { label: 'UG Programmes', href: '/departments#ug' },
      { label: 'PG Programmes', href: '/departments#pg' },
      { label: 'Facilities', href: '/departments#facilities' },
    ],
  },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Events', href: '/events' },
  { label: 'Notices', href: '/notices' },
  { label: 'Placements', href: '/placements' },
  { label: 'Contact', href: '/contact' },
] as const

export const ADMISSION_STEPS = [
  {
    step: 1,
    title: 'Check eligibility',
    detail:
      'Confirm you meet the qualifying examination requirement for your chosen programme — PUC / 10+2 for UG, a relevant bachelor’s degree for PG.',
  },
  {
    step: 2,
    title: 'Submit the application',
    detail:
      'Complete the enquiry form online or collect the prospectus and application at the college admissions office.',
  },
  {
    step: 3,
    title: 'Document verification',
    detail:
      'Bring marks cards, transfer and migration certificates, ID proof and passport photographs for verification.',
  },
  {
    step: 4,
    title: 'Counselling & seat allotment',
    detail:
      'Meet the admissions committee for programme counselling; seats are allotted on merit and availability.',
  },
  {
    step: 5,
    title: 'Fee payment & enrolment',
    detail:
      'Pay the prescribed fee to confirm your seat, collect your ID card and join the orientation programme.',
  },
] as const

export const FAQS = [
  {
    q: 'Is SFGC affiliated and accredited?',
    a: 'Yes. The college is permanently affiliated to Dr. Manmohan Singh Bengaluru City University, recognised by the UGC under sections 2(f) and 12(B), accredited by NAAC with an A+ grade and certified to ISO 9001:2015.',
  },
  {
    q: 'When do admissions open?',
    a: 'Applications for the 2026–27 academic year are open now. UG admissions typically begin after PUC results are announced; PG admissions follow the university calendar.',
  },
  {
    q: 'Does the college provide hostel accommodation?',
    a: 'Yes. Halls of residence are available for outstation students, with separate secure accommodation and dining facilities.',
  },
  {
    q: 'What placement support is available?',
    a: 'The Career & Placement Cell runs training in aptitude, communication and interview skills, and hosts more than 45 recruitment drives a year with partners including Amazon, Deloitte, TCS, Wipro and ICICI Bank.',
  },
  {
    q: 'Are scholarships available?',
    a: 'Yes. Students can apply for state and central government scholarships, as well as institutional merit and means-based support administered through the Scholarships and Welfare cell.',
  },
  {
    q: 'How do students receive college updates?',
    a: 'All official announcements are published to the Notices feed on this website and pushed to the SFGC Student app, so nothing depends on an informal group chat.',
  },
] as const
