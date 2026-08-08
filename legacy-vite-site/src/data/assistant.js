import { COLLEGE } from './home.js'

// Self-contained knowledge base for "Sesha". Each intent has keywords and a
// reply (text + optional page links + quick-reply chips). getReply() scores the
// user's message against every intent and returns the best match (or a helpful
// fallback). Facts are grounded in SFGC's actual content.

export const ASSISTANT = { name: 'Sesha', emoji: '🎓' }

export const GREETING = {
  text: `Hi! I'm ${ASSISTANT.name}, the SFGC assistant. 👋 Ask me about admissions, courses, fees, facilities, placements, the student & faculty portals, events, cells, sports, NSS/NCC — or anything about the college.`,
  chips: ['Admissions', 'Courses', 'Fees', 'Student Portal', 'Facilities', 'Contact'],
}

const L = (label, to) => ({ label, to })

const INTENTS = [
  // ── Conversational ─────────────────────────────────────────────
  { id: 'greeting', keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste', 'greetings', 'hii', 'helo'],
    reply: () => ({ text: `Hello! 😊 I can help with admissions, courses, fees, facilities, placements, the student/faculty portals, events, cells, sports and more. What would you like to know?`, chips: ['Admissions', 'Courses', 'Student Portal', 'Events'] }) },
  { id: 'help', keywords: ['help', 'what can you do', 'what can you help', 'options', 'topics', 'menu', 'guide me', 'assist'],
    reply: () => ({ text: `I can help you with lots of things about SFGC 🎓 — pick a topic:\n• Admissions, eligibility, fees & scholarships\n• Courses (UG & PG) and departments\n• Facilities (library, hostel, labs, gym…)\n• Placements & recruiters\n• Student / Faculty portals\n• Events & fests, NSS/NCC, sports\n• Support cells, contact & location`, chips: ['Admissions', 'Courses', 'Facilities', 'Placements', 'Events', 'Contact'] }) },
  { id: 'thanks', keywords: ['thanks', 'thank you', 'thankyou', 'thx', 'great', 'awesome', 'helpful', 'nice', 'good bot', 'perfect'],
    reply: () => ({ text: 'You’re most welcome! 😊 Anything else I can help you with?', chips: ['Admissions', 'Courses', 'Events'] }) },
  { id: 'bye', keywords: ['bye', 'goodbye', 'see you', "that's all", 'thats all', 'nothing else', 'no thanks', 'no thank you'],
    reply: () => ({ text: 'Thanks for visiting SFGC! 🎓 Have a great day, and come back anytime. 👋' }) },

  // ── Admissions ─────────────────────────────────────────────────
  { id: 'admission', keywords: ['admission', 'admissions', 'apply', 'applying', 'join', 'enroll', 'enrol', 'application', 'seat', 'take admission', 'get in', 'register for college', 'admission open', 'admissions open', 'is admission open', 'want to join', 'i want admission', 'get admission', 'want to study here', 'new admission', 'direct admission', 'spot admission', 'admission enquiry', 'admission 2026', 'admission process 2026'],
    reply: () => ({ text: 'Admissions for 2026–27 are open across all UG & PG programmes! 🎓 You can apply online or visit the campus office — selection is merit-based. Want the admission page or the enquiry form?', links: [L('Admission page', '/admission'), L('Enquiry form', '/contact')], chips: ['How to apply', 'Eligibility', 'Fee structure', 'Courses'] }) },
  { id: 'how-to-apply', keywords: ['how to apply', 'application process', 'apply online', 'admission process', 'steps to apply', 'procedure', 'how do i join', 'how to get admission', 'how do i apply', 'how can i apply', 'how to fill the form', 'where do i apply', 'apply for admission'],
    reply: () => ({ text: 'It’s simple: 1) fill the online enquiry/application form, 2) submit your marks & documents, 3) selection is on merit, then 4) pay the fee to confirm your seat. You can also visit the admission office directly.', links: [L('How to apply', '/admission/how-to-apply'), L('Enquiry form', '/contact')], chips: ['Eligibility', 'Fee structure', 'Documents'] }) },
  { id: 'eligibility', keywords: ['eligibility', 'eligible', 'criteria', 'qualification', 'qualify', 'requirement', 'marks required', 'pass percentage', 'minimum marks', 'percentage needed'],
    reply: () => ({ text: 'Eligibility depends on the programme — generally a pass in PUC/12th for UG courses, and a relevant Bachelor’s degree for PG courses. For exact criteria and documents, see the eligibility page or contact the office.', links: [L('Eligibility & Admission', '/admission/eligibility')], chips: ['Fee structure', 'Courses', 'Contact'] }) },
  { id: 'fees', keywords: ['fee', 'fees', 'cost', 'price', 'how much', 'tuition', 'payment', 'expensive', 'affordable', 'fee structure', 'charges', 'fees kitna hai', 'fees kitni', 'total course fee', 'first year fees', 'fees details', 'fee details', 'fee amount', 'yearly fee', 'per year fee', 'annual fee', 'semester fee', 'course fees', 'how much fees', 'fees for the course', 'fee per year'],
    reply: () => ({ text: 'Fees vary by programme. SFGC is committed to affordable, value-based education, and merit scholarships are available. For the exact fee structure, please see the admission section or contact the office.', links: [L('Fee structure', '/admission/fee-structure'), L('Scholarships', '/admission/scholarships')], chips: ['Scholarships', 'Admissions', 'Contact'] }) },
  { id: 'scholarship', keywords: ['scholarship', 'scholarships', 'financial aid', 'concession', 'merit scholarship', 'fee waiver', 'freeship', 'welfare'],
    reply: () => ({ text: 'Yes! SFGC offers generous merit scholarships and welfare support for deserving students. 💰 Check the scholarships page or ask the office about the ones you may qualify for.', links: [L('Scholarships & Welfare', '/students/scholarships'), L('Admission scholarships', '/admission/scholarships')], chips: ['Admissions', 'Fee structure'] }) },
  { id: 'prospectus', keywords: ['prospectus', 'brochure', 'college details', 'download prospectus'],
    reply: () => ({ text: 'The College Prospectus has the full details on programmes, facilities and admissions. 📘', links: [L('College Prospectus', '/admission/prospectus')], chips: ['Admissions', 'Courses'] }) },

  // ── Courses ────────────────────────────────────────────────────
  { id: 'courses', keywords: ['course', 'courses', 'programme', 'program', 'degree', 'stream', 'ug', 'pg', 'undergraduate', 'postgraduate', 'what can i study', 'subjects offered', 'branches', 'majors'],
    reply: () => ({ text: 'We offer a wide range of programmes:\n\n📘 UG: B.Com, B.Com with BDA, BCA, BBA, BBA in Aviation, BSc BBG, BSc EMC\n🎓 PG: M.Com, MCA, MBA, SAGE Global MBA\n\nWe also have research programmes (Ph.D / M.Phil).', links: [L('All courses', '/courses/overview')], chips: ['BCA', 'BBA', 'B.Com', 'MBA', 'BSc'] }) },
  { id: 'course-bcom', keywords: ['bcom', 'b.com', 'b com', 'commerce degree', 'bachelor of commerce'],
    reply: () => ({ text: 'B.Com (Bachelor of Commerce) covers accounting, finance, taxation, cost accounting and business law — a strong base for careers in accounting, finance, banking and CA/CS.', links: [L('B.Com details', '/courses/bcom')], chips: ['B.Com with BDA', 'Admissions', 'Fee structure'] }) },
  { id: 'course-bcom-bda', keywords: ['bda', 'big data', 'b.com bda', 'bcom with bda', 'analytics degree', 'data analytics'],
    reply: () => ({ text: 'B.Com with Big Data Analytics (BDA) blends commerce with data science — accounting and finance plus analytics tools for a modern, data-driven career edge. 📊', links: [L('B.Com with BDA', '/courses/bcom-bda')], chips: ['B.Com', 'Placements'] }) },
  { id: 'course-bca', keywords: ['bca', 'computer application', 'computer applications', 'software degree', 'it degree'],
    reply: () => ({ text: 'BCA (Bachelor of Computer Applications) is a 3-year programme covering programming, databases, web technologies, operating systems and more — ideal for software & IT careers. 💻', links: [L('BCA details', '/courses/bca')], chips: ['MCA', 'Placements', 'Admissions'] }) },
  { id: 'course-bba', keywords: ['bba', 'business administration', 'management degree', 'bachelor of business'],
    reply: () => ({ text: 'BBA (Bachelor of Business Administration) builds management, marketing, HR and leadership skills for the corporate world. 🏢', links: [L('BBA details', '/courses/bba'), L('BBA Aviation', '/courses/bba-aviation')], chips: ['BBA Aviation', 'MBA', 'Placements'] }) },
  { id: 'course-aviation', keywords: ['aviation', 'bba aviation', 'airline', 'airport management'],
    reply: () => ({ text: 'BBA in Aviation Management prepares you for the fast-growing aviation & airline industry — combining core management with aviation operations. ✈️', links: [L('BBA in Aviation', '/courses/bba-aviation')], chips: ['BBA', 'Admissions'] }) },
  { id: 'course-bsc', keywords: ['bsc', 'b.sc', 'b sc', 'science degree', 'bbg', 'emc', 'biotech', 'botany', 'genetics', 'electronics', 'physics', 'chemistry', 'maths degree', 'life science'],
    reply: () => ({ text: 'We offer two BSc combinations:\n• BSc BBG — Biotechnology, Botany & Genetics 🧬\n• BSc EMC — Electronics, Mathematics & Computer Science 🔬', links: [L('BSc BBG', '/courses/bsc-bbg'), L('BSc EMC', '/courses/bsc-emc')], chips: ['Departments', 'Admissions'] }) },
  { id: 'course-mcom', keywords: ['mcom', 'm.com', 'm com', 'master of commerce'],
    reply: () => ({ text: 'M.Com (Master of Commerce) is a 2-year PG programme deepening your expertise in advanced accounting, finance and research. 🎓', links: [L('M.Com details', '/courses/mcom')], chips: ['MBA', 'Research', 'Admissions'] }) },
  { id: 'course-mca', keywords: ['mca', 'master of computer', 'masters computer'],
    reply: () => ({ text: 'MCA (Master of Computer Applications) is an advanced IT & software engineering programme — great for developer, analyst and tech-leadership roles. 🖥️', links: [L('MCA details', '/courses/mca')], chips: ['BCA', 'Placements'] }) },
  { id: 'course-mba', keywords: ['mba', 'master of business', 'management masters', 'pgdm'],
    reply: () => ({ text: 'Our MBA develops leadership, strategy and specialisation skills with strong industry exposure and placements. We also offer the SAGE Global MBA. 💼', links: [L('MBA details', '/courses/mba'), L('SAGE Global MBA', '/courses/global-mba')], chips: ['Global MBA', 'Placements', 'Admissions'] }) },
  { id: 'course-global-mba', keywords: ['global mba', 'sage', 'international mba', 'abroad mba'],
    reply: () => ({ text: 'The SAGE – Global MBA offers an internationally-oriented management education with global curriculum and exposure. 🌐', links: [L('SAGE Global MBA', '/courses/global-mba')], chips: ['MBA', 'Admissions'] }) },
  { id: 'research', keywords: ['research', 'phd', 'ph.d', 'ph d', 'mphil', 'm.phil', 'm phil', 'doctorate', 'research centre', 'research center', 'srf', 'poster presentation', 'conference'],
    reply: () => ({ text: 'SFGC has a Research Centre supporting Ph.D & M.Phil work, conferences, poster presentations and publications. 🔬', links: [L('Research Centre', '/courses/research-centre'), L('Ph.D & M.Phil', '/courses/phd-mphil')], chips: ['Courses', 'Departments'] }) },
  { id: 'outcomes', keywords: ['pos', 'psos', 'cos', 'program outcomes', 'course outcomes', 'learning outcomes'],
    reply: () => ({ text: 'Programme Outcomes (POs), Programme Specific Outcomes (PSOs) and Course Outcomes (COs) for each programme are published on the site.', links: [L('POs, PSOs, COs', '/courses/pos-psos-cos')], chips: ['Courses'] }) },

  // ── Portals & the tools we offer ───────────────────────────────
  { id: 'student-portal', keywords: ['student portal', 'attendance', 'my attendance', 'internal marks', 'marks', 'progress card', 'report card', 'result', 'results', 'student login', 'id card', 'check attendance', 'my marks', 'grades'],
    reply: () => ({ text: 'The Student Portal lets you check your attendance, internal marks and a printable progress card. 🎓 Log in with your ID card number and password.\n\n(Demo: ID SFGC101 · password student123)', links: [L('Open Student Portal', '/student')], chips: ['Faculty portal', 'Courses', 'Contact'] }) },
  { id: 'faculty', keywords: ['faculty portal', 'teacher portal', 'teacher login', 'mark attendance', 'enter marks', 'faculty login', 'staff login'],
    reply: () => ({ text: 'Faculty can log in to mark attendance and enter internal marks for their classes. 👩‍🏫\n\n(Demo: ID T01 · password teacher123)', links: [L('Faculty portal', '/teacher')], chips: ['Student Portal', 'Departments'] }) },

  // ── Events / activities ────────────────────────────────────────
  { id: 'events', keywords: ['event', 'events', 'fest', 'festival', 'cultural fest', 'techfest', 'tech fest', 'register', 'registration', 'workshop', 'seminar', 'happening', 'upcoming', 'sambhram', 'techspardha', 'guest lecture'],
    reply: () => ({ text: 'Check out our upcoming events & fests — cultural fest (Sambhram), tech fest (TechSpardha), guest lectures and more. You can register online in a couple of clicks! 🎉', links: [L('Events & Fests', '/happenings/events')], chips: ['Cultural activities', 'Admissions', 'Contact'] }) },
  { id: 'nss', keywords: ['nss', 'national service', 'social service', 'community service', 'volunteering'],
    reply: () => ({ text: 'Our NSS unit is award-winning — it won the Karnataka State Best NSS Unit Award, and Prof. Naveen Kumar K S was honoured as Best NSS Officer (2022–23). 🏅 It runs camps, drives and community service.', links: [L('NSS', '/activities/nss')], chips: ['NCC', 'Youth Red Cross', 'Activities'] }) },
  { id: 'ncc', keywords: ['ncc', 'national cadet', 'cadet', 'army training', 'parade'],
    reply: () => ({ text: 'The NCC unit builds discipline, leadership and a spirit of service, with parades, camps and national events. 🎖️', links: [L('NCC', '/activities/ncc')], chips: ['NSS', 'Sports', 'Activities'] }) },
  { id: 'yrc', keywords: ['youth red cross', 'yrc', 'red cross', 'blood donation', 'blood donor', 'first aid'],
    reply: () => ({ text: 'The Youth Red Cross (YRC) unit promotes health, first-aid and blood-donation drives, and humanitarian service. ❤️', links: [L('Youth Red Cross', '/activities/yrc')], chips: ['NSS', 'Activities'] }) },
  { id: 'cultural', keywords: ['cultural', 'culturals', 'dance', 'music', 'drama', 'arts', 'talent', 'performance'],
    reply: () => ({ text: 'SFGC has a lively cultural scene — dance, music, theatre, fine arts and inter-collegiate fests where students shine. 🎭', links: [L('Cultural Activities', '/activities/cultural'), L('Events & Fests', '/happenings/events')], chips: ['Events', 'Clubs', 'Sports'] }) },
  { id: 'ecowatch', keywords: ['eco watch', 'ecowatch', 'environment', 'green club', 'sustainability', 'tree'],
    reply: () => ({ text: 'Eco Watch drives environmental awareness and green campus initiatives. 🌳', links: [L('Eco Watch', '/activities/eco-watch')], chips: ['Activities', 'NSS'] }) },
  { id: 'clubs', keywords: ['club', 'clubs', 'forum', 'forums', 'committee', 'committees', 'society'],
    reply: () => ({ text: 'There are various clubs, forums and committees for academics, culture and interests — a great way to get involved. 🤝', links: [L('Clubs & Forums', '/activities/clubs'), L('Committees', '/activities/committees')], chips: ['Cultural activities', 'Sports'] }) },
  { id: 'sports', keywords: ['sport', 'sports', 'game', 'games', 'athletics', 'cricket', 'football', 'tournament', 'gym', 'fitness', 'physical education', 'basketball', 'volleyball', 'kabaddi', 'chess', 'kho kho', 'throwball', 'badminton', 'table tennis', 'carrom', 'ground', 'playground', 'inter collegiate sports', 'sports day'],
    reply: () => ({ text: 'SFGC encourages sports & fitness with regular activities, tournaments and notable achievements. 🏅 There’s also a multi-gym on campus.', links: [L('Sports overview', '/sports/overview'), L('Achievements', '/sports/achievements')], chips: ['Facilities', 'Multi Gym', 'Activities'] }) },

  // ── Placements & careers ───────────────────────────────────────
  { id: 'placements', keywords: ['placement', 'placements', 'job', 'jobs', 'recruiter', 'recruiters', 'career', 'careers', 'company', 'companies', 'hiring', 'package', 'salary', 'internship', 'cge', 'guidance and employment', 'average package', 'highest package', 'placement record', 'placement percentage', 'top recruiters', 'which companies come'],
    reply: () => ({ text: 'Our Centre for Guidance & Employment (CGE) connects students with leading recruiters — Amazon, Deloitte, TCS, Wipro, ICICI, L&T, State Street, PNB, Airtel and many more. 💼 It also offers training in aptitude, communication and skills.', links: [L('Career & Placements', '/students/placements'), L('CGE overview', '/cge/overview')], chips: ['Courses', 'Skills', 'Admissions'] }) },
  { id: 'skills', keywords: ['skill', 'skills', 'skill development', 'training', 'aptitude', 'soft skills', 'certification', 'add on'],
    reply: () => ({ text: 'SFGC offers skill-enhancement and add-on programmes — aptitude, communication, domain skills and certifications to boost employability. 🎯', links: [L('Skills Enhancement', '/students/skills'), L('Add-On Programs', '/courses/add-on')], chips: ['Placements', 'Courses'] }) },

  // ── Facilities ─────────────────────────────────────────────────
  { id: 'facilities', keywords: ['facility', 'facilities', 'infrastructure', 'campus', 'amenities'],
    reply: () => ({ text: 'Our 3.5-acre campus has modern ICT-enabled classrooms, a well-stocked library, science & computer labs, an auditorium and Sabhangana hall, a canteen, halls of residence (hostels), a wellness centre and a multi-gym. 🏫', links: [L('Facilities', '/facilities/overview')], chips: ['Hostel', 'Library', 'Labs', 'Canteen', 'Gym'] }) },
  { id: 'hostel', keywords: ['hostel', 'hostels', 'residence', 'halls of residence', 'accommodation', 'stay', 'boarding', 'lodging', 'girls hostel', 'boys hostel', 'ac room', 'mess food', 'warden', 'wifi in hostel', 'room', 'rooms', 'hostel fee', 'hostel fees', 'hostel charges', 'hostel facility', 'hostel rules', 'is hostel available'],
    reply: () => ({ text: 'SFGC provides Halls of Residence (hostels) with a safe, supportive living environment for students. 🏠 For availability and details, contact the office.', links: [L('Halls of Residence', '/facilities/hostels'), L('Contact', '/contact')], chips: ['Facilities', 'Canteen', 'Contact'] }) },
  { id: 'library', keywords: ['library', 'books', 'reading room', 'e-library', 'journals', 'library timings', 'renew book', 'library fine', 'borrow books', 'digital library', 'book'],
    reply: () => ({ text: 'The library is well-stocked with books, journals and digital/e-resources, plus reading spaces for students. For borrowing, renewals and timings, check with the library desk. 📚', links: [L('Library', '/facilities/library'), L('Dept. Library', '/departments/library')], chips: ['Facilities', 'Downloads'] }) },
  { id: 'canteen', keywords: ['canteen', 'cafeteria', 'food', 'mess', 'lunch'],
    reply: () => ({ text: 'There’s an on-campus canteen serving hygienic, affordable food. 🍽️', links: [L('Canteen', '/facilities/canteen')], chips: ['Facilities', 'Hostel'] }) },
  { id: 'labs', keywords: ['lab', 'labs', 'laboratory', 'laboratories', 'computer lab', 'science lab', 'ict', 'computers'],
    reply: () => ({ text: 'SFGC has well-equipped science and computer laboratories, plus ICT-enabled smart classrooms for tech-driven learning. 🔬💻', links: [L('Laboratories', '/facilities/laboratories'), L('ICT', '/facilities/ict')], chips: ['Facilities', 'Courses'] }) },
  { id: 'auditorium', keywords: ['auditorium', 'sabhangana', 'seminar hall', 'hall', 'stage'],
    reply: () => ({ text: 'The campus has a spacious auditorium and the Sabhangana hall for events, seminars and cultural programmes. 🎤', links: [L('Auditorium', '/facilities/auditorium'), L('Sabhangana', '/facilities/sabhangana')], chips: ['Facilities', 'Events'] }) },
  { id: 'wellness', keywords: ['wellness', 'health centre', 'health center', 'medical', 'clinic', 'gym', 'multi gym'],
    reply: () => ({ text: 'There’s a Wellness Centre and a Multi-Gym on campus for students’ health and fitness. 💪', links: [L('Wellness Centre', '/facilities/wellness-centre'), L('Multi Gym', '/facilities/gym')], chips: ['Facilities', 'Sports'] }) },

  // ── Departments & faculty ──────────────────────────────────────
  { id: 'departments', keywords: ['department', 'departments', 'faculty members', 'academic staff', 'professors', 'lecturers', 'teachers list', 'hod'],
    reply: () => ({ text: 'SFGC has departments of Commerce, Management and Science, plus Languages, Computer Science, Physical Education and Library — with experienced, dedicated faculty. 👩‍🏫', links: [L('Commerce', '/departments/commerce'), L('Management', '/departments/management'), L('Science', '/departments/science'), L('Faculty', '/departments/faculty')], chips: ['Courses', 'Faculty'] }) },

  // ── About / history / leadership ───────────────────────────────
  { id: 'about', keywords: ['about', 'accreditation', 'naac', 'iso', 'ranking', 'affiliated', 'affiliation', 'grade', 'recognised', 'recognized', 'university', 'ugc', 'about college'],
    reply: () => ({ text: `${COLLEGE.name} is ${COLLEGE.accreditation} and ${COLLEGE.iso}, affiliated to Dr. Manmohan Singh Bengaluru City University (UGC 2(f) & 12(B)). It’s part of the Seshadripuram Educational Trust, established in 1930. 🏆`, links: [L('About us', '/about/overview'), L('Vision & Mission', '/about/vision-mission')], chips: ['History', 'Principal', 'Courses'] }) },
  { id: 'history', keywords: ['history', 'founded', 'established', 'trust', 'set', 'founder', 'founders', 'anandamma', 'seethamma', 'since', 'started', '1930'],
    reply: () => ({ text: 'The Seshadripuram group was founded in 1930 by Smt. Anandamma and Smt. Seethamma, who started a small primary school with about 20 children. Today the Seshadripuram Educational Trust runs ~24 institutions with about 20,000 students. 📜', links: [L('About the Management', '/about/management'), L('SET Institutions', '/about/set-institutions')], chips: ['About', 'Management', 'Courses'] }) },
  { id: 'principal', keywords: ['principal', 'principals desk', "principal's desk", 'head of college', 'principal message'],
    reply: () => ({ text: 'Our Principal is Dr. S. N. Venkatesh. SFGC nurtures a unique, values-based system of education blended with corporate professionalism. Read the full message on the site. 🎓', links: [L("Principal's Desk", '/about/principal-desk')], chips: ['About', 'Vision & Mission'] }) },
  { id: 'vision', keywords: ['vision', 'mission', 'values', 'objective', 'goal', 'philosophy'],
    reply: () => ({ text: 'SFGC’s vision is to provide affordable, relevant and quality education, with world-class infrastructure for learning and research — creating dynamic leaders, entrepreneurs and professionals. 🌟', links: [L('Vision & Mission', '/about/vision-mission')], chips: ['About', 'Principal'] }) },
  { id: 'management', keywords: ['management', 'governing council', 'management team', 'trustees', 'board', 'leadership', 'administration'],
    reply: () => ({ text: 'The college is guided by the Seshadripuram Educational Trust and its Governing Council & Management Team.', links: [L('Governing Council', '/about/governing-council'), L('Management Team', '/about/management-team')], chips: ['History', 'About'] }) },
  { id: 'iqac', keywords: ['iqac', 'quality assurance', 'internal quality', 'quality cell'],
    reply: () => ({ text: 'The Internal Quality Assurance Cell (IQAC) drives continuous quality improvement in academics and administration.', links: [L('IQAC', '/about/iqac')], chips: ['NAAC', 'About'] }) },
  { id: 'nirf', keywords: ['nirf', 'national ranking', 'ranking framework'],
    reply: () => ({ text: 'SFGC participates in the National Institutional Ranking Framework (NIRF). See the NIRF page for details.', links: [L('NIRF', '/about/nirf')], chips: ['About', 'Accreditation'] }) },
  { id: 'mou', keywords: ['mou', 'mous', 'collaboration', 'tie up', 'tie-up', 'partnership', 'industry academia'],
    reply: () => ({ text: 'SFGC has MoUs and collaborations — including with universities in the USA, UK and Europe — for internships, exchange and placements. 🤝', links: [L('MoUs', '/about/mous')], chips: ['Placements', 'About'] }) },
  { id: 'rti', keywords: ['rti', 'right to information', 'transparency'],
    reply: () => ({ text: 'The RTI Declaration is published on the site for transparency.', links: [L('RTI Declaration', '/about/rti')], chips: ['About'] }) },
  { id: 'virtualtour', keywords: ['virtual tour', 'campus tour', 'see campus', 'tour', 'photos of campus'],
    reply: () => ({ text: 'Take a virtual tour of the campus, or browse our photo gallery. 📸', links: [L('Virtual Tour', '/about/virtual-tour'), L('Photo Gallery', '/happenings/gallery')], chips: ['Facilities', 'Gallery'] }) },

  // ── Student support cells ──────────────────────────────────────
  { id: 'cells', keywords: ['cell', 'cells', 'anti ragging', 'ragging', 'grievance', 'grievances', 'complaint', 'harassment', 'sexual harassment', 'women empowerment', 'sc st', 'sc/st', 'obc', 'minority', 'counselling', 'counseling', 'mentoring', 'support'],
    reply: () => ({ text: 'SFGC has dedicated support cells for a safe, inclusive campus: Anti-Ragging, Grievance Redressal, Anti Sexual Harassment, Counselling, Women Empowerment, SC/ST, OBC and Minority cells, plus student mentoring. 🛡️', links: [L('Anti-Ragging', '/students/anti-ragging'), L('Grievances', '/students/grievances'), L('Women Empowerment', '/students/women-empowerment'), L('Counselling', '/students/counselling')], chips: ['Student council', 'Contact'] }) },
  { id: 'council', keywords: ['student council', 'council', 'union', 'representatives'],
    reply: () => ({ text: 'The Student Council represents students and helps organise activities and events across campus.', links: [L('Student Council', '/students/council')], chips: ['Activities', 'Events'] }) },
  { id: 'competitive', keywords: ['competitive exam', 'competitive exams', 'upsc', 'bank exam', 'exam corner', 'coaching', 'gate', 'cat'],
    reply: () => ({ text: 'The Competitive Exam Corner supports students preparing for government, banking and other competitive exams. 📖', links: [L('Competitive Exam Corner', '/students/competitive-exams')], chips: ['Skills', 'Placements'] }) },
  { id: 'cloud-campus', keywords: ['cloud campus', 'online learning', 'e-learning', 'lms', 'digital learning'],
    reply: () => ({ text: 'The Cloud Campus offers digital learning resources for students. ☁️', links: [L('Cloud Campus', '/students/cloud-campus')], chips: ['Student Portal', 'Downloads'] }) },
  { id: 'testimonials', keywords: ['testimonial', 'testimonials', 'reviews', 'student feedback', 'what students say', 'alumni say'],
    reply: () => ({ text: 'Read what our students and alumni say about their SFGC experience. 💬', links: [L('Testimonials', '/students/testimonials')], chips: ['Alumni', 'Placements'] }) },

  // ── Alumni ─────────────────────────────────────────────────────
  { id: 'alumni', keywords: ['alumni', 'alumnus', 'alumna', 'ex student', 'past students', 'alumni registration', 'alumni association', 'old students'],
    reply: () => ({ text: 'Are you an SFGC alumnus? Join the Alumni Association and register to stay connected, network and give back. 🎓', links: [L('Alumni Registration', '/alumni/registration'), L('Alumni Association', '/alumni/association')], chips: ['Testimonials', 'Contact'] }) },

  // ── Happenings ─────────────────────────────────────────────────
  { id: 'news', keywords: ['news', 'latest news', 'updates', 'notice', 'notices', 'announcement', 'announcements', 'circular'],
    reply: () => ({ text: 'Catch the latest news, notices and announcements from SFGC. 📰', links: [L('Latest News', '/happenings/news')], chips: ['Events', 'Calendar'] }) },
  { id: 'calendar', keywords: ['calendar', 'academic calendar', 'schedule', 'holidays', 'exam dates', 'timetable', 'important dates'],
    reply: () => ({ text: 'The Academics Calendar lists term dates, holidays and important events. 🗓️', links: [L('Academics Calendar', '/happenings/calendar')], chips: ['Events', 'News'] }) },
  { id: 'visitors', keywords: ['eminent', 'visitor', 'visitors', 'guest', 'guests', 'chief guest', 'dalai lama', 'sudha murthy', 'anna hazare', 'sam pitroda', 'kailash satyarthi', 'notable', 'celebrity'],
    reply: () => ({ text: 'SFGC has hosted eminent visitors — His Holiness the Dalai Lama, Nobel Laureate Kailash Satyarthi, Mrs. Sudha Murthy, Dr. Sam Pitroda, Anna Hazare and more. 🌟', links: [L('Eminent Visitors', '/happenings/visitors')], chips: ['Events', 'Achievements'] }) },
  { id: 'achievements', keywords: ['achievement', 'achievements', 'award', 'awards', 'record', 'guinness', 'kishan', 'proud', 'recognition'],
    reply: () => ({ text: 'A few proud moments: a Guinness World Record by our student H. Kishan, and the Karnataka State Best NSS Unit Award. 🏆', links: [L('NSS', '/activities/nss'), L('Sports Achievements', '/sports/achievements')], chips: ['NSS', 'Sports', 'Events'] }) },
  { id: 'gallery', keywords: ['gallery', 'photos', 'pictures', 'images', 'video', 'videos'],
    reply: () => ({ text: 'Browse our photo gallery and videos of campus life and events. 📸', links: [L('Photo Gallery', '/happenings/gallery'), L('Videos', '/happenings/videos')], chips: ['Virtual tour', 'Events'] }) },
  { id: 'downloads', keywords: ['download', 'downloads', 'syllabus', 'question bank', 'previous papers', 'newsletter', 'blood donor', 'handbook'],
    reply: () => ({ text: 'Downloads like the Syllabus, Question Bank, Newsletter and Academics Calendar are available on the site.', links: [L('Question Bank', '/happenings/news'), L('Academics Calendar', '/happenings/calendar')], chips: ['Courses', 'Calendar'] }) },

  // ── Contact / location / timing ────────────────────────────────
  { id: 'contact', keywords: ['contact', 'phone', 'call', 'email', 'mail', 'number', 'reach out', 'talk to', 'enquiry', 'enquire', 'query', 'helpline', 'get in touch', 'talk to someone', 'talk to a person', 'human help', 'representative', 'customer care', 'connect me', 'speak to', 'contact number', 'phone number', 'mobile number', 'whatsapp number', 'college number', 'office number', 'contact details', 'contact info'],
    reply: () => ({ text: `You can reach us at:\n📞 ${COLLEGE.phone}\n✉️ ${COLLEGE.email}\n📍 Yelahanka, Bengaluru`, links: [L('Contact & enquiry form', '/contact')], chips: ['Location', 'Admissions'] }) },
  { id: 'location', keywords: ['where', 'location', 'address', 'reach', 'directions', 'map', 'located', 'situated', 'how to reach', 'yelahanka', 'bengaluru', 'bangalore', 'place', 'pincode', 'pin code', '560064', 'google map', 'nearest bus stop', 'how far', 'which area', 'doddaballapur', 'landmark'],
    reply: () => ({ text: 'We’re at New Town, Yelahanka, on the Doddaballapur–Bengaluru Highway, Bengaluru – 560064. 📍 A prominent, well-connected landmark.', links: [L('Locate us / Map', '/contact')], chips: ['Contact', 'Admissions'] }) },
  { id: 'timings', keywords: ['timing', 'timings', 'hours', 'open', 'working hours', 'office hours', 'when open', 'college time'],
    reply: () => ({ text: 'College office hours are generally 9:30 AM – 4:30 PM on working days. For specific queries, the office is happy to help. ⏰', links: [L('Contact', '/contact')], chips: ['Contact', 'Location'] }) },

  // ── Extra topics (from the college help-bot intent set) ────────
  { id: 'deadlines', keywords: ['last date', 'deadline', 'deadlines', 'closing date', 'form submission last date', 'when do applications close', 'admission last date', 'days left to apply', 'last date to apply', 'application deadline'],
    reply: () => ({ text: 'Admissions for 2026–27 are open now, and important dates are posted on the academics calendar and news pages. To confirm the current last date, please check those or contact the office — it’s best to apply early. 🗓️', links: [L('Academics Calendar', '/happenings/calendar'), L('Admission', '/admission')], chips: ['How to apply', 'Contact'] }) },
  { id: 'cutoffs', keywords: ['cutoff', 'cut off', 'merit list', 'selected', 'selection list', 'did i get selected', 'expected cutoff', 'am i selected'],
    reply: () => ({ text: 'Admission at SFGC is merit-based — there’s no fixed public cutoff, as it depends on the applicant pool each year. Apply and the admission office will guide you on your selection status. 📋', links: [L('Admission', '/admission'), L('Contact', '/contact')], chips: ['Eligibility', 'How to apply'] }) },
  { id: 'documents', keywords: ['document', 'documents', 'certificates required', 'marksheet', 'marksheets', 'papers needed', 'aadhaar', 'id proof', 'what documents', 'documents required', 'papers to bring'],
    reply: () => ({ text: 'You’ll typically need: 10th & 12th marksheets, Transfer Certificate (TC), ID proof (Aadhaar), passport-size photos, and a category certificate if applicable — originals plus photocopies. For the exact list, contact the admission office. 📄', links: [L('How to apply', '/admission/how-to-apply'), L('Contact', '/contact')], chips: ['Admissions', 'Eligibility'] }) },
  { id: 'safety', keywords: ['safe', 'safety', 'security', 'cctv', 'safe for girls', 'is it safe', 'campus safe', 'secure', 'outstation'],
    reply: () => ({ text: 'Student safety is a top priority — the campus has security, a strict Anti-Ragging policy with an active committee, and dedicated cells for grievances and anti-sexual-harassment, plus counselling support. 🛡️', links: [L('Anti-Ragging', '/students/anti-ragging'), L('Grievances', '/students/grievances')], chips: ['Support cells', 'Hostel', 'Contact'] }) },
  { id: 'medical', keywords: ['medical', 'doctor', 'sick', 'hospital', 'health center', 'health centre', 'first aid', 'ambulance', 'clinic', 'illness', 'unwell'],
    reply: () => ({ text: 'The campus has a Wellness Centre for students’ health and first-aid needs. For any emergency, please reach the college office right away. 🏥', links: [L('Wellness Centre', '/facilities/wellness-centre'), L('Contact', '/contact')], chips: ['Facilities', 'Hostel'] }) },
  { id: 'parent-portal', keywords: ['parent portal', 'track my child', 'my child', 'attendance updates', 'parent teacher', 'ptm', 'academic progress', 'progress report', 'as a parent', 'my son', 'my daughter', 'ward'],
    reply: () => ({ text: 'Parents can follow a student’s attendance, internal marks and progress card through the Student Portal, and every student has an assigned mentor. Parent–teacher interactions are held periodically. 👪', links: [L('Student Portal', '/student'), L('Mentoring', '/students/mentoring')], chips: ['Attendance', 'Contact'] }) },
  { id: 'exams', keywords: ['exam', 'exams', 'exam timetable', 'timetable', 'hall ticket', 'semester exam', 'revaluation', 'result kab aayega', 'exam schedule', 'marks card', 'supplementary', 'when are exams'],
    reply: () => ({ text: 'Your internal marks and progress card are in the Student Portal. University exam timetables and results are announced by the college/university — watch the news and calendar pages, or ask the office. 📝', links: [L('Student Portal', '/student'), L('Latest News', '/happenings/news'), L('Academics Calendar', '/happenings/calendar')], chips: ['Attendance', 'Contact'] }) },
  { id: 'certificates', keywords: ['bonafide', 'transcript', 'migration certificate', 'transfer certificate', 'duplicate marksheet', 'study certificate', 'character certificate', 'certificate request', 'need a certificate'],
    reply: () => ({ text: 'For certificates like bonafide, transcript, migration or transfer certificate (TC), please apply at the college office — they’ll guide you on the process and timeline. 📃', links: [L('Contact office', '/contact')], chips: ['Student Portal', 'Contact'] }) },
  { id: 'fee-dues', keywords: ['pay my fees', 'pay fees online', 'pending dues', 'fee receipt', 'fee due', 'outstanding balance', 'late fee', 'installment', 'installments', 'refund', 'fee payment'],
    reply: () => ({ text: 'For fee payment, dues, receipts, instalments or refunds, please contact the college accounts office. You can find the fee structure in the admission section. 💳', links: [L('Fee structure', '/admission/fee-structure'), L('Contact', '/contact')], chips: ['Fees', 'Scholarships'] }) },
  { id: 'transport', keywords: ['bus', 'bus route', 'bus routes', 'bus timings', 'bus pass', 'transport', 'shuttle', 'college bus', 'how to travel'],
    reply: () => ({ text: 'For transport and bus-route details, please contact the college office — they’ll share the current options for your area. 🚌', links: [L('Contact', '/contact'), L('Locate us', '/contact')], chips: ['Location', 'Hostel'] }) },
  { id: 'it-support', keywords: ['wifi', 'wi-fi', 'password reset', 'forgot password', 'portal not opening', 'login issue', 'login problem', 'internet not working', 'it helpdesk', 'cant login', 'reset password'],
    reply: () => ({ text: 'For the student/faculty portals, log in with your ID and password (demo student: SFGC101 / student123). If you’re facing login or Wi-Fi issues, please contact the college office / IT desk. 🔐', links: [L('Student Portal', '/student'), L('Contact', '/contact')], chips: ['Student Portal', 'Contact'] }) },
  { id: 'registration', keywords: ['elective', 'electives', 'course registration', 'add drop', 'subject enrollment', 'choose subjects', 'credits', 'subject selection', 'register for subjects'],
    reply: () => ({ text: 'Course and elective registration is handled by your department each semester. Please check with your department or the office for the current window and process. 🗂️', links: [L('Departments', '/departments/faculty'), L('Contact', '/contact')], chips: ['Departments', 'Courses'] }) },

  // ── Bot identity & small talk ──────────────────────────────────
  { id: 'identity', keywords: ['who are you', 'your name', 'what is your name', 'who made you', 'who created you', 'are you a bot', 'are you a robot', 'are you human', 'are you real', 'what are you', 'about you', 'who r u', 'introduce yourself'],
    reply: () => ({ text: `I'm ${ASSISTANT.name} 🦉 — the SFGC virtual assistant. I'm here 24/7 to help you with admissions, courses, fees, facilities, the student & faculty portals and anything else about Seshadripuram First Grade College. What can I help you with?`, chips: ['Admissions', 'Courses', 'Facilities', 'Contact'] }) },
  { id: 'smalltalk', keywords: ['how are you', 'how r u', 'whats up', 'what are you doing', 'how do you do', 'you good', 'hows it going', 'are you there', 'you busy'],
    reply: () => ({ text: `I'm doing great, thanks for asking! 😊 Always ready to help you with anything about SFGC. What would you like to know?`, chips: ['Admissions', 'Courses', 'Events', 'Facilities'] }) },
  { id: 'languages', keywords: ['do you speak hindi', 'kannada', 'hindi', 'regional language', 'which languages', 'speak in hindi', 'bolo hindi'],
    reply: () => ({ text: `I understand everyday English (and common Hindi/Kannada words mixed in). Ask me anything about SFGC and I'll do my best! 🙂 For a detailed chat in your language, the office team is happy to help.`, links: [L('Contact', '/contact')], chips: ['Admissions', 'Courses', 'Contact'] }) },

  // ── Admission FAQs (deeper) ────────────────────────────────────
  { id: 'entrance', keywords: ['entrance exam', 'entrance test', 'kcet', 'cet', 'jee', 'neet', 'need entrance', 'entrance required', 'admission test', 'do i need to write exam', 'is there entrance', 'entrance based'],
    reply: () => ({ text: 'Admission at SFGC is merit-based on your qualifying exam (PUC/12th for UG, a Bachelor’s degree for PG) — most programmes don’t need a separate entrance exam. For any programme-specific requirement, please check with the admission office. 📋', links: [L('Eligibility & Admission', '/admission/eligibility'), L('How to apply', '/admission/how-to-apply')], chips: ['Eligibility', 'How to apply', 'Courses'] }) },
  { id: 'seats', keywords: ['seat available', 'seats available', 'available seats', 'seat availability', 'seats left', 'vacancy', 'vacant seats', 'is seat available', 'any seats', 'seats', 'seats remaining', 'still open', 'seat booking', 'seats filled', 'how many seats'],
    reply: () => ({ text: 'Seats for 2026–27 are being filled across UG & PG programmes, and popular courses go fast! 🎟️ For live availability in your course, please contact the admission office or apply early to reserve your place.', links: [L('Admission', '/admission'), L('Enquiry form', '/contact')], chips: ['How to apply', 'Courses', 'Contact'] }) },
  { id: 'admission-status', keywords: ['application status', 'admission status', 'track my application', 'did my application', 'status of my form', 'is my form submitted', 'check application', 'application id'],
    reply: () => ({ text: 'To check the status of your application or confirm your seat, please contact the admission office with your name/application details — they’ll update you right away. 📨', links: [L('Contact', '/contact'), L('Admission', '/admission')], chips: ['How to apply', 'Contact'] }) },
  { id: 'entrance-age', keywords: ['age limit', 'maximum age', 'max age', 'age criteria', 'is there age limit', 'age restriction', 'too old', 'minimum age', 'age bar'],
    reply: () => ({ text: 'There’s generally no upper age bar for our regular UG/PG programmes — eligibility is based on your qualifying exam. For any specific case, please confirm with the admission office. 🎂', links: [L('Eligibility', '/admission/eligibility'), L('Contact', '/contact')], chips: ['Eligibility', 'Admissions'] }) },
  { id: 'reservation', keywords: ['reservation', 'quota', 'management quota', 'reserved seats', 'category seats', 'sc st quota', 'obc quota', 'nri quota', 'donation seat', 'caste based seat'],
    reply: () => ({ text: 'Admissions follow university norms and applicable category reservations, and there are dedicated SC/ST, OBC and Minority support cells on campus. For category-seat and eligibility details, please contact the admission office. 📋', links: [L('Admission', '/admission'), L('Contact', '/contact')], chips: ['Eligibility', 'Scholarships', 'Support cells'] }) },
  { id: 'transfer-in', keywords: ['transfer from another college', 'change college', 'migration from', 'transfer certificate admission', 'shift college', 'inter college transfer', 'join in second year', 'college change', 'lateral entry', 'direct second year'],
    reply: () => ({ text: 'If you’re moving from another college, the admission office will guide you on transfer/migration requirements and available seats. Please reach out with your marksheets and TC. 🔁', links: [L('Contact', '/contact'), L('How to apply', '/admission/how-to-apply')], chips: ['Documents', 'Admissions'] }) },

  // ── Course & academics FAQs ────────────────────────────────────
  { id: 'duration', keywords: ['duration', 'how many years', 'course length', 'how long is', 'number of years', 'how many semesters', 'semesters', 'years course', 'time to complete', 'how long course'],
    reply: () => ({ text: 'Most UG programmes (B.Com, BCA, BBA, BSc) run for 3 years / 6 semesters, and PG programmes (M.Com, MCA, MBA) run for 2 years / 4 semesters. See a course page for its exact structure. ⏳', links: [L('All courses', '/courses/overview')], chips: ['Courses', 'Admissions'] }) },
  { id: 'medium', keywords: ['medium of instruction', 'medium', 'language of teaching', 'english medium', 'taught in english', 'which language', 'kannada medium', 'teaching language', 'classes in english'],
    reply: () => ({ text: 'The medium of instruction at SFGC is English across all programmes. 🗣️', links: [L('Courses', '/courses/overview')], chips: ['Courses', 'Admissions'] }) },
  { id: 'mode', keywords: ['online classes', 'offline classes', 'online or offline', 'class mode', 'distance', 'correspondence', 'is it online', 'physical classes', 'regular college', 'in person classes', 'day college'],
    reply: () => ({ text: 'SFGC is a regular, on-campus college with in-person classroom teaching, supported by digital resources through the Cloud Campus. ☁️🏫', links: [L('Cloud Campus', '/students/cloud-campus'), L('Facilities', '/facilities/overview')], chips: ['Facilities', 'Courses'] }) },
  { id: 'attendance-rules', keywords: ['minimum attendance', 'attendance required', 'attendance percentage required', 'attendance shortage', 'condonation', 'how much attendance', 'attendance rule', 'low attendance', 'attendance criteria', 'attendance needed', '75'],
    reply: () => ({ text: 'Students are expected to keep the minimum attendance the university requires (commonly around 75%). Shortage can affect exam eligibility, and genuine/medical cases may apply for condonation. Track your live attendance in the Student Portal. 📅', links: [L('Student Portal', '/student'), L('Contact', '/contact')], chips: ['Attendance', 'Exams'] }) },
  { id: 'results', keywords: ['result declared', 'when result', 'result date', 'result kab', 'check result', 'semester result', 'results out', 'university result', 'result announcement', 'my result'],
    reply: () => ({ text: 'Your internal marks and progress card are in the Student Portal; university/semester results are announced by the university and posted on the news page. Watch news & calendar, or ask the office. 📊', links: [L('Student Portal', '/student'), L('Latest News', '/happenings/news')], chips: ['Exams', 'Student Portal'] }) },
  { id: 'holidays', keywords: ['holiday', 'holidays', 'holiday list', 'when is college closed', 'next holiday', 'vacation', 'semester break', 'college closed', 'holidays list'],
    reply: () => ({ text: 'Holidays and term breaks are listed in the Academics Calendar. 🗓️', links: [L('Academics Calendar', '/happenings/calendar')], chips: ['Calendar', 'Events'] }) },

  // ── Money matters (deeper) ─────────────────────────────────────
  { id: 'loan', keywords: ['education loan', 'study loan', 'bank loan', 'emi', 'loan assistance', 'loan help', 'finance my education', 'loan facility', 'pay in installments'],
    reply: () => ({ text: 'SFGC supports deserving students with scholarships and welfare aid, and the office can guide you on education-loan documentation for banks. 💳 See the scholarships page or contact the office.', links: [L('Scholarships & Welfare', '/students/scholarships'), L('Contact', '/contact')], chips: ['Scholarships', 'Fees'] }) },
  { id: 'refund', keywords: ['refund', 'refund policy', 'money back', 'cancel admission', 'withdraw admission', 'fee refund', 'get fees back', 'cancellation policy'],
    reply: () => ({ text: 'Fee refunds on withdrawal are processed as per university/college norms. For the exact refund policy and process, please contact the accounts office. 💰', links: [L('Contact', '/contact'), L('Fee structure', '/admission/fee-structure')], chips: ['Fees', 'Contact'] }) },

  // ── Campus life (deeper) ───────────────────────────────────────
  { id: 'dress-code', keywords: ['dress code', 'uniform', 'do we have uniform', 'is there uniform', 'what to wear', 'dress rules', 'formal dress', 'casual dress'],
    reply: () => ({ text: 'SFGC expects students to dress neatly and decently as per the college code of conduct. For any prescribed dress/ID-card norms, the office will brief you at orientation. 👔', links: [L('Contact', '/contact')], chips: ['Facilities', 'Student Portal'] }) },
  { id: 'parking', keywords: ['parking', 'vehicle parking', 'bike parking', 'car parking', 'park my vehicle', 'two wheeler', 'can i bring bike', 'can i bring car', 'do parking', 'where is parking', 'where can i park', 'parking space', 'parking available'],
    reply: () => ({ text: 'The campus provides parking for students’ vehicles. For specifics, reception can help. 🅿️', links: [L('Facilities', '/facilities/overview'), L('Contact', '/contact')], chips: ['Facilities', 'Location'] }) },
  { id: 'social', keywords: ['social media', 'instagram', 'facebook', 'youtube', 'twitter', 'whatsapp', 'insta', 'follow you', 'social handles', 'linkedin', 'website'],
    reply: () => ({ text: 'For SFGC’s latest updates, events and photos, check the news & gallery pages on the website, or ask the office for the official social-media handles. 📱', links: [L('Latest News', '/happenings/news'), L('Gallery', '/happenings/gallery'), L('Contact', '/contact')], chips: ['News', 'Events', 'Contact'] }) },
  { id: 'international', keywords: ['international student', 'foreign student', 'nri', 'study from abroad', 'overseas', 'foreign national', 'international admission', 'exchange program'],
    reply: () => ({ text: 'SFGC has global tie-ups and MoUs (including universities in the USA, UK & Europe) and offers the SAGE Global MBA. For international/NRI admission queries, please contact the office. 🌐', links: [L('MoUs', '/about/mous'), L('SAGE Global MBA', '/courses/global-mba'), L('Contact', '/contact')], chips: ['Global MBA', 'Admissions'] }) },
]

const FALLBACK = {
  text: `I'm not sure I caught that 🤔 — but I can help with any of these:`,
  chips: ['Admissions', 'Courses', 'Fees', 'Facilities', 'Placements', 'Student Portal', 'Events', 'Contact'],
}

// Common short-forms / misspellings folded to a canonical word before matching,
// so "clg", "admsn", "cource", "plz" etc. still hit the right intent.
const SYNONYMS = {
  clg: 'college', collage: 'college', colage: 'college', kollege: 'college',
  admsn: 'admission', admision: 'admission', admisson: 'admission', addmission: 'admission', admisssion: 'admission',
  cource: 'course', corse: 'course', coures: 'course', coarse: 'course',
  scholorship: 'scholarship', schlorship: 'scholarship', scholaship: 'scholarship',
  fess: 'fees', feez: 'fees',
  hostl: 'hostel', hostal: 'hostel',
  plcement: 'placement', placment: 'placement', plesment: 'placement',
  eligiblity: 'eligibility', eligibilty: 'eligibility',
  contct: 'contact', adress: 'address', libary: 'library', libraray: 'library',
  plz: 'please', pls: 'please',
  u: 'you', ur: 'your', wt: 'what', wht: 'what', hw: 'how',
}

function normalize(s) {
  const cleaned = (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const mapped = cleaned.split(' ').map((w) => SYNONYMS[w] || w).join(' ')
  return ` ${mapped} `
}

export function getReply(message) {
  const text = normalize(message)
  let best = null
  let bestScore = 0
  for (const intent of INTENTS) {
    let score = 0
    for (const kw of intent.keywords) {
      const phrase = kw.includes(' ')
      // whole-word / phrase match scores highest; loose substring is a weaker
      // signal and is skipped for short tokens (<4 chars) so "ug" won't fire on
      // "August", "cos" on "cost", "set" on "onset", etc.
      if (text.includes(` ${kw} `)) score += phrase ? 4 : 2
      else if ((phrase || kw.length >= 4) && text.includes(kw)) score += phrase ? 3 : 1
    }
    if (score > bestScore) { bestScore = score; best = intent }
  }
  return best ? best.reply() : FALLBACK
}
