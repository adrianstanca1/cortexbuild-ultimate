import type {
  Project, Invoice, SafetyIncident, RFI, ChangeOrder,
  TeamMember, Equipment, Subcontractor, Document, Timesheet,
  Meeting, Material, PunchListItem, Inspection, RAMSDocument,
  CISReturn, TenderRequest, Contact, DailyReport
} from '../types';

export const CURRENT_USER = {
  id: 'u1',
  name: 'Adrian Stanca',
  email: 'adrian@cortexbuild.co.uk',
  role: 'company_owner' as const,
  company: 'CortexBuild Ltd',
  phone: '07700 900123',
};

// ─── PROJECTS ───────────────────────────────────────────────────────────────
export const projects: Project[] = [
  { id: 'p1', name: 'Canary Wharf Office Complex', client: 'Meridian Properties', status: 'active', progress: 68, budget: 4200000, spent: 2856000, startDate: '2025-06-01', endDate: '2026-08-31', manager: 'James Harrington', location: 'London, E14', type: 'Commercial', phase: 'Structural', workers: 42, contractValue: 4350000 },
  { id: 'p2', name: 'Manchester City Apartments', client: 'Northern Living Ltd', status: 'active', progress: 34, budget: 2800000, spent: 952000, startDate: '2025-09-15', endDate: '2026-12-20', manager: 'Sarah Mitchell', location: 'Manchester, M1', type: 'Residential', phase: 'Foundation', workers: 28, contractValue: 2950000 },
  { id: 'p3', name: 'Birmingham Road Bridge', client: 'West Midlands Council', status: 'active', progress: 89, budget: 1600000, spent: 1424000, startDate: '2025-03-01', endDate: '2026-03-30', manager: 'Tom Bradley', location: 'Birmingham, B1', type: 'Civil', phase: 'Finishing', workers: 18, contractValue: 1650000 },
  { id: 'p4', name: 'Leeds Warehouse Extension', client: 'Nordic Logistics UK', status: 'on_hold', progress: 22, budget: 890000, spent: 195800, startDate: '2025-11-01', endDate: '2026-07-15', manager: 'Adrian Stanca', location: 'Leeds, LS1', type: 'Industrial', phase: 'Design', workers: 0, contractValue: 925000 },
  { id: 'p5', name: 'Bristol Retail Park Fit-Out', client: 'Solaris Retail Group', status: 'completed', progress: 100, budget: 650000, spent: 618000, startDate: '2025-01-10', endDate: '2025-11-30', manager: 'Claire Watson', location: 'Bristol, BS1', type: 'Fit-Out', phase: 'Handover', workers: 0, contractValue: 685000 },
  { id: 'p6', name: 'Sheffield Hospital Refurb', client: 'NHS South Yorkshire', status: 'planning', progress: 5, budget: 3100000, spent: 46500, startDate: '2026-04-01', endDate: '2027-09-30', manager: 'James Harrington', location: 'Sheffield, S1', type: 'Healthcare', phase: 'Tender', workers: 2, contractValue: 3250000 },
];

// ─── INVOICES ────────────────────────────────────────────────────────────────
export const invoices: Invoice[] = [
  // Current month
  { id: 'inv1',  number: 'INV-2026-0142', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 185000, vat: 37000,  cisDeduction: 27750, status: 'sent',     issueDate: '2026-03-01', dueDate: '2026-03-31', description: 'Structural steelwork — Phase 3' },
  { id: 'inv2',  number: 'INV-2026-0141', client: 'Northern Living Ltd',    project: 'Manchester City Apartments',     amount:  94500, vat: 18900,  cisDeduction: 14175, status: 'paid',     issueDate: '2026-02-15', dueDate: '2026-03-15', description: 'Foundation works — Block A' },
  { id: 'inv3',  number: 'INV-2026-0140', client: 'West Midlands Council',  project: 'Birmingham Road Bridge',         amount:  67200, vat:     0,  cisDeduction: 10080, status: 'overdue',  issueDate: '2026-01-31', dueDate: '2026-03-01', description: 'Concrete works — Span 3' },
  { id: 'inv4',  number: 'INV-2026-0143', client: 'NHS South Yorkshire',    project: 'Sheffield Hospital Refurb',      amount:  46500, vat:     0,  cisDeduction:     0, status: 'draft',    issueDate: '2026-03-15', dueDate: '2026-04-14', description: 'Pre-construction surveys & design fees' },
  { id: 'inv5',  number: 'INV-2026-0144', client: 'Nordic Logistics UK',    project: 'Leeds Warehouse Extension',      amount: 195800, vat: 39160,  cisDeduction: 29370, status: 'disputed', issueDate: '2026-02-28', dueDate: '2026-03-28', description: 'Groundworks & drainage — Package 1' },
  // February
  { id: 'inv6',  number: 'INV-2026-0138', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 210000, vat: 42000,  cisDeduction: 31500, status: 'paid',     issueDate: '2026-02-01', dueDate: '2026-02-28', description: 'Concrete frame — Floors 5-7' },
  { id: 'inv7',  number: 'INV-2026-0139', client: 'West Midlands Council',  project: 'Birmingham Road Bridge',         amount: 145000, vat:     0,  cisDeduction: 21750, status: 'paid',     issueDate: '2026-02-10', dueDate: '2026-03-10', description: 'Deck formwork & reinforcement' },
  { id: 'inv8',  number: 'INV-2026-0137', client: 'Northern Living Ltd',    project: 'Manchester City Apartments',     amount:  78000, vat: 15600,  cisDeduction: 11700, status: 'paid',     issueDate: '2026-02-05', dueDate: '2026-03-07', description: 'CFA piling works — complete' },
  // January
  { id: 'inv9',  number: 'INV-2026-0135', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 245000, vat: 49000,  cisDeduction: 36750, status: 'paid',     issueDate: '2026-01-10', dueDate: '2026-02-09', description: 'Structural steelwork — Phase 2' },
  { id: 'inv10', number: 'INV-2026-0136', client: 'Solaris Retail Group',   project: 'Bristol Retail Park Fit-Out',    amount:  95000, vat: 19000,  cisDeduction:  9500, status: 'paid',     issueDate: '2026-01-15', dueDate: '2026-02-14', description: 'Final account — retail fit-out' },
  { id: 'inv11', number: 'INV-2026-0134', client: 'West Midlands Council',  project: 'Birmingham Road Bridge',         amount: 125000, vat:     0,  cisDeduction: 18750, status: 'paid',     issueDate: '2026-01-08', dueDate: '2026-02-07', description: 'Abutment construction — both ends' },
  // December 2025
  { id: 'inv12', number: 'INV-2025-0131', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 180000, vat: 36000,  cisDeduction: 27000, status: 'paid',     issueDate: '2025-12-05', dueDate: '2026-01-04', description: 'Structural steelwork — Phase 1' },
  { id: 'inv13', number: 'INV-2025-0132', client: 'Solaris Retail Group',   project: 'Bristol Retail Park Fit-Out',    amount:  88000, vat: 17600,  cisDeduction:  8800, status: 'paid',     issueDate: '2025-12-10', dueDate: '2026-01-09', description: 'M&E first fix' },
  // November 2025
  { id: 'inv14', number: 'INV-2025-0128', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 165000, vat: 33000,  cisDeduction: 24750, status: 'paid',     issueDate: '2025-11-03', dueDate: '2025-12-03', description: 'Groundworks complete — piling' },
  { id: 'inv15', number: 'INV-2025-0129', client: 'Solaris Retail Group',   project: 'Bristol Retail Park Fit-Out',    amount: 142000, vat: 28400,  cisDeduction: 14200, status: 'paid',     issueDate: '2025-11-15', dueDate: '2025-12-15', description: 'Fit-out — Shells A & B complete' },
  // October 2025
  { id: 'inv16', number: 'INV-2025-0125', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 198000, vat: 39600,  cisDeduction: 29700, status: 'paid',     issueDate: '2025-10-07', dueDate: '2025-11-06', description: 'Basement slab & waterproofing' },
  { id: 'inv17', number: 'INV-2025-0126', client: 'Northern Living Ltd',    project: 'Manchester City Apartments',     amount:  88000, vat: 17600,  cisDeduction: 13200, status: 'paid',     issueDate: '2025-10-15', dueDate: '2025-11-14', description: 'Mobilisation & temporary works' },
  { id: 'inv18', number: 'INV-2025-0127', client: 'Solaris Retail Group',   project: 'Bristol Retail Park Fit-Out',    amount: 148000, vat: 29600,  cisDeduction: 14800, status: 'paid',     issueDate: '2025-10-20', dueDate: '2025-11-19', description: 'Steel frame & roofing' },
  // September 2025
  { id: 'inv19', number: 'INV-2025-0120', client: 'Solaris Retail Group',   project: 'Bristol Retail Park Fit-Out',    amount: 165000, vat: 33000,  cisDeduction: 16500, status: 'paid',     issueDate: '2025-09-05', dueDate: '2025-10-05', description: 'Foundation & slab' },
  { id: 'inv20', number: 'INV-2025-0121', client: 'West Midlands Council',  project: 'Birmingham Road Bridge',         amount: 175000, vat:     0,  cisDeduction: 26250, status: 'paid',     issueDate: '2025-09-12', dueDate: '2025-10-12', description: 'Preliminary works & piling' },
  { id: 'inv21', number: 'INV-2025-0122', client: 'Meridian Properties',    project: 'Canary Wharf Office Complex',    amount: 145000, vat: 29000,  cisDeduction: 21750, status: 'paid',     issueDate: '2025-09-20', dueDate: '2025-10-20', description: 'Demolition & enabling works' },
];

// ─── SAFETY INCIDENTS ────────────────────────────────────────────────────────
export const safetyIncidents: SafetyIncident[] = [
  { id: 's1',  type: 'near-miss',    title: 'Unsecured scaffold board at height',           severity: 'serious', status: 'investigating', project: 'Canary Wharf Office Complex',  reportedBy: 'Mike Turner',       date: '2026-03-18', description: 'Scaffold board found unsecured at Level 7. No injury but potential for fall from height.' },
  { id: 's2',  type: 'incident',     title: 'Minor hand laceration — power tool',           severity: 'minor',   status: 'resolved',      project: 'Manchester City Apartments',   reportedBy: 'Dave Patel',        date: '2026-03-12', description: 'Worker sustained minor cut while operating angle grinder without gloves.' },
  { id: 's3',  type: 'toolbox-talk', title: 'Working at Height — Monthly Safety Brief',     severity: 'minor',   status: 'closed',        project: 'Canary Wharf Office Complex',  reportedBy: 'Sarah Mitchell',    date: '2026-03-10', description: 'Monthly toolbox talk covering WAH regulations, PPE requirements, and scaffold inspection.' },
  { id: 's4',  type: 'mewp-check',   title: 'Daily MEWP Pre-Use Inspection — Cherry Picker',severity: 'minor',   status: 'closed',        project: 'Birmingham Road Bridge',       reportedBy: 'Tom Bradley',       date: '2026-03-20', description: 'Pre-use inspection of JLG 600S boom lift. All checks passed.' },
  { id: 's5',  type: 'hazard',       title: 'Overhead power lines near crane operation',    severity: 'serious', status: 'open',          project: 'Manchester City Apartments',   reportedBy: 'James Harrington',  date: '2026-03-19', description: 'Overhead 11kV power lines identified within crane swing radius. Exclusion zone required.' },
  { id: 's6',  type: 'toolbox-talk', title: 'Manual Handling Awareness — March Brief',      severity: 'minor',   status: 'closed',        project: 'Manchester City Apartments',   reportedBy: 'Lisa Okafor',       date: '2026-03-05', description: 'Monthly manual handling toolbox talk. 28 workers in attendance.' },
  { id: 's7',  type: 'near-miss',    title: 'Reversing dumper — pedestrian in path',        severity: 'serious', status: 'resolved',      project: 'Birmingham Road Bridge',       reportedBy: 'Tom Bradley',       date: '2026-03-03', description: 'Pedestrian entered reversing exclusion zone for TA30 dumper. No contact. Segregation review in progress.' },
  { id: 's8',  type: 'incident',     title: 'Slip on wet concrete — minor ankle strain',    severity: 'minor',   status: 'resolved',      project: 'Canary Wharf Office Complex',  reportedBy: 'Mike Turner',       date: '2026-02-27', description: 'Worker slipped on wet concrete during Level 6 pour. Minor ankle strain, returned to work next day.' },
  { id: 's9',  type: 'toolbox-talk', title: 'Fire Prevention & Hot Works Permit',           severity: 'minor',   status: 'closed',        project: 'Canary Wharf Office Complex',  reportedBy: 'Lisa Okafor',       date: '2026-02-20', description: 'Hot works permit procedure and fire prevention measures. 42 workers attended.' },
  { id: 's10', type: 'hazard',       title: 'Asbestos suspected — ceiling void opening',    severity: 'serious',status: 'investigating', project: 'Sheffield Hospital Refurb',     reportedBy: 'James Harrington',  date: '2026-03-16', description: 'Suspected ACM discovered during intrusive survey of ceiling void on Ward B. Works suspended pending HSE notification and survey.' },
  { id: 's11', type: 'toolbox-talk', title: 'CDM Duties — Principal Contractor Briefing',   severity: 'minor',   status: 'closed',        project: 'Sheffield Hospital Refurb',     reportedBy: 'Lisa Okafor',       date: '2026-03-14', description: 'Pre-construction CDM briefing for Sheffield Hospital project team.' },
  { id: 's12', type: 'near-miss',    title: 'Unsupported excavation face collapse',         severity: 'serious', status: 'resolved',      project: 'Manchester City Apartments',   reportedBy: 'Ryan Chen',         date: '2026-02-14', description: 'Excavation face showed signs of movement. Workers evacuated, shoring installed. No injuries.' },
  { id: 's13', type: 'mewp-check',   title: 'Weekly MEWP Inspection — Boom Lift',           severity: 'minor',   status: 'closed',        project: 'Canary Wharf Office Complex',  reportedBy: 'Mike Turner',       date: '2026-03-17', description: 'Weekly inspection of hired boom lift. Minor hydraulic leak noted — engineer called.' },
  { id: 's14', type: 'toolbox-talk', title: 'PPE Compliance Check — February',              severity: 'minor',   status: 'closed',        project: 'Birmingham Road Bridge',       reportedBy: 'Tom Bradley',       date: '2026-02-10', description: 'Full site PPE audit. 2 workers required new hi-vis. All other checks passed.' },
];

// ─── RFIs ────────────────────────────────────────────────────────────────────
export const rfis: RFI[] = [
  { id: 'r1', number: 'RFI-CW-042', project: 'Canary Wharf Office Complex', subject: 'Structural beam specification clarification', question: 'The drawings show UC 305×305×198 for grid line C4-C5. The structural engineer\'s report references UC 254×254×167. Which takes precedence?', priority: 'high', status: 'open', submittedBy: 'James Harrington', submittedDate: '2026-03-15', dueDate: '2026-03-22', assignedTo: 'Meridian Properties', aiSuggestion: 'Based on loading calculations, the UC 305 specification should take precedence. Recommend requesting formal written confirmation from the structural engineer within 48 hours.' },
  { id: 'r2', number: 'RFI-MC-018', project: 'Manchester City Apartments', subject: 'Waterproofing system — basement level', question: 'Specification calls for Type A tanked waterproofing. Site conditions suggest Type B may be more appropriate given high water table. Client approval required.', priority: 'critical', status: 'pending', submittedBy: 'Sarah Mitchell', submittedDate: '2026-03-14', dueDate: '2026-03-21', assignedTo: 'Northern Living Ltd' },
  { id: 'r3', number: 'RFI-BB-007', project: 'Birmingham Road Bridge', subject: 'Concrete mix design for deck pour', question: 'Requesting approval for C40/50 SRC concrete mix design for bridge deck. Supplier mix design report attached.', priority: 'medium', status: 'answered', submittedBy: 'Tom Bradley', submittedDate: '2026-03-08', dueDate: '2026-03-15', assignedTo: 'West Midlands Council', response: 'Approved. Proceed with C40/50 SRC as specified. Ensure minimum 4 cube samples per pour.' },
  { id: 'r4', number: 'RFI-CW-041', project: 'Canary Wharf Office Complex', subject: 'Lift shaft dimensions — Floor 9 revision', question: 'Revised architectural drawings show lift shaft dimensions changed from 2200×2200 to 2400×2200. This affects surrounding steelwork connections. Seeking structural engineer confirmation.', priority: 'high', status: 'answered', submittedBy: 'James Harrington', submittedDate: '2026-03-05', dueDate: '2026-03-12', assignedTo: 'Meridian Properties', response: 'Confirmed — use revised 2400×2200 dimension. Revised steelwork connections drawing issued Rev D.' },
  { id: 'r5', number: 'RFI-MC-017', project: 'Manchester City Apartments', subject: 'Pile cap reinforcement schedule', question: 'Reinforcement schedule ref RS-MC-004 shows conflicting bar sizes in Grid D pile caps. Please confirm correct bar diameter.', priority: 'medium', status: 'answered', submittedBy: 'Ryan Chen', submittedDate: '2026-03-01', dueDate: '2026-03-08', assignedTo: 'Northern Living Ltd', response: 'Confirmed T25 bars for Grid D pile caps as per structural engineer drawing SE-MC-012 Rev B.' },
  { id: 'r6', number: 'RFI-BB-008', project: 'Birmingham Road Bridge', subject: 'Expansion joint specification', question: 'No expansion joint detail shown on drawings for bridge deck approach slab. Request clarification on joint type and movement range.', priority: 'high', status: 'open', submittedBy: 'Tom Bradley', submittedDate: '2026-03-17', dueDate: '2026-03-24', assignedTo: 'West Midlands Council' },
  { id: 'r7', number: 'RFI-SH-001', project: 'Sheffield Hospital Refurb', subject: 'Asbestos management plan — Ward B', question: 'Following discovery of suspected ACM in Ward B ceiling void, requesting client confirmation of asbestos management plan and licensed contractor appointment.', priority: 'critical', status: 'open', submittedBy: 'James Harrington', submittedDate: '2026-03-17', dueDate: '2026-03-20', assignedTo: 'NHS South Yorkshire' },
  { id: 'r8', number: 'RFI-CW-040', project: 'Canary Wharf Office Complex', subject: 'MEP co-ordination — Floor 12 ceiling void', question: 'Clash detected between sprinkler main and HVAC duct at grid B3-B4 on Floor 12. MEP contractor coordination drawing required.', priority: 'medium', status: 'pending', submittedBy: 'James Harrington', submittedDate: '2026-03-02', dueDate: '2026-03-16', assignedTo: 'Meridian Properties' },
];

// ─── CHANGE ORDERS ───────────────────────────────────────────────────────────
export const changeOrders: ChangeOrder[] = [
  { id: 'co1', number: 'CO-CW-011', project: 'Canary Wharf Office Complex', title: 'Additional fire suppression system — Floor 12', description: 'Client requested additional sprinkler heads on floor 12 to cover new server room layout.', amount: 28500, status: 'approved', submittedDate: '2026-02-20', approvedDate: '2026-03-05', reason: 'Client variation', scheduleImpact: 3 },
  { id: 'co2', number: 'CO-MC-005', project: 'Manchester City Apartments', title: 'Ground conditions — additional piling', description: 'Unforeseen poor ground conditions require 12 additional CFA piles to SE corner.', amount: 67200, status: 'pending', submittedDate: '2026-03-10', reason: 'Unforeseen conditions', scheduleImpact: 8 },
  { id: 'co3', number: 'CO-LS-002', project: 'Leeds Warehouse Extension', title: 'Upgraded cladding specification', description: 'Client requested upgrade from standard steel cladding to insulated composite panels.', amount: 34800, status: 'draft', submittedDate: '2026-03-18', reason: 'Client variation', scheduleImpact: 2 },
  { id: 'co4', number: 'CO-CW-012', project: 'Canary Wharf Office Complex', title: 'Revised atrium glazing — south facade', description: 'Client variation: upgraded atrium glazing from double to triple-glazed units for BREEAM rating.', amount: 54200, status: 'pending', submittedDate: '2026-03-14', reason: 'Client variation', scheduleImpact: 5 },
  { id: 'co5', number: 'CO-BB-003', project: 'Birmingham Road Bridge', title: 'Flood lighting installation', description: 'Council requested addition of LED flood lighting to bridge soffit and approach roads.', amount: 18900, status: 'approved', submittedDate: '2026-02-25', approvedDate: '2026-03-12', reason: 'Client addition', scheduleImpact: 4 },
  { id: 'co6', number: 'CO-SH-001', project: 'Sheffield Hospital Refurb', title: 'Asbestos removal — Ward B', description: 'Emergency asbestos removal works in Ward B ceiling void following discovery during intrusive survey. Licensed contractor engaged.', amount: 42500, status: 'pending', submittedDate: '2026-03-17', reason: 'Unforeseen conditions', scheduleImpact: 14 },
];

// ─── TEAM MEMBERS ────────────────────────────────────────────────────────────
export const teamMembers: TeamMember[] = [
  { id: 't1',  name: 'James Harrington', role: 'Senior Project Manager',  trade: 'Management',  email: 'j.harrington@cortexbuild.co.uk', phone: '07700 900201', status: 'on_site',  cisStatus: 'gross', utrNumber: '1234567890', niNumber: 'AB123456C', projects: ['p1','p6'],         hoursThisWeek: 48, ramsCompleted: true  },
  { id: 't2',  name: 'Sarah Mitchell',   role: 'Project Manager',         trade: 'Management',  email: 's.mitchell@cortexbuild.co.uk',  phone: '07700 900202', status: 'on_site',  cisStatus: 'gross', utrNumber: '2345678901', niNumber: 'CD234567D', projects: ['p2'],              hoursThisWeek: 45, ramsCompleted: true  },
  { id: 't3',  name: 'Mike Turner',      role: 'Site Foreman',            trade: 'General',     email: 'm.turner@cortexbuild.co.uk',    phone: '07700 900203', status: 'on_site',  cisStatus: 'net',   utrNumber: '3456789012', niNumber: 'EF345678E', projects: ['p1'],              hoursThisWeek: 52, ramsCompleted: true  },
  { id: 't4',  name: 'Dave Patel',       role: 'Electrician',             trade: 'Electrical',  email: 'd.patel@cortexbuild.co.uk',     phone: '07700 900204', status: 'on_site',  cisStatus: 'net',   projects: ['p2'],              hoursThisWeek: 44, ramsCompleted: true  },
  { id: 't5',  name: 'Claire Watson',    role: 'QS / Commercial Manager', trade: 'Surveying',   email: 'c.watson@cortexbuild.co.uk',    phone: '07700 900205', status: 'off_site', cisStatus: 'gross', utrNumber: '5678901234', niNumber: 'IJ567890I', projects: ['p1','p2','p3'],    hoursThisWeek: 40, ramsCompleted: true  },
  { id: 't6',  name: 'Tom Bradley',      role: 'Site Engineer',           trade: 'Civil',       email: 't.bradley@cortexbuild.co.uk',   phone: '07700 900206', status: 'on_site',  cisStatus: 'net',   projects: ['p3'],              hoursThisWeek: 50, ramsCompleted: true  },
  { id: 't7',  name: 'Ryan Chen',        role: 'Groundworker',            trade: 'Groundworks', email: 'r.chen@cortexbuild.co.uk',      phone: '07700 900207', status: 'on_site',  cisStatus: 'net',   projects: ['p2'],              hoursThisWeek: 48, ramsCompleted: false },
  { id: 't8',  name: 'Lisa Okafor',      role: 'Safety Officer',          trade: 'HSE',         email: 'l.okafor@cortexbuild.co.uk',    phone: '07700 900208', status: 'on_site',  cisStatus: 'gross', projects: ['p1','p2','p3'],    hoursThisWeek: 40, ramsCompleted: true  },
  { id: 't9',  name: 'Kevin Walsh',      role: 'Carpenter',               trade: 'Joinery',     email: 'k.walsh@cortexbuild.co.uk',     phone: '07700 900209', status: 'on_site',  cisStatus: 'net',   utrNumber: '6789012345', niNumber: 'KL678901K', projects: ['p1'],              hoursThisWeek: 46, ramsCompleted: true  },
  { id: 't10', name: 'Priya Sharma',     role: 'Structural Engineer',     trade: 'Engineering', email: 'p.sharma@cortexbuild.co.uk',    phone: '07700 900210', status: 'off_site', cisStatus: 'gross', utrNumber: '7890123456', niNumber: 'MN789012M', projects: ['p1','p3','p6'],    hoursThisWeek: 38, ramsCompleted: true  },
  { id: 't11', name: 'Gary Henderson',   role: 'Plant Operator',          trade: 'Plant',       email: 'g.henderson@cortexbuild.co.uk', phone: '07700 900211', status: 'on_site',  cisStatus: 'net',   projects: ['p3'],              hoursThisWeek: 44, ramsCompleted: true  },
  { id: 't12', name: 'Amelia Ross',      role: 'Document Controller',     trade: 'Admin',       email: 'a.ross@cortexbuild.co.uk',      phone: '07700 900212', status: 'off_site', cisStatus: 'gross', projects: ['p1','p2','p3','p6'], hoursThisWeek: 40, ramsCompleted: true  },
];

// ─── EQUIPMENT ───────────────────────────────────────────────────────────────
export const equipment: Equipment[] = [
  { id: 'e1', name: 'Liebherr 81 K Tower Crane',         type: 'Crane',               status: 'on_site',    location: 'Canary Wharf',      nextService: '2026-04-15', dailyRate: 1200 },
  { id: 'e2', name: 'Manitowoc 14000 Crawler Crane',     type: 'Crane',               status: 'on_site',    location: 'Manchester',        nextService: '2026-05-01', dailyRate: 1800 },
  { id: 'e3', name: 'JLG 600S Boom Lift',                type: 'MEWP',  registration: 'MW23 ABX', status: 'on_site',    location: 'Birmingham',        nextService: '2026-04-08', dailyRate: 380  },
  { id: 'e4', name: 'Volvo EC300E Excavator',            type: 'Excavator', registration: 'XC72 DEF', status: 'available',  location: 'Depot — Leeds', nextService: '2026-03-28', dailyRate: 650  },
  { id: 'e5', name: 'Terex TA30 Dumper',                 type: 'Dumper', registration: 'YB21 GHI', status: 'maintenance', location: 'Workshop',          nextService: '2026-03-25', dailyRate: 280  },
  { id: 'e6', name: 'Putzmeister BSF 36 Concrete Pump',  type: 'Concrete Equipment',  status: 'hired_out',  location: 'Bristol',           nextService: '2026-06-01', dailyRate: 950  },
  { id: 'e7', name: 'Caterpillar 320 Excavator',         type: 'Excavator', registration: 'CA24 JKL', status: 'on_site',    location: 'Manchester',        nextService: '2026-04-20', dailyRate: 700  },
  { id: 'e8', name: 'Genie S-65 Scissor Lift',           type: 'MEWP',  registration: 'GS23 MNO', status: 'on_site',    location: 'Canary Wharf',      nextService: '2026-05-10', dailyRate: 220  },
  { id: 'e9', name: 'Wacker Neuson VP1550 Plate Compactor', type: 'Compaction Equipment', status: 'available', location: 'Depot — Leeds', nextService: '2026-04-01', dailyRate: 85  },
];

// ─── SUBCONTRACTORS ──────────────────────────────────────────────────────────
export const subcontractors: Subcontractor[] = [
  { id: 'sc1', company: 'Apex Electrical Ltd',      trade: 'Electrical',      contact: 'Phil Archer',    email: 'phil@apexelectrical.co.uk',    phone: '0161 900 1234', status: 'active',  cisVerified: true,  insuranceExpiry: '2026-12-31', ramsApproved: true,  currentProject: 'Canary Wharf Office Complex',  contractValue: 385000, rating: 4.8 },
  { id: 'sc2', company: 'Northern Groundworks Ltd', trade: 'Groundworks',     contact: 'Steve Mason',    email: 'steve@northerngw.co.uk',        phone: '0113 900 5678', status: 'active',  cisVerified: true,  insuranceExpiry: '2026-09-30', ramsApproved: true,  currentProject: 'Manchester City Apartments',   contractValue: 210000, rating: 4.5 },
  { id: 'sc3', company: 'Swift Plumbing Services',  trade: 'Plumbing & HVAC', contact: 'Karen Woods',    email: 'karen@swiftplumbing.co.uk',     phone: '0121 900 9012', status: 'active',  cisVerified: false, insuranceExpiry: '2026-06-15', ramsApproved: false, currentProject: 'Birmingham Road Bridge',        contractValue:  45000, rating: 3.9 },
  { id: 'sc4', company: 'StoneWall Masonry',        trade: 'Masonry',         contact: 'John Briggs',    email: 'john@stonewall.co.uk',          phone: '0114 900 3456', status: 'pending', cisVerified: true,  insuranceExpiry: '2027-01-31', ramsApproved: false, contractValue:     0, rating: 4.2 },
  { id: 'sc5', company: 'Redline Scaffolding Ltd',  trade: 'Scaffolding',     contact: 'Gary Potts',     email: 'gary@redlinescaff.co.uk',       phone: '020 7900 4444', status: 'active',  cisVerified: true,  insuranceExpiry: '2026-11-30', ramsApproved: true,  currentProject: 'Canary Wharf Office Complex',  contractValue: 128000, rating: 4.7 },
  { id: 'sc6', company: 'Haddon Asbestos Solutions',trade: 'Asbestos Removal', contact: 'Dawn Haddon',    email: 'd.haddon@haddonasbestos.co.uk', phone: '0114 900 7890', status: 'active',  cisVerified: true,  insuranceExpiry: '2027-03-31', ramsApproved: true,  currentProject: 'Sheffield Hospital Refurb',     contractValue:  42500, rating: 4.9 },
];

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documents: Document[] = [
  { id: 'd1',  name: 'Structural Drawings — Rev C',          type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'James Harrington', uploadedDate: '2026-03-10', version: 'Rev C',  size: '18.4 MB', status: 'current',  category: 'DRAWINGS'   },
  { id: 'd2',  name: 'RAMS — Structural Steelwork',          type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'Lisa Okafor',      uploadedDate: '2026-02-28', version: '2.1',    size:  '4.2 MB', status: 'current',  category: 'RAMS'       },
  { id: 'd3',  name: 'Main Contract — Signed',               type: 'PDF', project: 'Manchester City Apartments',  uploadedBy: 'Adrian Stanca',    uploadedDate: '2025-09-12', version: '1.0',    size:  '2.8 MB', status: 'current',  category: 'CONTRACTS'  },
  { id: 'd4',  name: 'Ground Investigation Report',          type: 'PDF', project: 'Manchester City Apartments',  uploadedBy: 'Sarah Mitchell',   uploadedDate: '2025-08-20', version: '1.0',    size: '12.6 MB', status: 'current',  category: 'REPORTS'    },
  { id: 'd5',  name: 'Building Regulations Approval',        type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'Claire Watson',    uploadedDate: '2025-05-15', version: '1.0',    size:  '1.1 MB', status: 'current',  category: 'PERMITS'    },
  { id: 'd6',  name: 'RAMS — Excavation & Groundworks',      type: 'PDF', project: 'Manchester City Apartments',  uploadedBy: 'Lisa Okafor',      uploadedDate: '2025-10-04', version: '1.2',    size:  '3.8 MB', status: 'current',  category: 'RAMS'       },
  { id: 'd7',  name: 'Structural Engineer Report — Bridge',  type: 'PDF', project: 'Birmingham Road Bridge',       uploadedBy: 'Priya Sharma',     uploadedDate: '2025-04-12', version: '1.0',    size:  '9.1 MB', status: 'current',  category: 'REPORTS'    },
  { id: 'd8',  name: 'NHS Contract Agreement — Signed',      type: 'PDF', project: 'Sheffield Hospital Refurb',    uploadedBy: 'Adrian Stanca',    uploadedDate: '2026-03-01', version: '1.0',    size:  '4.5 MB', status: 'current',  category: 'CONTRACTS'  },
  { id: 'd9',  name: 'Construction Phase Plan — CW',         type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'Lisa Okafor',      uploadedDate: '2025-05-25', version: '3.0',    size:  '7.2 MB', status: 'current',  category: 'REPORTS' },
  { id: 'd10', name: 'Drainage Design Drawings — Rev B',     type: 'PDF', project: 'Leeds Warehouse Extension',    uploadedBy: 'Priya Sharma',     uploadedDate: '2025-12-01', version: 'Rev B',  size:  '6.8 MB', status: 'superseded', category: 'DRAWINGS'  },
  { id: 'd11', name: 'Programme — Master Gantt Chart',       type: 'XLSX',project: 'Canary Wharf Office Complex', uploadedBy: 'James Harrington', uploadedDate: '2026-03-01', version: 'Rev 4',  size:  '2.1 MB', status: 'current',  category: 'PLANS'  },
  { id: 'd12', name: 'RAMS — Working at Height',             type: 'PDF', project: 'Birmingham Road Bridge',       uploadedBy: 'Lisa Okafor',      uploadedDate: '2025-03-15', version: '1.1',    size:  '3.2 MB', status: 'current',  category: 'RAMS'       },
  { id: 'd13', name: 'O&M Manual — Bristol Retail',          type: 'PDF', project: 'Bristol Retail Park Fit-Out', uploadedBy: 'Claire Watson',    uploadedDate: '2025-11-28', version: '1.0',    size: '22.4 MB', status: 'current',  category: 'REPORTS'    },
];

// ─── TIMESHEETS ──────────────────────────────────────────────────────────────
export const timesheets: Timesheet[] = [
  // Week 11 (current week)
  { id: 'ts1',  worker: 'Mike Turner',      project: 'Canary Wharf Office Complex', week: '2026-W11', regularHours: 40, overtimeHours: 10, dayworkHours: 2,  totalPay: 1248, status: 'approved',  cisDeduction: 187.20 },
  { id: 'ts2',  worker: 'Dave Patel',       project: 'Manchester City Apartments',  week: '2026-W11', regularHours: 40, overtimeHours:  4, dayworkHours: 0,  totalPay: 1056, status: 'submitted', cisDeduction: 158.40 },
  { id: 'ts3',  worker: 'Ryan Chen',        project: 'Manchester City Apartments',  week: '2026-W11', regularHours: 40, overtimeHours:  8, dayworkHours: 0,  totalPay: 1008, status: 'draft',     cisDeduction: 151.20 },
  { id: 'ts4',  worker: 'Tom Bradley',      project: 'Birmingham Road Bridge',      week: '2026-W11', regularHours: 40, overtimeHours: 10, dayworkHours: 0,  totalPay: 1250, status: 'approved',  cisDeduction: 187.50 },
  { id: 'ts5',  worker: 'Kevin Walsh',      project: 'Canary Wharf Office Complex', week: '2026-W11', regularHours: 40, overtimeHours:  6, dayworkHours: 0,  totalPay: 1104, status: 'submitted', cisDeduction: 165.60 },
  { id: 'ts6',  worker: 'Gary Henderson',   project: 'Birmingham Road Bridge',      week: '2026-W11', regularHours: 40, overtimeHours:  4, dayworkHours: 4,  totalPay:  984, status: 'submitted', cisDeduction: 147.60 },
  // Week 10
  { id: 'ts7',  worker: 'Mike Turner',      project: 'Canary Wharf Office Complex', week: '2026-W10', regularHours: 40, overtimeHours:  8, dayworkHours: 0,  totalPay: 1152, status: 'approved',  cisDeduction: 172.80 },
  { id: 'ts8',  worker: 'Dave Patel',       project: 'Manchester City Apartments',  week: '2026-W10', regularHours: 40, overtimeHours:  4, dayworkHours: 0,  totalPay: 1056, status: 'approved',  cisDeduction: 158.40 },
  { id: 'ts9',  worker: 'Ryan Chen',        project: 'Manchester City Apartments',  week: '2026-W10', regularHours: 40, overtimeHours:  6, dayworkHours: 0,  totalPay:  960, status: 'approved',  cisDeduction: 144.00 },
  { id: 'ts10', worker: 'Tom Bradley',      project: 'Birmingham Road Bridge',      week: '2026-W10', regularHours: 40, overtimeHours: 10, dayworkHours: 0,  totalPay: 1250, status: 'approved',  cisDeduction: 187.50 },
  { id: 'ts11', worker: 'Kevin Walsh',      project: 'Canary Wharf Office Complex', week: '2026-W10', regularHours: 40, overtimeHours:  4, dayworkHours: 0,  totalPay: 1056, status: 'approved',  cisDeduction: 158.40 },
  { id: 'ts12', worker: 'Gary Henderson',   project: 'Birmingham Road Bridge',      week: '2026-W10', regularHours: 40, overtimeHours:  8, dayworkHours: 0,  totalPay: 1104, status: 'approved',  cisDeduction: 165.60 },
  // Week 9
  { id: 'ts13', worker: 'Mike Turner',      project: 'Canary Wharf Office Complex', week: '2026-W09', regularHours: 40, overtimeHours:  4, dayworkHours: 0,  totalPay: 1008, status: 'approved',  cisDeduction: 151.20 },
  { id: 'ts14', worker: 'Tom Bradley',      project: 'Birmingham Road Bridge',      week: '2026-W09', regularHours: 40, overtimeHours:  8, dayworkHours: 0,  totalPay: 1152, status: 'approved',  cisDeduction: 172.80 },
  { id: 'ts15', worker: 'Ryan Chen',        project: 'Manchester City Apartments',  week: '2026-W09', regularHours: 40, overtimeHours:  4, dayworkHours: 0,  totalPay:  864, status: 'approved',  cisDeduction: 129.60 },
];

// ─── MEETINGS ────────────────────────────────────────────────────────────────
export const meetings: Meeting[] = [
  { id: 'm1', title: 'Progress Meeting — Canary Wharf',         project: 'Canary Wharf Office Complex', date: '2026-03-25', time: '09:00', location: 'Site Office',    attendees: ['James Harrington', 'Claire Watson', 'Meridian Properties PM'],            agenda: ['Programme review', 'RFI status', 'Change orders', 'Safety report', 'AOB'],                    actionItems: [{ task: 'Resolve RFI-CW-042', owner: 'James Harrington', due: '2026-03-22', status: 'open' }, { task: 'Submit CO-CW-012', owner: 'Claire Watson', due: '2026-03-26', status: 'open' }] },
  { id: 'm2', title: 'Design Team Meeting — Sheffield Hospital', project: 'Sheffield Hospital Refurb',    date: '2026-03-28', time: '14:00', location: 'Video Call',     attendees: ['Adrian Stanca', 'NHS PM', 'Architect', 'Structural Engineer'],            agenda: ['Design review', 'Asbestos management', 'Tender strategy', 'Risk register'],                  actionItems: [{ task: 'Appoint licensed asbestos contractor', owner: 'Adrian Stanca', due: '2026-03-21', status: 'open' }] },
  { id: 'm3', title: 'Weekly Site Meeting — Manchester',         project: 'Manchester City Apartments',   date: '2026-03-24', time: '08:00', location: 'Site Office',    attendees: ['Sarah Mitchell', 'Ryan Chen', 'Dave Patel', 'Northern Groundworks PM'],   agenda: ['Safety observations', 'Weekly progress', 'Deliveries', 'Workforce'],                         actionItems: [{ task: 'Resolve overhead power line hazard', owner: 'Sarah Mitchell', due: '2026-03-20', status: 'open' }] },
  { id: 'm4', title: 'Handover Meeting — Birmingham Bridge',     project: 'Birmingham Road Bridge',       date: '2026-03-31', time: '10:00', location: 'Council Offices',attendees: ['Tom Bradley', 'WM Council PM', 'WM Council Inspector', 'Priya Sharma'],   agenda: ['Final inspection walkthrough', 'Snagging list sign-off', 'Certificate handover', 'O&M manuals'], actionItems: [] },
  { id: 'm5', title: 'Monthly Board Review',                     project: 'All Projects',                 date: '2026-03-31', time: '15:00', location: 'Head Office',     attendees: ['Adrian Stanca', 'Claire Watson', 'James Harrington', 'Sarah Mitchell'],   agenda: ['P&L review', 'Project updates', 'Pipeline review', 'Resource planning'],                     actionItems: [] },
  { id: 'm6', title: 'Procurement Review — Manchester',          project: 'Manchester City Apartments',   date: '2026-03-22', time: '13:00', location: 'Video Call',     attendees: ['Claire Watson', 'Sarah Mitchell', 'CEMEX UK rep'],                       agenda: ['Concrete schedule confirmation', 'Membrane delivery ETA', 'Price escalation'],               actionItems: [{ task: 'Confirm CFA concrete delivery schedule', owner: 'Claire Watson', due: '2026-03-23', status: 'open' }] },
];

// ─── MATERIALS ───────────────────────────────────────────────────────────────
export const materials: Material[] = [
  { id: 'mat1', name: 'Ready-Mix Concrete C40/50',      category: 'Concrete',          quantity: 480,  unit: 'm³',   unitCost:  145, totalCost:  69600, supplier: 'Hanson UK',       project: 'Birmingham Road Bridge',       status: 'on_site',   deliveryDate: '2026-03-18', poNumber: 'PO-BB-0142' },
  { id: 'mat2', name: 'UC 305×305×198 Steel Section',   category: 'Structural Steel',  quantity:  28,  unit: 'tonne',unitCost: 2100, totalCost:  58800, supplier: 'Tata Steel UK',   project: 'Canary Wharf Office Complex',  status: 'delivered', deliveryDate: '2026-03-12', poNumber: 'PO-CW-0089' },
  { id: 'mat3', name: 'CFA Piling Concrete',            category: 'Concrete',          quantity: 180,  unit: 'm³',   unitCost:  138, totalCost:  24840, supplier: 'CEMEX UK',        project: 'Manchester City Apartments',   status: 'ordered',   deliveryDate: '2026-03-27', poNumber: 'PO-MC-0067' },
  { id: 'mat4', name: 'Waterproof Membrane Type B',     category: 'Waterproofing',     quantity: 1200, unit: 'm²',   unitCost:   28, totalCost:  33600, supplier: 'Sika Ltd',        project: 'Manchester City Apartments',   status: 'ordered',   deliveryDate: '2026-04-02', poNumber: 'PO-MC-0068' },
  { id: 'mat5', name: 'T25 Reinforcement Bar',          category: 'Reinforcement',     quantity: 14.5, unit: 'tonne',unitCost: 1480, totalCost:  21460, supplier: 'BRC Group',       project: 'Manchester City Apartments',   status: 'delivered', deliveryDate: '2026-03-10', poNumber: 'PO-MC-0060' },
  { id: 'mat6', name: 'Portland Cement 52.5N',          category: 'Concrete',          quantity:  50,  unit: 'tonne',unitCost:  255, totalCost:  12750, supplier: 'Lafarge Cement',  project: 'Birmingham Road Bridge',       status: 'delivered', deliveryDate: '2026-02-28', poNumber: 'PO-BB-0143' },
  { id: 'mat7', name: 'Insulated Composite Cladding',   category: 'Cladding',          quantity:  850, unit: 'm²',   unitCost:  103, totalCost:  87500, supplier: 'Kingspan Group',  project: 'Leeds Warehouse Extension',    status: 'ordered',   deliveryDate: '2026-05-01', poNumber: 'PO-LS-0051' },
];

// ─── PUNCH LIST ───────────────────────────────────────────────────────────────
export const punchListItems: PunchListItem[] = [
  { id: 'pl1', project: 'Bristol Retail Park Fit-Out', location: 'Unit A — Entrance',     description: 'Skirting board not mitred correctly at corner joint', assignedTo: 'Joinery subcontractor', priority: 'low',    status: 'completed',  dueDate: '2026-03-20', photos: 2, trade: 'Joinery'   },
  { id: 'pl2', project: 'Bristol Retail Park Fit-Out', location: 'Unit B — Toilet Block', description: 'Silicone bead missing around basin',                  assignedTo: 'Swift Plumbing',        priority: 'medium', status: 'in_progress',dueDate: '2026-03-22', photos: 1, trade: 'Plumbing'  },
  { id: 'pl3', project: 'Canary Wharf Office Complex', location: 'Floor 4 — Meeting Rooms',description:'Plasterboard joint visible — requires re-skim and paint', assignedTo: 'Plasterer',           priority: 'medium', status: 'open',       dueDate: '2026-04-10', photos: 3, trade: 'Plastering'},
  { id: 'pl4', project: 'Birmingham Road Bridge',      location: 'North Abutment',        description: 'Joint sealant not continuous — gaps visible at expansion joint', assignedTo: 'Tom Bradley', priority: 'high',   status: 'open',       dueDate: '2026-03-28', photos: 4, trade: 'Civil'     },
  { id: 'pl5', project: 'Canary Wharf Office Complex', location: 'Floor 7 — Core',        description: 'Fire stop missing around pipe penetration — critical', assignedTo: 'Passive Fire Sub',    priority: 'critical',status: 'open',       dueDate: '2026-03-25', photos: 2, trade: 'Fire Stop' },
];

// ─── INSPECTIONS ─────────────────────────────────────────────────────────────
export const inspections: Inspection[] = [
  { id: 'ins1', type: 'Scaffold Inspection',         project: 'Canary Wharf Office Complex', inspector: 'Lisa Okafor', date: '2026-03-20', status: 'passed',    score: 94,  items: [{ check: 'Base plates secured', result: 'pass' }, { check: 'Handrails at all levels', result: 'pass' }, { check: 'Boards fully boarded', result: 'pass' }, { check: 'Ladder access secured', result: 'pass' }], nextInspection: '2026-04-03' },
  { id: 'ins2', type: 'Concrete Pour Inspection',    project: 'Birmingham Road Bridge',       inspector: 'Tom Bradley', date: '2026-03-18', status: 'passed',    score: 100, items: [{ check: 'Mix design approved', result: 'pass' }, { check: 'Formwork checked', result: 'pass' }, { check: 'Cube samples taken', result: 'pass' }] },
  { id: 'ins3', type: 'Fire Safety Inspection',      project: 'Manchester City Apartments',   inspector: 'Lisa Okafor', date: '2026-04-01', status: 'scheduled', items: [] },
  { id: 'ins4', type: 'MEWP Thorough Examination',   project: 'Canary Wharf Office Complex', inspector: 'Mike Turner', date: '2026-03-17', status: 'passed',    score: 88,  items: [{ check: 'Hydraulic system', result: 'fail' }, { check: 'Cage integrity', result: 'pass' }, { check: 'Outriggers', result: 'pass' }, { check: 'Emergency lowering', result: 'pass' }] },
  { id: 'ins5', type: 'Excavation Support Check',    project: 'Manchester City Apartments',   inspector: 'Sarah Mitchell', date: '2026-03-15', status: 'passed',  score: 96,  items: [{ check: 'Shoring in place', result: 'pass' }, { check: 'Exclusion zone marked', result: 'pass' }, { check: 'Monitoring pegs installed', result: 'pass' }] },
  { id: 'ins6', type: 'Pre-Pour Inspection — Deck',  project: 'Birmingham Road Bridge',       inspector: 'Priya Sharma', date: '2026-03-05', status: 'passed',   score: 98,  items: [{ check: 'Reinforcement correct', result: 'pass' }, { check: 'Formwork sealed', result: 'pass' }, { check: 'Concrete pump positioned', result: 'pass' }] },
  { id: 'ins7', type: 'Asbestos Visual Inspection',  project: 'Sheffield Hospital Refurb',    inspector: 'James Harrington', date: '2026-03-16', status: 'failed', score: 0,   items: [{ check: 'Ceiling void ACM check', result: 'fail' }] },
];

// ─── RAMS DOCUMENTS ──────────────────────────────────────────────────────────
export const ramsDocuments: RAMSDocument[] = [
  { id: 'rams1', title: 'RAMS — Structural Steelwork Installation', project: 'Canary Wharf Office Complex', activity: 'Steel Frame Erection', version: '2.1', status: 'approved', createdBy: 'Lisa Okafor', approvedBy: 'James Harrington', reviewDate: '2026-06-01',
    hazards: [{ hazard: 'Falls from height', risk: 'High', control: 'Full harness, anchor points, exclusion zones', residualRisk: 'Low' }, { hazard: 'Falling objects', risk: 'High', control: 'Safety nets, exclusion zones, hard hats mandatory', residualRisk: 'Low' }, { hazard: 'Crane operations', risk: 'Medium', control: 'Lift plan, banksmen, exclusion zones', residualRisk: 'Low' }],
    methodStatement: ['Erect tower crane per lift plan', 'Establish exclusion zones', 'Check steelwork for damage before lift', 'Use tag lines to control loads', 'Bolt connections per structural engineer spec', 'Final inspection before removing crane slings'],
    ppe: ['Hard hat', 'Hi-vis vest', 'Safety harness', 'Steel toe-capped boots', 'Gloves', 'Safety glasses'], signatures: 8, required: 10 },
  { id: 'rams2', title: 'RAMS — Excavation & Groundworks', project: 'Manchester City Apartments', activity: 'CFA Piling & Excavation', version: '1.2', status: 'approved', createdBy: 'Lisa Okafor', approvedBy: 'Sarah Mitchell', reviewDate: '2026-05-15',
    hazards: [{ hazard: 'Collapse of excavation', risk: 'High', control: 'Shoring system installed, daily inspections, exclusion zone', residualRisk: 'Low' }, { hazard: 'Overhead services', risk: 'Medium', control: 'Service drawings reviewed, hand-dig within 500mm', residualRisk: 'Low' }, { hazard: 'Ground contamination', risk: 'Medium', control: 'Phase 2 survey completed, welfare facilities provided', residualRisk: 'Low' }],
    methodStatement: ['Mark up service drawings and identify exclusion zones', 'Erect hoarding and site security', 'Commence CFA piling per sequence drawing', 'Excavate to formation level with shoring', 'Install drainage and blinding'],
    ppe: ['Hard hat', 'Hi-vis', 'Steel toe-capped boots', 'Gloves', 'High-cut safety boots'], signatures: 6, required: 8 },
  { id: 'rams3', title: 'RAMS — Working at Height — Bridge Deck', project: 'Birmingham Road Bridge', activity: 'Bridge Deck Formwork & Concrete Pour', version: '1.1', status: 'approved', createdBy: 'Tom Bradley', approvedBy: 'Priya Sharma', reviewDate: '2026-04-01',
    hazards: [{ hazard: 'Falls from bridge deck', risk: 'High', control: 'Perimeter edge protection, safety harnesses on temporary works', residualRisk: 'Low' }, { hazard: 'Concrete pump failure', risk: 'Medium', control: 'Pre-use inspection, operator CPCS certified', residualRisk: 'Low' }],
    methodStatement: ['Install formwork and edge protection', 'Place reinforcement per bending schedule', 'Pre-pour inspection by engineer', 'Pump concrete in lifts, vibrate thoroughly', 'Cure with membrane — minimum 7 days'],
    ppe: ['Hard hat', 'Hi-vis', 'Safety harness', 'Rubber boots for concreting'], signatures: 5, required: 6 },
  { id: 'rams4', title: 'RAMS — Demolition & Strip-Out', project: 'Sheffield Hospital Refurb', activity: 'Soft-Strip Demolition — Ward Floors', version: '1.0', status: 'review', createdBy: 'James Harrington', approvedBy: '', reviewDate: '2026-04-01',
    hazards: [{ hazard: 'Asbestos containing materials', risk: 'Critical', control: 'Licensed asbestos contractor appointed, works segregated, notifiable to HSE', residualRisk: 'Medium' }, { hazard: 'Structural instability', risk: 'High', control: 'Structural engineer signed off sequence, propping installed', residualRisk: 'Low' }],
    methodStatement: ['Complete asbestos survey and commission licensed removal', 'Obtain HSE notification reference', 'Commence soft-strip after ACM clearance certificate', 'Structural propping per engineer scheme', 'Segregate waste streams for disposal'],
    ppe: ['Hard hat', 'Hi-vis', 'FFP3 mask', 'Full-body coverall', 'Safety glasses', 'Safety footwear'], signatures: 2, required: 8 },
  { id: 'rams5', title: 'RAMS — Concrete Frame — Canary Wharf', project: 'Canary Wharf Office Complex', activity: 'In-Situ Concrete Frame — Floors 8-12', version: '3.0', status: 'approved', createdBy: 'Lisa Okafor', approvedBy: 'James Harrington', reviewDate: '2026-07-01',
    hazards: [{ hazard: 'Formwork & falsework collapse', risk: 'High', control: 'Engineer-designed falsework, daily inspections, propped until cube strength achieved', residualRisk: 'Low' }, { hazard: 'Concrete burns / dermatitis', risk: 'Medium', control: 'Waterproof gloves, barrier cream, first aid provision', residualRisk: 'Low' }],
    methodStatement: ['Erect falsework per engineer design', 'Fix reinforcement per bending schedule', 'Pre-pour inspection and sign-off', 'Pump and place concrete — max 450mm lifts', 'Maintain formwork for min 5 days until striking strength'],
    ppe: ['Hard hat', 'Hi-vis', 'Rubber gloves', 'Safety footwear', 'Safety glasses'], signatures: 10, required: 10 },
];

// ─── CIS RETURNS ─────────────────────────────────────────────────────────────
export const cisReturns: CISReturn[] = [
  { id: 'cis1', contractor: 'Apex Electrical Ltd',       utr: '1234567890', period: 'March 2026',    grossPayment: 48500, materialsCost: 12000, labourNet: 36500, cisDeduction: 7300, status: 'pending',   verificationStatus: 'net'        },
  { id: 'cis2', contractor: 'Northern Groundworks Ltd',  utr: '2345678901', period: 'March 2026',    grossPayment: 28000, materialsCost:  8500, labourNet: 19500, cisDeduction: 3900, status: 'pending',   verificationStatus: 'net'        },
  { id: 'cis3', contractor: 'StoneWall Masonry',         utr: '9876543210', period: 'February 2026', grossPayment: 15200, materialsCost:  3200, labourNet: 12000, cisDeduction: 3600, status: 'submitted', verificationStatus: 'unverified' },
  { id: 'cis4', contractor: 'Apex Electrical Ltd',       utr: '1234567890', period: 'February 2026', grossPayment: 52000, materialsCost: 14000, labourNet: 38000, cisDeduction: 7600, status: 'submitted', verificationStatus: 'net'        },
  { id: 'cis5', contractor: 'Northern Groundworks Ltd',  utr: '2345678901', period: 'February 2026', grossPayment: 32000, materialsCost:  9500, labourNet: 22500, cisDeduction: 4500, status: 'submitted', verificationStatus: 'net'        },
  { id: 'cis6', contractor: 'Apex Electrical Ltd',       utr: '1234567890', period: 'January 2026',  grossPayment: 44200, materialsCost: 11000, labourNet: 33200, cisDeduction: 6640, status: 'submitted', verificationStatus: 'net'        },
  { id: 'cis7', contractor: 'Swift Plumbing Services',   utr: '5432109876', period: 'March 2026',    grossPayment:  9800, materialsCost:  2400, labourNet:  7400, cisDeduction: 1480, status: 'pending',   verificationStatus: 'unverified' },
  { id: 'cis8', contractor: 'Redline Scaffolding Ltd',   utr: '6543210987', period: 'March 2026',    grossPayment: 18500, materialsCost:  3000, labourNet: 15500, cisDeduction: 3100, status: 'pending',   verificationStatus: 'net'        },
];

// ─── TENDERS ──────────────────────────────────────────────────────────────────
export const tenders: TenderRequest[] = [
  { id: 'ten1', title: 'Royal Liverpool University Hospital — Ward Refurb',  client: 'NHS Mersey',            value: 2800000, deadline: '2026-04-15', status: 'drafting',    probability: 45, type: 'Healthcare',  location: 'Liverpool',    aiScore: 72, notes: 'Strong NHS track record. Key risk: tight programme.' },
  { id: 'ten2', title: 'Manchester Airport Terminal Extension',               client: 'MAG Group',             value: 8500000, deadline: '2026-05-01', status: 'submitted',   probability: 25, type: 'Transport',   location: 'Manchester',   aiScore: 58, notes: 'Competitive tender. Consider specialist fit-out partner.' },
  { id: 'ten3', title: 'Nottingham City Centre Hotel — New Build',            client: 'Premier Hospitality',  value: 4200000, deadline: '2026-04-30', status: 'shortlisted', probability: 65, type: 'Hospitality', location: 'Nottingham',   aiScore: 81, notes: 'Excellent client relationship. Price competitive.' },
  { id: 'ten4', title: 'Leeds Office Park — Phase 2',                         client: 'Greystone Developments',value:1650000, deadline: '2026-03-28', status: 'won',         probability: 100,type: 'Commercial',  location: 'Leeds',        aiScore: 88, notes: 'Won. Mobilisation starting April 2026.' },
  { id: 'ten5', title: 'Birmingham Leisure Centre Refurbishment',             client: 'Birmingham City Council',value:1900000, deadline: '2026-04-10', status: 'drafting',   probability: 55, type: 'Leisure',     location: 'Birmingham',   aiScore: 74, notes: 'Strong local relationships. Similar project completed 2023.' },
  { id: 'ten6', title: 'London Student Accommodation Block',                  client: 'Apex Student Living',  value: 6200000, deadline: '2026-05-20', status: 'drafting',  probability: 30, type: 'Residential', location: 'London',       aiScore: 62, notes: 'Early stage. Attend pre-market engagement event April 3rd.' },
];

// ─── CONTACTS ────────────────────────────────────────────────────────────────
export const contacts: Contact[] = [
  { id: 'c1',  name: 'Robert Sinclair',    company: 'Meridian Properties',    role: 'Development Director',   email: 'r.sinclair@meridian.co.uk',       phone: '020 7900 1234',  type: 'client',        value: 4350000, lastContact: '2026-03-15', status: 'active', projects: 1 },
  { id: 'c2',  name: 'Amanda Foster',      company: 'Northern Living Ltd',    role: 'Project Director',       email: 'a.foster@northernliving.co.uk',   phone: '0161 900 5678',  type: 'client',        value: 2950000, lastContact: '2026-03-18', status: 'active', projects: 1 },
  { id: 'c3',  name: 'Dr. Helen Shaw',     company: 'NHS South Yorkshire',    role: 'Head of Estates',        email: 'h.shaw@nhs-sy.nhs.uk',            phone: '0114 900 9012',  type: 'client',        value: 3250000, lastContact: '2026-03-10', status: 'active', projects: 1 },
  { id: 'c4',  name: 'Phil Archer',        company: 'Apex Electrical Ltd',    role: 'Director',               email: 'phil@apexelectrical.co.uk',       phone: '0161 900 1234',  type: 'subcontractor', value:  385000, lastContact: '2026-03-12', status: 'active', projects: 2 },
  { id: 'c5',  name: 'Alan Thornton',      company: 'West Midlands Council',  role: 'Senior PM — Highways',  email: 'a.thornton@wmidlands.gov.uk',     phone: '0121 900 4567',  type: 'client',        value: 1650000, lastContact: '2026-03-20', status: 'active', projects: 1 },
  { id: 'c6',  name: 'Diane Osei',         company: 'Nordic Logistics UK',    role: 'Head of Property',       email: 'd.osei@nordiclogistics.co.uk',    phone: '0113 900 7890',  type: 'client',        value:  925000, lastContact: '2026-02-28', status: 'active', projects: 1 },
  { id: 'c7',  name: 'Steve Mason',        company: 'Northern Groundworks',   role: 'Contracts Manager',      email: 'steve@northerngw.co.uk',          phone: '0113 900 5678',  type: 'subcontractor', value:  210000, lastContact: '2026-03-17', status: 'active', projects: 1 },
  { id: 'c8',  name: 'Karen Woods',        company: 'Swift Plumbing Services',role: 'MD',                     email: 'karen@swiftplumbing.co.uk',       phone: '0121 900 9012',  type: 'subcontractor', value:   45000, lastContact: '2026-03-08', status: 'active', projects: 1 },
  { id: 'c9',  name: 'Jane Griffiths',     company: 'Thornton & Wells LLP',   role: 'Construction Partner',   email: 'j.griffiths@thorntonwells.co.uk', phone: '020 7900 8888',  type: 'consultant',    value:       0, lastContact: '2026-03-05', status: 'active', projects: 3 },
  { id: 'c10', name: 'Marco Bellini',      company: 'RIBA Architects Ltd',    role: 'Principal Architect',    email: 'm.bellini@ribaarch.co.uk',        phone: '020 7900 3333',  type: 'consultant',    value:       0, lastContact: '2026-03-12', status: 'active', projects: 2 },
  { id: 'c11', name: 'Gary Potts',         company: 'Redline Scaffolding',    role: 'Contracts Director',     email: 'gary@redlinescaff.co.uk',         phone: '020 7900 4444',  type: 'subcontractor', value:  128000, lastContact: '2026-03-19', status: 'active', projects: 1 },
  { id: 'c12', name: 'Dawn Haddon',        company: 'Haddon Asbestos Solutions',role:'Director',              email: 'd.haddon@haddonasbestos.co.uk',   phone: '0114 900 7890',  type: 'subcontractor', value:   42500, lastContact: '2026-03-17', status: 'active', projects: 1 },
];

// ─── DAILY REPORTS ───────────────────────────────────────────────────────────
export const dailyReports: DailyReport[] = [
  { id: 'dr1',  project: 'Canary Wharf Office Complex', date: '2026-03-20', preparedBy: 'Mike Turner',      weather: 'Partly cloudy', temperature: '12°C', workersOnSite: 42, activities: ['Steel erection — Level 8', 'Concrete pour — Floor 7 slab', 'MEP first fix — Floors 3-4'], materials: ['C35/45 concrete — 120m³', 'M20 bolts — 500 units'], equipment: ['Tower crane operational', 'Concrete pump running', '2× telehandlers'], issues: ['1-hour delay to crane ops due to wind'], photos: 24, progress: 68, aiSummary: 'Concrete pour on Floor 7 completed ahead of schedule. Wind-related crane delay offset by additional MEP workforce. On track for weekly target.' },
  { id: 'dr2',  project: 'Manchester City Apartments',  date: '2026-03-20', preparedBy: 'Ryan Chen',        weather: 'Overcast',      temperature: '9°C',  workersOnSite: 28, activities: ['CFA piling — Grid C complete', 'Excavation — Pile cap formation', 'Reinforcement fixing — Pile cap B3'], materials: ['CFA concrete — 45m³', 'T25 rebar — 2.4t'], equipment: ['Bauer BG 28 piling rig', 'Cat 320 excavator', 'Mobile crane'], issues: ['11kV overhead cable exclusion zone restricting working area'], photos: 18, progress: 34, aiSummary: 'CFA piling on Grid C completed. Overhead cable issue continues to restrict the SW corner of the site. Risk assessment updated.' },
  { id: 'dr3',  project: 'Birmingham Road Bridge',      date: '2026-03-20', preparedBy: 'Tom Bradley',      weather: 'Sunny',         temperature: '11°C', workersOnSite: 18, activities: ['Bridge deck finishing — expansion joint prep', 'Carriageway surfacing — approaches', 'Line markings — north approach'], materials: ['Joint sealant — 200m', 'Tarmac — 48t'], equipment: ['JLG 600S boom lift', 'Road roller', 'Surfacing machine'], issues: [], photos: 12, progress: 89, aiSummary: 'Excellent progress. Deck joint preparation completed. Carriageway surfacing on north approach ahead of programme. On target for handover on 31 March.' },
  { id: 'dr4',  project: 'Canary Wharf Office Complex', date: '2026-03-19', preparedBy: 'Mike Turner',      weather: 'Light rain',    temperature: '10°C', workersOnSite: 38, activities: ['Steel erection — Level 7 complete', 'Concrete floor — Level 6 strikethrough', 'Fire stop installation — Level 5'], materials: ['Structural steelwork — 4 beams delivered'], equipment: ['Tower crane', '2× telehandlers', 'Scissor lift'], issues: ['Wet conditions slowed concrete works', 'Safety: scaffold inspection raised — board replaced immediately'], photos: 15, progress: 67, aiSummary: 'Slightly reduced output due to rain. Level 7 steelwork complete is a programme milestone. Fire stop installation ahead of schedule.' },
  { id: 'dr5',  project: 'Manchester City Apartments',  date: '2026-03-19', preparedBy: 'Sarah Mitchell',   weather: 'Cloudy',        temperature: '8°C',  workersOnSite: 25, activities: ['CFA piling — Grid B (8 of 12 piles complete)', 'Welfare cabin relocation', 'Subcontractor induction — 3 new starters'], materials: ['CFA concrete — 38m³'], equipment: ['Bauer piling rig', 'Cat excavator', 'Generator'], issues: ['3 new workers required CSCS check — all passed'], photos: 10, progress: 33, aiSummary: 'Good piling progress. Grid B 67% complete. New workforce inducted. Overhead cable mitigation plan submitted to client for approval.' },
  { id: 'dr6',  project: 'Canary Wharf Office Complex', date: '2026-03-18', preparedBy: 'Mike Turner',      weather: 'Sunny',         temperature: '13°C', workersOnSite: 44, activities: ['Steel erection — Level 7 (70% complete)', 'MEP second fix — Floors 2-3', 'Glazing installation — Ground floor atrium'], materials: ['Curtain wall glazing — 12 panels', 'MEP cable tray runs'], equipment: ['Tower crane', 'Glazing robot', '3× telehandlers'], issues: [], photos: 22, progress: 66, aiSummary: 'Excellent productive day. Glazing robot working efficiently. MEP second fix ahead of programme. Level 7 steelwork to complete Friday.' },
  { id: 'dr7',  project: 'Sheffield Hospital Refurb',   date: '2026-03-18', preparedBy: 'James Harrington', weather: 'Overcast',      temperature: '7°C',  workersOnSite: 2,  activities: ['Intrusive asbestos survey — Ward B', 'Pre-construction welfare setup'], materials: [], equipment: ['Survey equipment'], issues: ['CRITICAL: Suspected ACM discovered in Ward B ceiling void — works suspended — HSE notification being prepared'], photos: 6, progress: 5, aiSummary: 'ACM discovery requires immediate management. Licensed asbestos contractor Haddon Solutions contacted. HSE notification ref pending. All construction works suspended on Ward B pending clearance.' },
  { id: 'dr8',  project: 'Birmingham Road Bridge',      date: '2026-03-18', preparedBy: 'Tom Bradley',      weather: 'Sunny',         temperature: '10°C', workersOnSite: 20, activities: ['Deck concrete pour — Span 3 complete (480m³)', 'Cube samples taken — 8 sets', 'Edge protection installation'], materials: ['C40/50 SRC concrete — 480m³ poured'], equipment: ['Putzmeister concrete pump', 'Tower crane', 'Boom lift'], issues: [], photos: 28, progress: 88, aiSummary: 'Major milestone: 480m³ deck pour for Span 3 completed successfully. 8 cube sample sets taken. 28-day results expected April 15th.' },
  { id: 'dr9',  project: 'Canary Wharf Office Complex', date: '2026-03-17', preparedBy: 'James Harrington', weather: 'Cloudy',        temperature: '11°C', workersOnSite: 40, activities: ['Weekly safety inspection', 'Level 6 soffit shutter striking', 'Rebar fixing — Level 7 slab'], materials: ['T20/T25 rebar — 8.5t delivered'], equipment: ['Tower crane', 'Reinforcement bender', 'Telehandler'], issues: ['MEWP hydraulic leak noted — engineer booked (non-critical)'], photos: 16, progress: 65, aiSummary: 'Weekly safety inspection completed. Level 6 soffit successfully struck — 28-day cube results confirmed 42.6 N/mm² (above target 40 N/mm²). Rebar for Level 7 progressing well.' },
  { id: 'dr10', project: 'Manchester City Apartments',  date: '2026-03-17', preparedBy: 'Ryan Chen',        weather: 'Light drizzle', temperature: '9°C',  workersOnSite: 22, activities: ['CFA piling — Grid A complete', 'Survey peg installation — pile cap layout', 'Hoardings extended — NE boundary'], materials: ['Piling concrete — 30m³'], equipment: ['Bauer piling rig', 'Survey equipment', 'Forklift'], issues: ['Light drizzle — minimal impact'], photos: 8, progress: 32, aiSummary: 'Grid A piling completed — all 10 piles installed. Surveyor confirmed all piles within tolerance. Good progress toward programme milestone.' },
];

// ─── RISK REGISTER ───────────────────────────────────────────────────────────
export const riskRegister = [
  { id: 'rr1',  title: 'Ground contamination — Manchester site',          project: 'Manchester City Apartments',   category: 'Environmental', likelihood: 3, impact: 4, status: 'open',      owner: 'Sarah Mitchell',   mitigation: 'Phase 2 soil survey commissioned',                     review_date: '2026-04-01' },
  { id: 'rr2',  title: 'Programme delay — steel delivery lead time',      project: 'Canary Wharf Office Complex',  category: 'Commercial',    likelihood: 2, impact: 4, status: 'mitigated', owner: 'James Harrington', mitigation: 'Steel ordered 8 weeks ahead — confirmed delivery',      review_date: '2026-04-15' },
  { id: 'rr3',  title: 'Subcontractor insolvency risk',                   project: 'All Projects',                 category: 'Commercial',    likelihood: 2, impact: 5, status: 'open',      owner: 'Claire Watson',    mitigation: 'Credit checks completed, payment retention held',       review_date: '2026-05-01' },
  { id: 'rr4',  title: 'CDM Principal Contractor compliance',             project: 'Sheffield Hospital Refurb',    category: 'Regulatory',    likelihood: 2, impact: 5, status: 'open',      owner: 'Lisa Okafor',      mitigation: 'Construction Phase Plan to be submitted pre-commencement', review_date: '2026-04-01' },
  { id: 'rr5',  title: 'Asbestos ACM discovery — Sheffield Hospital',     project: 'Sheffield Hospital Refurb',    category: 'Health & Safety',likelihood: 5, impact: 5, status: 'open',     owner: 'James Harrington', mitigation: 'Works suspended, licensed contractor appointed, HSE notified', review_date: '2026-03-25' },
  { id: 'rr6',  title: 'Overhead power lines — Manchester crane ops',     project: 'Manchester City Apartments',   category: 'Health & Safety',likelihood: 3, impact: 5, status: 'open',     owner: 'Sarah Mitchell',   mitigation: 'Exclusion zone established, WM Power notified for temporary isolation', review_date: '2026-03-24' },
  { id: 'rr7',  title: 'Weather delay — bridge deck pour',                project: 'Birmingham Road Bridge',       category: 'Programme',     likelihood: 2, impact: 3, status: 'closed',    owner: 'Tom Bradley',      mitigation: 'Pour completed 18 March — risk closed',                review_date: '2026-03-20' },
  { id: 'rr8',  title: 'Client variation — Sheffield hospital design',    project: 'Sheffield Hospital Refurb',    category: 'Commercial',    likelihood: 4, impact: 3, status: 'open',      owner: 'Claire Watson',    mitigation: 'Change control procedure issued to client, all variations subject to CO', review_date: '2026-04-30' },
  { id: 'rr9',  title: 'Inflation risk — material cost escalation',       project: 'All Projects',                 category: 'Commercial',    likelihood: 3, impact: 4, status: 'open',      owner: 'Claire Watson',    mitigation: 'Fixed-price orders placed for critical materials. Fluctuations clause in contracts', review_date: '2026-06-01' },
  { id: 'rr10', title: 'Key person dependency — J. Harrington',           project: 'Canary Wharf Office Complex',  category: 'Resource',      likelihood: 2, impact: 4, status: 'mitigated', owner: 'Adrian Stanca',    mitigation: 'Deputy PM Sarah Mitchell cross-trained on CW project',  review_date: '2026-06-01' },
  { id: 'rr11', title: 'Late RFI responses — structural beam spec',       project: 'Canary Wharf Office Complex',  category: 'Programme',     likelihood: 3, impact: 3, status: 'open',      owner: 'James Harrington', mitigation: 'Escalated to client director — response due 22 March',  review_date: '2026-03-22' },
  { id: 'rr12', title: 'CIDB compliance — Leeds warehouse planning',      project: 'Leeds Warehouse Extension',    category: 'Regulatory',    likelihood: 2, impact: 3, status: 'open',      owner: 'Adrian Stanca',    mitigation: 'Planning application being reviewed — decision expected April 2026', review_date: '2026-04-30' },
];

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
export const purchaseOrders = [
  { id: 'po1', po_number: 'PO-CW-0089', supplier: 'Tata Steel UK',    description: 'UC 305×305×198 Steel Sections (28t)',           value:  58800, project: 'Canary Wharf Office Complex', status: 'delivered',      order_date: '2026-02-15', delivery_date: '2026-03-12', category: 'Structural Steel', notes: 'Delivered to site — signed off by J. Harrington' },
  { id: 'po2', po_number: 'PO-BB-0142', supplier: 'Hanson UK',        description: 'Ready-Mix Concrete C40/50 (480m³)',              value:  69600, project: 'Birmingham Road Bridge',       status: 'on_site',        order_date: '2026-03-01', delivery_date: '2026-03-18', category: 'Concrete',         notes: 'Ongoing delivery — phased pours' },
  { id: 'po3', po_number: 'PO-MC-0067', supplier: 'CEMEX UK',         description: 'CFA Piling Concrete (180m³)',                    value:  24840, project: 'Manchester City Apartments',   status: 'pending_delivery',order_date: '2026-02-20', delivery_date: '2026-03-27', category: 'Concrete',         notes: '' },
  { id: 'po4', po_number: 'PO-MC-0068', supplier: 'Sika Ltd',         description: 'Waterproof Membrane Type B (1200m²)',            value:  33600, project: 'Manchester City Apartments',   status: 'pending_delivery',order_date: '2026-02-25', delivery_date: '2026-04-02', category: 'Waterproofing',    notes: '' },
  { id: 'po5', po_number: 'PO-CW-0090', supplier: 'Hilti UK',         description: 'Fastening & Anchoring Systems',                  value:  15420, project: 'Canary Wharf Office Complex', status: 'delivered',      order_date: '2026-03-01', delivery_date: '2026-03-10', category: 'Fixings',          notes: '' },
  { id: 'po6', po_number: 'PO-LS-0051', supplier: 'Kingspan Group',   description: 'Insulated Composite Cladding Panels',            value:  87500, project: 'Leeds Warehouse Extension',    status: 'ordered',        order_date: '2026-03-10', delivery_date: '2026-05-01', category: 'Cladding',         notes: 'Long lead item — 8 week lead time' },
  { id: 'po7', po_number: 'PO-BB-0143', supplier: 'Lafarge Cement',   description: 'Portland Cement 52.5N (50t)',                    value:  12750, project: 'Birmingham Road Bridge',       status: 'delivered',      order_date: '2026-01-30', delivery_date: '2026-02-28', category: 'Concrete',         notes: '' },
  { id: 'po8', po_number: 'PO-CW-0091', supplier: 'Bosch Professional',description: 'Power Tools & Equipment',                       value:  24890, project: 'Canary Wharf Office Complex', status: 'pending_delivery',order_date: '2026-03-08', delivery_date: '2026-03-22', category: 'Tools',            notes: '' },
  { id: 'po9', po_number: 'PO-SH-0023', supplier: 'Sto UK',           description: 'External Insulation Composite System',           value: 145000, project: 'Sheffield Hospital Refurb',    status: 'pending_approval',order_date: '2026-03-18', delivery_date: '2026-05-15', category: 'Insulation',       notes: 'Awaiting client approval on spec' },
  { id: 'po10',po_number: 'PO-SH-0024', supplier: 'Haddon Asbestos',  description: 'Licensed Asbestos Removal — Ward B',            value:  42500, project: 'Sheffield Hospital Refurb',    status: 'ordered',        order_date: '2026-03-17', delivery_date: '2026-03-24', category: 'Specialist Works', notes: 'Emergency instruction — CO-SH-001 raised' },
  { id: 'po11',po_number: 'PO-MC-0069', supplier: 'BRC Group',        description: 'Reinforcement Bar T25 (14.5t)',                  value:  21460, project: 'Manchester City Apartments',   status: 'delivered',      order_date: '2026-03-01', delivery_date: '2026-03-10', category: 'Reinforcement',    notes: '' },
  { id: 'po12',po_number: 'PO-CW-0092', supplier: 'Saint-Gobain UK',  description: 'Passive Fire Protection — Intumescent Coatings', value:  38200, project: 'Canary Wharf Office Complex', status: 'pending_delivery',order_date: '2026-03-12', delivery_date: '2026-03-28', category: 'Fire Protection',  notes: 'Required for steel frame — critical path' },
];

// ─── CHART / ANALYTICS DATA ──────────────────────────────────────────────────
export const revenueData = [
  { month: 'Sep', revenue: 485000, costs: 342000, profit: 143000 },
  { month: 'Oct', revenue: 612000, costs: 445000, profit: 167000 },
  { month: 'Nov', revenue: 534000, costs: 378000, profit: 156000 },
  { month: 'Dec', revenue: 298000, costs: 225000, profit:  73000 },
  { month: 'Jan', revenue: 721000, costs: 512000, profit: 209000 },
  { month: 'Feb', revenue: 856000, costs: 601000, profit: 255000 },
  { month: 'Mar', revenue: 943000, costs: 648000, profit: 295000 },
];

export const safetyTrendData = [
  { month: 'Sep', incidents: 3, nearMisses: 8,  toolboxTalks: 12 },
  { month: 'Oct', incidents: 2, nearMisses: 6,  toolboxTalks: 14 },
  { month: 'Nov', incidents: 1, nearMisses: 9,  toolboxTalks: 13 },
  { month: 'Dec', incidents: 0, nearMisses: 5,  toolboxTalks: 10 },
  { month: 'Jan', incidents: 2, nearMisses: 7,  toolboxTalks: 15 },
  { month: 'Feb', incidents: 1, nearMisses: 4,  toolboxTalks: 16 },
  { month: 'Mar', incidents: 2, nearMisses: 5,  toolboxTalks: 12 },
];

export const projectProgressData = projects.filter(p => p.status === 'active').map(p => ({
  name:     p.name.split(' ').slice(0, 2).join(' '),
  progress: p.progress,
  budget:   p.budget,
  spent:    p.spent,
}));

// ─── NAMED ALIASES (API service compatibility) ───────────────────────────────
export const mockProjects       = projects;
export const mockInvoices       = invoices;
export const mockTeamMembers    = teamMembers;
export const mockSafetyIncidents= safetyIncidents;
export const mockRFIs           = rfis;
export const mockChangeOrders   = changeOrders;
export const mockRAMS           = ramsDocuments;
export const mockCISReturns     = cisReturns;
export const mockEquipment      = equipment;
export const mockSubcontractors = subcontractors;
export const mockTimesheets     = timesheets;
export const mockDocuments      = documents;
export const mockTenders        = tenders;
export const mockDailyReports   = dailyReports;
export const mockMeetings       = meetings;
export const mockMaterials      = materials;
export const mockPunchList      = punchListItems;
export const mockInspections    = inspections;
export const mockContacts       = contacts;
export const mockRiskRegister   = riskRegister;
export const mockPurchaseOrders = purchaseOrders;
