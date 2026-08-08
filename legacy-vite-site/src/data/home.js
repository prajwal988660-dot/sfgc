// Homepage content, taken from the live SFGC site study.

export const COLLEGE = {
  name: 'Seshadripuram First Grade College',
  short: 'SFGC',
  location: 'Yelahanka, Bengaluru',
  affiliation:
    'Permanently affiliated to Dr. Manmohan Singh Bengaluru City University and recognized by UGC under 2(f) & 12(B)',
  accreditation: 'NAAC accredited A+ Grade',
  iso: 'ISO 9001:2015 Certified',
  email: 'info@sfgc.ac.in',
  phone: '080-22955369',
  established: 1930,
  trust: 'Seshadripuram Educational Trust (SET)',
}

// Hero carousel slides (captions are the real quotes from the live site).
export const SLIDES = [
  {
    tag: 'State Award 2025',
    title: "Karnataka State Best NSS Unit Award",
    caption:
      "SFGC's NSS Unit won the Karnataka State Best NSS Unit Award, and Prof. Naveen Kumar K S was honoured as Best NSS Officer for 2022-23.",
    accent: '#3e0f55',
  },
  {
    tag: 'World Record',
    title: 'Guinness World Record by SFGC Student',
    caption: 'Guinness World Record achieved by SFGC student H. Kishan.',
    accent: '#092f5e',
  },
  {
    tag: 'Silver Jubilee',
    title: 'Lecture by His Holiness the Dalai Lama',
    caption:
      'Silver Jubilee lecture on “Education for Wisdom and Compassion to Rebuild Nation” by His Holiness the Dalai Lama.',
    accent: '#5a1a78',
  },
  {
    tag: 'Nobel Laureate',
    title: 'Silver Jubilee Talk by Shri Kailash Satyarthi',
    caption: 'Silver Jubilee Talk by Shri Kailash Satyarthi, Nobel Laureate.',
    accent: '#0b3d2e',
  },
  {
    tag: 'Eminent Visitor',
    title: 'Visit of Mrs. Sudha Murthy',
    caption: 'Visit of the Chairman of Infosys Foundation, Mrs. Sudha Murthy.',
    accent: '#7a2048',
  },
  {
    tag: 'Social Activist',
    title: "India's Anna Hazare at SFGC",
    caption: "India's well-acclaimed social activist Anna Hazare at SFGC.",
    accent: '#1b3a5b',
  },
  {
    tag: 'Innovation',
    title: 'Silver Jubilee Lecture by Dr. Sam Pitroda',
    caption:
      'Silver Jubilee lecture by Dr. Sam Pitroda on “Innovations in Modern Education for Aspiring Minds”.',
    accent: '#3e0f55',
  },
]

export const IMPORTANT_LINKS = [
  { label: 'Admission', to: '/admission' },
  { label: 'College Prospectus', to: '/admission/prospectus' },
  { label: 'Placements', to: '/students/placements' },
  { label: 'Alumni Register', to: '/alumni/registration' },
  { label: 'SRF', to: '/about/set-institutions' },
  { label: 'POs, PSOs, COs', to: '/courses/pos-psos-cos' },
]

export const WELCOME = [
  'The primary objective of education at S.F.G.C is to create dynamic leaders in the corporate sector, entrepreneurs, academicians, researchers and professionals who contribute to the development of society and the nation at large. We are committed to maintaining high academic standards and preparing our students to secure rewarding employment on graduation.',
  'S.F.G.C is committed to high standards of academic excellence through value-based education. With the best of faculty and infrastructure, the campus ambience is conducive to learning.',
  'The S.F.G.C campus is a prominent landmark in Bengaluru. Spread over 3.5 acres in New Town, Yelahanka, on the Doddaballapur–Bengaluru Highway, the campus has all the facilities, infrastructure and learning resources, and is surrounded by industries large and small — providing rich avenues for industry–academia interaction.',
]

export const STATS = [
  { value: '1930', label: 'Established', suffix: '' },
  { value: '20000', label: 'Students', suffix: '+' },
  { value: '24', label: 'SET Institutions', suffix: '' },
  { value: '3.5', label: 'Acre Campus', suffix: '' },
]

export const COURSES = {
  ug: [
    { code: 'B.Com', name: 'Bachelor of Commerce', slug: 'courses/bcom', icon: '📊' },
    { code: 'B.Com + BDA', name: 'B.Com with Big Data Analytics', slug: 'courses/bcom-bda', icon: '📈' },
    { code: 'BCA', name: 'Bachelor of Computer Applications', slug: 'courses/bca', icon: '💻' },
    { code: 'BBA', name: 'Bachelor of Business Administration', slug: 'courses/bba', icon: '🏢' },
    { code: 'BBA Aviation', name: 'BBA in Aviation Management', slug: 'courses/bba-aviation', icon: '✈️' },
    { code: 'BSc BBG', name: 'Biotech, Botany & Genetics', slug: 'courses/bsc-bbg', icon: '🧬' },
    { code: 'BSc EMC', name: 'Electronics, Maths & Computer Sc.', slug: 'courses/bsc-emc', icon: '🔬' },
  ],
  pg: [
    { code: 'M.Com', name: 'Master of Commerce', slug: 'courses/mcom', icon: '🎓' },
    { code: 'MCA', name: 'Master of Computer Applications', slug: 'courses/mca', icon: '🖥️' },
    { code: 'MBA', name: 'Master of Business Administration', slug: 'courses/mba', icon: '💼' },
    { code: 'Global MBA', name: 'SAGE — Global MBA', slug: 'courses/global-mba', icon: '🌐' },
  ],
}

export const PRINCIPAL = {
  name: 'Dr. S. N. Venkatesh',
  title: 'Principal',
  message:
    'S.F.G.C nurtures and supports a unique system of education structured on values and combines the tenets of academic excellence with corporate professionalism. The primary objective of education at S.F.G.C is to create dynamic leaders in the corporate sector, entrepreneurs, academicians, researchers and professionals who contribute to the development of society and the nation at large. At the same time, we believe that S.F.G.C students should develop as individuals — gaining self-confidence and a sense of enterprise.',
}

export const NEWS = [
  { date: '2026-06-28', title: 'Admissions open for the 2026–27 academic year across all UG & PG programmes.' },
  { date: '2026-06-15', title: 'SFGC NSS Unit felicitated with Karnataka State Best NSS Unit Award.' },
  { date: '2026-05-30', title: 'ATAL (AICTE Training and Learning) FDP scheduled — register now.' },
  { date: '2026-05-12', title: 'Placement drive: Amazon, Deloitte & TCS on campus this month.' },
]

export const EVENTS = [
  {
    id: 'orientation-2026',
    date: '2026-07-10',
    title: 'Orientation Programme for First-Year Students',
    venue: 'Main Auditorium',
    type: 'Event',
    fee: 'Free',
    registration: 'open',
    icon: '🎓',
    cover: ['#6d28d9', '#4f46e5'],
    time: '9:30 AM – 1:00 PM',
    tagline: 'Welcome to the SFGC family — your journey begins here.',
    about: [
      'The Orientation Programme formally welcomes our incoming batch to Seshadripuram First Grade College. Students and parents get an in-depth introduction to the college, its value-based philosophy, academic structure, faculty and the wealth of opportunities on campus.',
      'The session covers course structure, examination patterns, mentoring, clubs and cells, code of conduct, and the support systems available — helping every new student settle in with confidence.',
    ],
    highlights: [
      'Address by the Principal & Heads of Departments',
      'Campus and facilities walkthrough',
      'Introduction to clubs, cells, NSS, NCC & sports',
      'Mentor allocation and ID card distribution',
      'Interaction with senior students & alumni',
    ],
    schedule: [
      ['09:30 AM', 'Registration & welcome kit'],
      ['10:00 AM', "Principal's address & college overview"],
      ['11:15 AM', 'Department introductions'],
      ['12:15 PM', 'Campus tour & mentor meet'],
    ],
    coordinator: { name: 'Student Welfare Office', phone: '080-22955369' },
  },
  {
    id: 'silver-jubilee-lecture',
    date: '2026-07-18',
    title: 'Silver Jubilee Guest Lecture Series',
    venue: 'Sabhangana',
    type: 'Event',
    fee: 'Free',
    registration: 'open',
    icon: '🎤',
    cover: ['#0e7490', '#1e40af'],
    time: '11:00 AM – 1:00 PM',
    tagline: 'Eminent voices on education, innovation and nation-building.',
    about: [
      'Continuing SFGC’s celebrated tradition of hosting thought leaders — from His Holiness the Dalai Lama to Dr. Sam Pitroda and Mrs. Sudha Murthy — the Silver Jubilee Guest Lecture Series brings distinguished speakers to campus.',
      'The series inspires students with perspectives on wisdom, compassion, innovation and social responsibility, connecting classroom learning with the wider world.',
    ],
    highlights: [
      'Keynote by a distinguished guest speaker',
      'Interactive Q&A with students',
      'Panel discussion on contemporary themes',
      'Certificate of participation',
    ],
    schedule: [
      ['11:00 AM', 'Inauguration & lamp lighting'],
      ['11:20 AM', 'Keynote address'],
      ['12:20 PM', 'Q&A and panel discussion'],
      ['12:50 PM', 'Vote of thanks'],
    ],
    coordinator: { name: 'IQAC Cell', phone: '080-22955369' },
  },
  {
    id: 'sambhram-fest',
    date: '2026-08-05',
    title: 'Inter-Collegiate Cultural Fest — "Sambhram"',
    venue: 'Open Air Theatre',
    type: 'Fest',
    fee: '₹200 / team',
    registration: 'open',
    icon: '🎭',
    cover: ['#d6249f', '#7c1d9e'],
    time: '9:00 AM – 6:00 PM',
    tagline: 'Two stages. Twenty events. One unforgettable day of culture.',
    about: [
      'Sambhram is SFGC’s flagship inter-collegiate cultural fest, drawing teams from colleges across Bengaluru for a vibrant celebration of music, dance, theatre, fashion and fine arts.',
      'From solo and group performances to battle-of-bands and street play, Sambhram is where talent meets the spotlight. Winners take home trophies, cash prizes and the coveted overall championship.',
    ],
    highlights: [
      'Group Dance, Solo Singing & Battle of Bands',
      'Fashion Show & Street Play (Beedi Nataka)',
      'Fine Arts: painting, mehendi, rangoli',
      'Overall Championship trophy & cash prizes',
      'Food stalls and live DJ finale',
    ],
    schedule: [
      ['09:00 AM', 'Team check-in & inauguration'],
      ['10:00 AM', 'On-stage preliminary rounds'],
      ['01:00 PM', 'Lunch break'],
      ['02:00 PM', 'Finals — dance, music, fashion'],
      ['05:30 PM', 'Prize distribution & DJ night'],
    ],
    coordinator: { name: 'Cultural Committee', phone: '080-22955369' },
  },
  {
    id: 'independence-day',
    date: '2026-08-15',
    title: 'Independence Day Celebration & NCC Parade',
    venue: 'College Grounds',
    type: 'Event',
    fee: 'Free',
    registration: 'open',
    icon: '🇮🇳',
    cover: ['#c2410c', '#15803d'],
    time: '8:00 AM – 10:30 AM',
    tagline: 'Honouring the tricolour with pride and patriotism.',
    about: [
      'SFGC commemorates Independence Day with flag hoisting, a ceremonial NCC parade, and cultural performances celebrating the spirit of the nation.',
      'The morning brings together students, faculty and staff in a display of unity and patriotism, followed by patriotic songs, speeches and felicitation of achievers.',
    ],
    highlights: [
      'Flag hoisting by the Chief Guest',
      'NCC guard of honour & parade',
      'Patriotic songs and cultural performances',
      'Felicitation of student achievers',
    ],
    schedule: [
      ['08:00 AM', 'Assembly & flag hoisting'],
      ['08:20 AM', 'NCC parade & guard of honour'],
      ['09:00 AM', 'Cultural programme'],
      ['10:00 AM', 'Felicitation & national anthem'],
    ],
    coordinator: { name: 'NCC Unit', phone: '080-22955369' },
  },
  {
    id: 'techspardha-2026',
    date: '2026-09-12',
    title: 'National Tech Fest — "TechSpardha 2026"',
    venue: 'ICT Block & Labs',
    type: 'Fest',
    fee: '₹300 / team',
    registration: 'open',
    icon: '💻',
    cover: ['#0891b2', '#4338ca'],
    time: '9:30 AM – 5:00 PM',
    tagline: 'Code, create and compete at Bengaluru’s student tech arena.',
    about: [
      'TechSpardha is the annual national technical fest hosted by the Departments of Computer Science and Computer Applications, bringing together budding technologists for a full day of coding, innovation and problem-solving.',
      'Teams battle it out across hackathons, coding contests, project expos and gaming — with mentorship from industry professionals and recruiters scouting for talent.',
    ],
    highlights: [
      '6-hour Hackathon & competitive coding',
      'Project & startup idea expo',
      'Web design and UI/UX challenge',
      'E-sports & tech quiz',
      'Industry mentor sessions and prizes',
    ],
    schedule: [
      ['09:30 AM', 'Inauguration & problem release'],
      ['10:00 AM', 'Hackathon & coding rounds begin'],
      ['01:00 PM', 'Project expo & judging'],
      ['03:30 PM', 'Finals & demos'],
      ['04:30 PM', 'Results & valedictory'],
    ],
    coordinator: { name: 'Dept. of Computer Science', phone: '080-22955369' },
  },
  {
    id: 'commerce-summit',
    date: '2026-09-26',
    title: 'Commerce & Management Summit',
    venue: 'Main Auditorium',
    type: 'Event',
    fee: '₹100',
    registration: 'open',
    icon: '📈',
    cover: ['#b45309', '#9d174d'],
    time: '10:00 AM – 4:00 PM',
    tagline: 'Where industry leaders meet future professionals.',
    about: [
      'The Commerce & Management Summit connects students with industry leaders, entrepreneurs and finance experts through keynotes, panel discussions and case-study competitions.',
      'A must-attend for aspiring managers, analysts and entrepreneurs, the summit blends academic insight with real corporate exposure and networking.',
    ],
    highlights: [
      'Keynotes by industry & finance leaders',
      'Panel on careers in commerce & management',
      'Business plan & case-study competition',
      'Networking with recruiters',
    ],
    schedule: [
      ['10:00 AM', 'Inaugural keynote'],
      ['11:30 AM', 'Panel discussion'],
      ['01:30 PM', 'Case-study competition'],
      ['03:30 PM', 'Awards & networking'],
    ],
    coordinator: { name: 'Dept. of Commerce & Management', phone: '080-22955369' },
  },
]

// Lookup helper
export function getEvent(id) {
  return EVENTS.find((e) => e.id === id)
}

export const RECRUITERS = [
  'ICICI', 'L&T', 'Amazon', 'Deloitte', 'Concentrix', 'Wipro', 'TCS', 'Airtel',
  'State Street', 'PNB', 'NIMS', 'Gallagher', 'Trident Hyundai', 'Emertxe',
  'Resource Pro', 'Red Carpet',
]
