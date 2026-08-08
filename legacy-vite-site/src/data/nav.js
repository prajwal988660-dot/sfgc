// Full navigation tree for SFGC — drives the mega-menu AND every route in the app.
// Each item: { label, slug, children? }. A slug of null means the top item is a
// header only (its children are the links). External/PDF links use { external: true }.

export const NAV = [
  {
    label: 'About Us',
    slug: 'about',
    children: [
      { label: 'An Overview', slug: 'about/overview' },
      { label: 'Vision & Mission', slug: 'about/vision-mission' },
      { label: "Principal's Desk", slug: 'about/principal-desk' },
      { label: 'Governing Council', slug: 'about/governing-council' },
      { label: 'IQAC Overview', slug: 'about/iqac' },
      { label: 'IQAC Minutes of Meeting', slug: 'about/iqac-minutes' },
      { label: 'Best Practices', slug: 'about/best-practices' },
      { label: 'Distinctiveness', slug: 'about/distinctiveness' },
      { label: 'Strategic Perspective Plan', slug: 'about/strategic-plan' },
      { label: "Student's Attributes", slug: 'about/student-attributes' },
      { label: 'NIRF', slug: 'about/nirf' },
      { label: 'Virtual Tour', slug: 'about/virtual-tour' },
      { label: 'Growth & Performance', slug: 'about/growth-performance' },
      { label: 'About the Management', slug: 'about/management' },
      { label: 'Management Team', slug: 'about/management-team' },
      { label: 'SET Institutions', slug: 'about/set-institutions' },
      { label: 'MoUs', slug: 'about/mous' },
      { label: 'Magazines & Publications', slug: 'about/publications' },
      { label: 'RTI Declaration', slug: 'about/rti' },
    ],
  },
  {
    label: 'Courses',
    slug: 'courses',
    children: [
      { label: 'An Overview', slug: 'courses/overview' },
      { label: 'BBA', slug: 'courses/bba' },
      { label: 'BBA in Aviation', slug: 'courses/bba-aviation' },
      { label: 'B.Com', slug: 'courses/bcom' },
      { label: 'B.Com with BDA', slug: 'courses/bcom-bda' },
      { label: 'BCA', slug: 'courses/bca' },
      { label: 'BSc BBG', slug: 'courses/bsc-bbg' },
      { label: 'BSc EMC', slug: 'courses/bsc-emc' },
      { label: 'MBA', slug: 'courses/mba' },
      { label: 'MCA', slug: 'courses/mca' },
      { label: 'M.Com', slug: 'courses/mcom' },
      { label: 'SAGE - Global MBA', slug: 'courses/global-mba' },
      { label: 'POs, PSOs, COs', slug: 'courses/pos-psos-cos' },
      { label: 'Add On Program', slug: 'courses/add-on' },
      { label: 'Research Centre', slug: 'courses/research-centre' },
      { label: 'Poster Presentation', slug: 'courses/poster-presentation' },
      { label: 'Conferences', slug: 'courses/conferences' },
      { label: 'Ph.D & M.Phil', slug: 'courses/phd-mphil' },
      { label: 'Books Published', slug: 'courses/books-published' },
      { label: 'Feedback on Curriculum', slug: 'courses/feedback-curriculum' },
    ],
  },
  {
    label: 'Admission',
    slug: 'admission',
    children: [
      { label: 'Admission Overview', slug: 'admission' },
      { label: 'How to Apply', slug: 'admission/how-to-apply' },
      { label: 'Eligibility', slug: 'admission/eligibility' },
      { label: 'Fee Structure', slug: 'admission/fee-structure' },
      { label: 'College Prospectus', slug: 'admission/prospectus' },
      { label: 'Scholarships', slug: 'admission/scholarships' },
    ],
  },
  {
    label: 'Departments',
    slug: 'departments',
    children: [
      { label: 'Department of Commerce', slug: 'departments/commerce' },
      { label: 'Department of Management', slug: 'departments/management' },
      { label: 'Department of Science', slug: 'departments/science' },
      { label: 'Faculty Overview', slug: 'departments/faculty' },
      { label: 'Academic Staff', slug: 'departments/academic-staff' },
      { label: 'Languages', slug: 'departments/languages' },
      { label: 'Physical Science', slug: 'departments/physical-science' },
      { label: 'Life Science', slug: 'departments/life-science' },
      { label: 'Computer Science', slug: 'departments/computer-science' },
      { label: 'Physical Education', slug: 'departments/physical-education' },
      { label: 'Library', slug: 'departments/library' },
      { label: 'Administrative Staff', slug: 'departments/admin-staff' },
      { label: 'Supporting Staff', slug: 'departments/supporting-staff' },
      { label: 'FDPs', slug: 'departments/fdps' },
    ],
  },
  {
    label: 'Facilities',
    slug: 'facilities',
    children: [
      { label: 'An Overview', slug: 'facilities/overview' },
      { label: 'Classroom', slug: 'facilities/classroom' },
      { label: 'ICT', slug: 'facilities/ict' },
      { label: 'Auditorium', slug: 'facilities/auditorium' },
      { label: 'Sabhangana', slug: 'facilities/sabhangana' },
      { label: 'Library', slug: 'facilities/library' },
      { label: 'Canteen', slug: 'facilities/canteen' },
      { label: 'Halls of Residence', slug: 'facilities/hostels' },
      { label: 'Wellness Centre', slug: 'facilities/wellness-centre' },
      { label: 'Multi Gym', slug: 'facilities/gym' },
      { label: 'Laboratories', slug: 'facilities/laboratories' },
      { label: 'Other Facilities', slug: 'facilities/others' },
    ],
  },
  {
    label: 'Students',
    slug: 'students',
    children: [
      { label: 'Student Council', slug: 'students/council' },
      { label: 'Skills Enhancement', slug: 'students/skills' },
      { label: 'Career & Placements', slug: 'students/placements' },
      { label: 'Mentoring', slug: 'students/mentoring' },
      { label: 'Anti Ragging Cell', slug: 'students/anti-ragging' },
      { label: 'Grievances Redressal Cell', slug: 'students/grievances' },
      { label: 'Anti Sexual Harassment Cell', slug: 'students/anti-harassment' },
      { label: 'Counselling Cell', slug: 'students/counselling' },
      { label: 'Women Empowerment Cell', slug: 'students/women-empowerment' },
      { label: 'SC/ST Cell', slug: 'students/sc-st-cell' },
      { label: 'OBC Cell', slug: 'students/obc-cell' },
      { label: 'Minority Cell', slug: 'students/minority-cell' },
      { label: 'Student Feedback', slug: 'students/feedback' },
      { label: 'Scholarships and Welfare', slug: 'students/scholarships' },
      { label: 'Competitive Exam Corner', slug: 'students/competitive-exams' },
      { label: 'Cloud Campus', slug: 'students/cloud-campus' },
      { label: 'Testimonials', slug: 'students/testimonials' },
    ],
  },
  {
    label: 'Activities',
    slug: 'activities',
    children: [
      { label: 'NSS', slug: 'activities/nss' },
      { label: 'Cultural Activities', slug: 'activities/cultural' },
      { label: 'NCC', slug: 'activities/ncc' },
      { label: 'Youth Red Cross', slug: 'activities/yrc' },
      { label: 'Civil Defence Division', slug: 'activities/civil-defence' },
      { label: 'Eco Watch', slug: 'activities/eco-watch' },
      { label: 'Committees', slug: 'activities/committees' },
      { label: 'Study Center', slug: 'activities/study-center' },
      { label: 'Clubs & Forums', slug: 'activities/clubs' },
    ],
  },
  {
    label: 'Sports',
    slug: 'sports',
    children: [
      { label: 'An Overview', slug: 'sports/overview' },
      { label: 'Activities', slug: 'sports/activities' },
      { label: 'Achievements', slug: 'sports/achievements' },
    ],
  },
  {
    label: 'CGE',
    slug: 'cge',
    children: [
      { label: 'An Overview', slug: 'cge/overview' },
      { label: 'Vision & Mission', slug: 'cge/vision-mission' },
      { label: 'Courses Offered', slug: 'cge/courses' },
      { label: 'Activities', slug: 'cge/activities' },
    ],
  },
  {
    label: 'Alumni',
    slug: 'alumni',
    children: [
      { label: 'Alumni Registration', slug: 'alumni/registration' },
      { label: 'Alumni Association', slug: 'alumni/association' },
    ],
  },
  {
    label: 'Happenings',
    slug: 'happenings',
    children: [
      { label: 'Academics Calendar', slug: 'happenings/calendar' },
      { label: 'Latest News', slug: 'happenings/news' },
      { label: 'Latest Events', slug: 'happenings/events' },
      { label: 'Eminent Visitors', slug: 'happenings/visitors' },
      { label: 'Press Clippings', slug: 'happenings/press' },
      { label: 'Photo Gallery', slug: 'happenings/gallery' },
      { label: 'Videos', slug: 'happenings/videos' },
    ],
  },
]

// Flatten to a lookup of every routable slug -> { label, section, sectionLabel }
export const ROUTES = (() => {
  const map = {}
  NAV.forEach((section) => {
    section.children.forEach((child) => {
      map[child.slug] = {
        label: child.label,
        section: section.slug,
        sectionLabel: section.label,
      }
    })
    // section landing page defaults to first child
    if (!map[section.slug]) {
      map[section.slug] = {
        label: section.label,
        section: section.slug,
        sectionLabel: section.label,
        isSectionRoot: true,
      }
    }
  })
  return map
})()

// Return the sub-menu (sibling links) for a given section slug — used by the
// inner-page left sidebar.
export function sectionMenu(sectionSlug) {
  const section = NAV.find((s) => s.slug === sectionSlug)
  return section ? section.children : []
}
