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

export const projects: Project[] = [
  { id: 'p1', name: 'Canary Wharf Office Complex', client: 'Meridian Properties', status: 'active', progress: 68, budget: 4200000, spent: 2856000, startDate: '2025-06-01', endDate: '2026-08-31', manager: 'James Harrington', location: 'London, E14', type: 'Commercial', phase: 'Structural', workers: 42, contractValue: 4350000 },
  { id: 'p2', name: 'Manchester City Apartments', client: 'Northern Living Ltd', status: 'active', progress: 34, budget: 2800000, spent: 952000, startDate: '2025-09-15', endDate: '2026-12-20', manager: 'Sarah Mitchell', location: 'Manchester, M1', type: 'Residential', phase: 'Foundation', workers: 28, contractValue: 2950000 },
  { id: 'p3', name: 'Birmingham Road Bridge', client: 'West Midlands Council', status: 'active', progress: 89, budget: 1600000, spent: 1424000, startDate: '2025-03-01', endDate: '2026-03-30', manager: 'Tom Bradley', location: 'Birmingham, B1', type: 'Civil', phase: 'Finishing', workers: 18, contractValue: 1650000 },
  { id: 'p4', name: 'Leeds Warehouse Extension', client: 'Nordic Logistics UK', status: 'on_hold', progress: 22, budget: 890000, spent: 195800, startDate: '2025-11-01', endDate: '2026-07-15', manager: 'Adrian Stanca', location: 'Leeds, LS1', type: 'Industrial', phase: 'Design', workers: 0, contractValue: 925000 },
  { id: 'p5', name: 'Bristol Retail Park Fit-Out', client: 'Solaris Retail Group', status: 'completed', progress: 100, budget: 650000, spent: 618000, startDate: '2025-01-10', endDate: '2025-11-30', manager: 'Claire Watson', location: 'Bristol, BS1', type: 'Fit-Out', phase: 'Handover', workers: 0, contractValue: 685000 },
  { id: 'p6', name: 'Sheffield Hospital Refurb', client: 'NHS South Yorkshire', status: 'planning', progress: 5, budget: 3100000, spent: 46500, startDate: '2026-04-01', endDate: '2027-09-30', manager: 'James Harrington', location: 'Sheffield, S1', type: 'Healthcare', phase: 'Tender', workers: 2, contractValue: 3250000 },
];

export const invoices: Invoice[] = [
  { id: 'inv1', number: 'INV-2026-0142', client: 'Meridian Properties', project: 'Canary Wharf Office Complex', amount: 185000, vat: 37000, cisDeduction: 27750, status: 'sent', issueDate: '2026-03-01', dueDate: '2026-03-31', description: 'Structural steelwork — Phase 3' },
  { id: 'inv2', number: 'INV-2026-0141', client: 'Northern Living Ltd', project: 'Manchester City Apartments', amount: 94500, vat: 18900, cisDeduction: 14175, status: 'paid', issueDate: '2026-02-15', dueDate: '2026-03-15', description: 'Foundation works — Block A' },
  { id: 'inv3', number: 'INV-2026-0140', client: 'West Midlands Council', project: 'Birmingham Road Bridge', amount: 67200, vat: 0, cisDeduction: 10080, status: 'overdue', issueDate: '2026-01-31', dueDate: '2026-03-01', description: 'Concrete works — Span 3' },
  { id: 'inv4', number: 'INV-2026-0143', client: 'NHS South Yorkshire', project: 'Sheffield Hospital Refurb', amount: 46500, vat: 0, cisDeduction: 0, status: 'draft', issueDate: '2026-03-15', dueDate: '2026-04-14', description: 'Pre-construction surveys & design fees' },
  { id: 'inv5', number: 'INV-2026-0144', client: 'Nordic Logistics UK', project: 'Leeds Warehouse Extension', amount: 195800, vat: 39160, cisDeduction: 29370, status: 'disputed', issueDate: '2026-02-28', dueDate: '2026-03-28', description: 'Groundworks & drainage — Package 1' },
];

export const safetyIncidents: SafetyIncident[] = [
  { id: 's1', type: 'near-miss', title: 'Unsecured scaffold board at height', severity: 'serious', status: 'investigating', project: 'Canary Wharf Office Complex', reportedBy: 'Mike Turner', date: '2026-03-18', description: 'A scaffold board was found unsecured at Level 7. No injury occurred but potential for fall from height.' },
  { id: 's2', type: 'incident', title: 'Minor hand laceration — power tool', severity: 'minor', status: 'resolved', project: 'Manchester City Apartments', reportedBy: 'Dave Patel', date: '2026-03-12', description: 'Worker sustained minor cut while operating angle grinder without gloves.' },
  { id: 's3', type: 'toolbox-talk', title: 'Working at Height — Monthly Safety Brief', severity: 'minor', status: 'closed', project: 'Canary Wharf Office Complex', reportedBy: 'Sarah Mitchell', date: '2026-03-10', description: 'Monthly toolbox talk covering WAH regulations, PPE requirements, and scaffold inspection.' },
  { id: 's4', type: 'mewp-check', title: 'Daily MEWP Pre-Use Inspection — Cherry Picker', severity: 'minor', status: 'closed', project: 'Birmingham Road Bridge', reportedBy: 'Tom Bradley', date: '2026-03-20', description: 'Pre-use inspection of JLG 600S boom lift. All checks passed.' },
  { id: 's5', type: 'hazard', title: 'Overhead power lines near crane operation', severity: 'serious', status: 'open', project: 'Manchester City Apartments', reportedBy: 'James Harrington', date: '2026-03-19', description: 'Overhead 11kV power lines identified within crane swing radius. Exclusion zone required.' },
];

export const rfis: RFI[] = [
  { id: 'r1', number: 'RFI-CW-042', project: 'Canary Wharf Office Complex', subject: 'Structural beam specification clarification', question: 'The drawings show UC 305×305×198 for grid line C4-C5. The structural engineer\'s report references UC 254×254×167. Which takes precedence?', priority: 'high', status: 'open', submittedBy: 'James Harrington', submittedDate: '2026-03-15', dueDate: '2026-03-22', assignedTo: 'Meridian Properties', aiSuggestion: 'Based on loading calculations, the UC 305 specification should take precedence as it provides higher load capacity. Recommend requesting formal written confirmation from the structural engineer within 48 hours to avoid programme impact.' },
  { id: 'r2', number: 'RFI-MC-018', project: 'Manchester City Apartments', subject: 'Waterproofing system — basement level', question: 'Specification calls for Type A tanked waterproofing. Site conditions suggest Type B may be more appropriate given high water table. Client approval required.', priority: 'critical', status: 'pending', submittedBy: 'Sarah Mitchell', submittedDate: '2026-03-14', dueDate: '2026-03-21', assignedTo: 'Northern Living Ltd' },
  { id: 'r3', number: 'RFI-BB-007', project: 'Birmingham Road Bridge', subject: 'Concrete mix design for deck pour', question: 'Requesting approval for C40/50 SRC concrete mix design for bridge deck. Supplier mix design report attached.', priority: 'medium', status: 'answered', submittedBy: 'Tom Bradley', submittedDate: '2026-03-08', dueDate: '2026-03-15', assignedTo: 'West Midlands Council', response: 'Approved. Proceed with C40/50 SRC as specified. Ensure minimum 4 cube samples per pour.' },
];

export const changeOrders: ChangeOrder[] = [
  { id: 'co1', number: 'CO-CW-011', project: 'Canary Wharf Office Complex', title: 'Additional fire suppression system — Floor 12', description: 'Client requested additional sprinkler heads on floor 12 to cover new server room layout.', amount: 28500, status: 'approved', submittedDate: '2026-02-20', approvedDate: '2026-03-05', reason: 'Client variation', scheduleImpact: 3 },
  { id: 'co2', number: 'CO-MC-005', project: 'Manchester City Apartments', title: 'Ground conditions — additional piling', description: 'Unforeseen poor ground conditions require 12 additional CFA piles to SE corner.', amount: 67200, status: 'pending', submittedDate: '2026-03-10', reason: 'Unforeseen conditions', scheduleImpact: 8 },
  { id: 'co3', number: 'CO-LS-002', project: 'Leeds Warehouse Extension', title: 'Upgraded cladding specification', description: 'Client requested upgrade from standard steel cladding to insulated composite panels.', amount: 34800, status: 'draft', submittedDate: '2026-03-18', reason: 'Client variation', scheduleImpact: 2 },
];

export const teamMembers: TeamMember[] = [
  { id: 't1', name: 'James Harrington', role: 'Senior Project Manager', trade: 'Management', email: 'j.harrington@cortexbuild.co.uk', phone: '07700 900201', status: 'on_site', cisStatus: 'gross', utrNumber: '1234567890', niNumber: 'AB123456C', projects: ['p1', 'p6'], hoursThisWeek: 48, ramsCompleted: true },
  { id: 't2', name: 'Sarah Mitchell', role: 'Project Manager', trade: 'Management', email: 's.mitchell@cortexbuild.co.uk', phone: '07700 900202', status: 'on_site', cisStatus: 'gross', utrNumber: '2345678901', niNumber: 'CD234567D', projects: ['p2'], hoursThisWeek: 45, ramsCompleted: true },
  { id: 't3', name: 'Mike Turner', role: 'Site Foreman', trade: 'General', email: 'm.turner@cortexbuild.co.uk', phone: '07700 900203', status: 'on_site', cisStatus: 'net', utrNumber: '3456789012', niNumber: 'EF345678E', projects: ['p1'], hoursThisWeek: 52, ramsCompleted: true },
  { id: 't4', name: 'Dave Patel', role: 'Electrician', trade: 'Electrical', email: 'd.patel@cortexbuild.co.uk', phone: '07700 900204', status: 'on_site', cisStatus: 'net', projects: ['p2'], hoursThisWeek: 44, ramsCompleted: true },
  { id: 't5', name: 'Claire Watson', role: 'QS / Commercial Manager', trade: 'Surveying', email: 'c.watson@cortexbuild.co.uk', phone: '07700 900205', status: 'off_site', cisStatus: 'gross', utrNumber: '5678901234', niNumber: 'IJ567890I', projects: ['p1', 'p2', 'p3'], hoursThisWeek: 40, ramsCompleted: true },
  { id: 't6', name: 'Tom Bradley', role: 'Site Engineer', trade: 'Civil', email: 't.bradley@cortexbuild.co.uk', phone: '07700 900206', status: 'on_site', cisStatus: 'net', projects: ['p3'], hoursThisWeek: 50, ramsCompleted: true },
  { id: 't7', name: 'Ryan Chen', role: 'Groundworker', trade: 'Groundworks', email: 'r.chen@cortexbuild.co.uk', phone: '07700 900207', status: 'on_site', cisStatus: 'net', projects: ['p2'], hoursThisWeek: 48, ramsCompleted: false },
  { id: 't8', name: 'Lisa Okafor', role: 'Safety Officer', trade: 'HSE', email: 'l.okafor@cortexbuild.co.uk', phone: '07700 900208', status: 'on_site', cisStatus: 'gross', projects: ['p1', 'p2', 'p3'], hoursThisWeek: 40, ramsCompleted: true },
];

export const equipment: Equipment[] = [
  { id: 'e1', name: 'Liebherr 81 K Tower Crane', type: 'Crane', status: 'on_site', location: 'Canary Wharf', nextService: '2026-04-15', dailyRate: 1200 },
  { id: 'e2', name: 'Manitowoc 14000 Crawler Crane', type: 'Crane', status: 'on_site', location: 'Manchester', nextService: '2026-05-01', dailyRate: 1800 },
  { id: 'e3', name: 'JLG 600S Boom Lift', type: 'MEWP', registration: 'MW23 ABX', status: 'on_site', location: 'Birmingham', nextService: '2026-04-08', dailyRate: 380 },
  { id: 'e4', name: 'Volvo EC300E Excavator', type: 'Excavator', registration: 'XC72 DEF', status: 'available', location: 'Depot — Leeds', nextService: '2026-03-28', dailyRate: 650 },
  { id: 'e5', name: 'Terex TA30 Dumper', type: 'Dumper', registration: 'YB21 GHI', status: 'maintenance', location: 'Workshop', nextService: '2026-03-25', dailyRate: 280 },
  { id: 'e6', name: 'Putzmeister BSF 36 Concrete Pump', type: 'Concrete Equipment', status: 'hired_out', location: 'Bristol', nextService: '2026-06-01', dailyRate: 950 },
];

export const subcontractors: Subcontractor[] = [
  { id: 'sc1', company: 'Apex Electrical Ltd', trade: 'Electrical', contact: 'Phil Archer', email: 'phil@apexelectrical.co.uk', phone: '0161 900 1234', status: 'active', cisVerified: true, insuranceExpiry: '2026-12-31', ramsApproved: true, currentProject: 'Canary Wharf Office Complex', contractValue: 385000, rating: 4.8 },
  { id: 'sc2', company: 'Northen Groundworks Ltd', trade: 'Groundworks', contact: 'Steve Mason', email: 'steve@northerngw.co.uk', phone: '0113 900 5678', status: 'active', cisVerified: true, insuranceExpiry: '2026-09-30', ramsApproved: true, currentProject: 'Manchester City Apartments', contractValue: 210000, rating: 4.5 },
  { id: 'sc3', company: 'Swift Plumbing Services', trade: 'Plumbing & HVAC', contact: 'Karen Woods', email: 'karen@swiftplumbing.co.uk', phone: '0121 900 9012', status: 'active', cisVerified: false, insuranceExpiry: '2026-06-15', ramsApproved: false, currentProject: 'Birmingham Road Bridge', contractValue: 45000, rating: 3.9 },
  { id: 'sc4', company: 'StoneWall Masonry', trade: 'Masonry', contact: 'John Briggs', email: 'john@stonewall.co.uk', phone: '0114 900 3456', status: 'pending', cisVerified: true, insuranceExpiry: '2027-01-31', ramsApproved: false, contractValue: 0, rating: 4.2 },
];

export const documents: Document[] = [
  { id: 'd1', name: 'Structural Drawings — Rev C', type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'James Harrington', uploadedDate: '2026-03-10', version: 'Rev C', size: '18.4 MB', status: 'current', category: 'DRAWINGS' },
  { id: 'd2', name: 'RAMS — Structural Steelwork', type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'Lisa Okafor', uploadedDate: '2026-02-28', version: '2.1', size: '4.2 MB', status: 'current', category: 'RAMS' },
  { id: 'd3', name: 'Main Contract — Signed', type: 'PDF', project: 'Manchester City Apartments', uploadedBy: 'Adrian Stanca', uploadedDate: '2025-09-12', version: '1.0', size: '2.8 MB', status: 'current', category: 'CONTRACTS' },
  { id: 'd4', name: 'Ground Investigation Report', type: 'PDF', project: 'Manchester City Apartments', uploadedBy: 'Sarah Mitchell', uploadedDate: '2025-08-20', version: '1.0', size: '12.6 MB', status: 'current', category: 'REPORTS' },
  { id: 'd5', name: 'Building Regulations Approval', type: 'PDF', project: 'Canary Wharf Office Complex', uploadedBy: 'Claire Watson', uploadedDate: '2025-05-15', version: '1.0', size: '1.1 MB', status: 'current', category: 'PERMITS' },
];

export const timesheets: Timesheet[] = [
  { id: 'ts1', worker: 'Mike Turner', project: 'Canary Wharf Office Complex', week: '2026-W11', regularHours: 40, overtimeHours: 10, dayworkHours: 2, totalPay: 1248, status: 'approved', cisDeduction: 187.2 },
  { id: 'ts2', worker: 'Dave Patel', project: 'Manchester City Apartments', week: '2026-W11', regularHours: 40, overtimeHours: 4, dayworkHours: 0, totalPay: 1056, status: 'submitted', cisDeduction: 158.4 },
  { id: 'ts3', worker: 'Ryan Chen', project: 'Manchester City Apartments', week: '2026-W11', regularHours: 40, overtimeHours: 8, dayworkHours: 0, totalPay: 1008, status: 'draft', cisDeduction: 151.2 },
  { id: 'ts4', worker: 'Tom Bradley', project: 'Birmingham Road Bridge', week: '2026-W11', regularHours: 40, overtimeHours: 10, dayworkHours: 0, totalPay: 1250, status: 'approved', cisDeduction: 187.5 },
];

export const meetings: Meeting[] = [
  { id: 'm1', title: 'Progress Meeting — Canary Wharf', project: 'Canary Wharf Office Complex', date: '2026-03-25', time: '09:00', location: 'Site Office', attendees: ['James Harrington', 'Claire Watson', 'Meridian Properties PM'], agenda: ['Programme review', 'RFI status', 'Change orders', 'Safety report', 'AOB'], actionItems: [{ task: 'Resolve RFI-CW-042', owner: 'James Harrington', due: '2026-03-22', status: 'open' }, { task: 'Submit CO-CW-012', owner: 'Claire Watson', due: '2026-03-26', status: 'open' }] },
  { id: 'm2', title: 'Design Team Meeting — Sheffield Hospital', project: 'Sheffield Hospital Refurb', date: '2026-03-28', time: '14:00', location: 'Video Call', attendees: ['Adrian Stanca', 'NHS PM', 'Architect', 'Structural Engineer'], agenda: ['Design review', 'Tender strategy', 'Programme', 'Risk register'], actionItems: [] },
];

export const materials: Material[] = [
  { id: 'mat1', name: 'Ready-Mix Concrete C40/50', category: 'Concrete', quantity: 480, unit: 'm³', unitCost: 145, totalCost: 69600, supplier: 'Hanson UK', project: 'Birmingham Road Bridge', status: 'on_site', deliveryDate: '2026-03-18', poNumber: 'PO-BB-0142' },
  { id: 'mat2', name: 'UC 305×305×198 Steel Section', category: 'Structural Steel', quantity: 28, unit: 'tonne', unitCost: 2100, totalCost: 58800, supplier: 'Tata Steel UK', project: 'Canary Wharf Office Complex', status: 'delivered', deliveryDate: '2026-03-12', poNumber: 'PO-CW-0089' },
  { id: 'mat3', name: 'CFA Piling Concrete', category: 'Concrete', quantity: 180, unit: 'm³', unitCost: 138, totalCost: 24840, supplier: 'CEMEX UK', project: 'Manchester City Apartments', status: 'ordered', deliveryDate: '2026-03-27', poNumber: 'PO-MC-0067' },
  { id: 'mat4', name: 'Waterproof Membrane Type B', category: 'Waterproofing', quantity: 1200, unit: 'm²', unitCost: 28, totalCost: 33600, supplier: 'Sika Ltd', project: 'Manchester City Apartments', status: 'ordered', deliveryDate: '2026-04-02', poNumber: 'PO-MC-0068' },
];

export const punchListItems: PunchListItem[] = [
  { id: 'pl1', project: 'Bristol Retail Park Fit-Out', location: 'Unit A — Entrance', description: 'Skirting board not mitred correctly at corner joint', assignedTo: 'Joinery subcontractor', priority: 'low', status: 'completed', dueDate: '2026-03-20', photos: 2, trade: 'Joinery' },
  { id: 'pl2', project: 'Bristol Retail Park Fit-Out', location: 'Unit B — Toilet Block', description: 'Silicone bead missing around basin', assignedTo: 'Swift Plumbing', priority: 'medium', status: 'in_progress', dueDate: '2026-03-22', photos: 1, trade: 'Plumbing' },
  { id: 'pl3', project: 'Canary Wharf Office Complex', location: 'Floor 4 — Meeting Rooms', description: 'Plasterboard joint visible — requires re-skim and paint', assignedTo: 'Plasterer', priority: 'medium', status: 'open', dueDate: '2026-04-10', photos: 3, trade: 'Plastering' },
];

export const inspections: Inspection[] = [
  { id: 'ins1', type: 'Scaffold Inspection', project: 'Canary Wharf Office Complex', inspector: 'Lisa Okafor', date: '2026-03-20', status: 'passed', score: 94, items: [{ check: 'Base plates secured', result: 'pass' }, { check: 'Handrails at all levels', result: 'pass' }, { check: 'Boards fully boarded', result: 'pass' }, { check: 'Ladder access secured', result: 'pass' }], nextInspection: '2026-04-03' },
  { id: 'ins2', type: 'Concrete Pour Inspection', project: 'Birmingham Road Bridge', inspector: 'Tom Bradley', date: '2026-03-18', status: 'passed', score: 100, items: [{ check: 'Mix design approved', result: 'pass' }, { check: 'Formwork checked', result: 'pass' }, { check: 'Cube samples taken', result: 'pass' }] },
  { id: 'ins3', type: 'Fire Safety Inspection', project: 'Manchester City Apartments', inspector: 'Lisa Okafor', date: '2026-04-01', status: 'scheduled', items: [] },
];

export const ramsDocuments: RAMSDocument[] = [
  { id: 'rams1', title: 'RAMS — Structural Steelwork Installation', project: 'Canary Wharf Office Complex', activity: 'Steel Frame Erection', version: '2.1', status: 'approved', createdBy: 'Lisa Okafor', approvedBy: 'James Harrington', reviewDate: '2026-06-01', hazards: [{ hazard: 'Falls from height', risk: 'High', control: 'Full harness, anchor points, exclusion zones', residualRisk: 'Low' }, { hazard: 'Falling objects', risk: 'High', control: 'Safety nets, exclusion zones, hard hats mandatory', residualRisk: 'Low' }, { hazard: 'Crane operations', risk: 'Medium', control: 'Lift plan, banksmen, exclusion zones', residualRisk: 'Low' }], methodStatement: ['Erect tower crane per lift plan', 'Establish exclusion zones', 'Check steelwork for damage before lift', 'Use tag lines to control loads', 'Bolt connections per structural engineer spec', 'Final inspection before removing crane slings'], ppe: ['Hard hat', 'Hi-vis vest', 'Safety harness', 'Steel toe-capped boots', 'Gloves', 'Safety glasses'], signatures: 8, required: 10 },
];

export const cisReturns: CISReturn[] = [
  { id: 'cis1', contractor: 'Apex Electrical Ltd', utr: '1234567890', period: 'March 2026', grossPayment: 48500, materialsCost: 12000, labourNet: 36500, cisDeduction: 7300, status: 'pending', verificationStatus: 'net' },
  { id: 'cis2', contractor: 'Northen Groundworks Ltd', utr: '2345678901', period: 'March 2026', grossPayment: 28000, materialsCost: 8500, labourNet: 19500, cisDeduction: 3900, status: 'pending', verificationStatus: 'net' },
  { id: 'cis3', contractor: 'StoneWall Masonry', utr: '9876543210', period: 'February 2026', grossPayment: 15200, materialsCost: 3200, labourNet: 12000, cisDeduction: 3600, status: 'submitted', verificationStatus: 'unverified' },
];

export const tenders: TenderRequest[] = [
  { id: 'ten1', title: 'Royal Liverpool University Hospital — Ward Refurb', client: 'NHS Mersey', value: 2800000, deadline: '2026-04-15', status: 'drafting', probability: 45, type: 'Healthcare', location: 'Liverpool', aiScore: 72, notes: 'Strong track record in NHS projects. Key risk: tight programme.' },
  { id: 'ten2', title: 'Manchester Airport Terminal Extension', client: 'MAG Group', value: 8500000, deadline: '2026-05-01', status: 'submitted', probability: 25, type: 'Transport', location: 'Manchester', aiScore: 58, notes: 'Competitive tender. Consider partnering with specialist fit-out contractor.' },
  { id: 'ten3', title: 'Nottingham City Centre Hotel — New Build', client: 'Premier Hospitality', value: 4200000, deadline: '2026-04-30', status: 'shortlisted', probability: 65, type: 'Hospitality', location: 'Nottingham', aiScore: 81, notes: 'Excellent relationship with client. Price competitive.' },
  { id: 'ten4', title: 'Leeds Office Park — Phase 2', client: 'Greystone Developments', value: 1650000, deadline: '2026-03-28', status: 'won', probability: 100, type: 'Commercial', location: 'Leeds', aiScore: 88, notes: 'Won. Mobilisation starting April 2026.' },
];

export const contacts: Contact[] = [
  { id: 'c1', name: 'Robert Sinclair', company: 'Meridian Properties', role: 'Development Director', email: 'r.sinclair@meridian.co.uk', phone: '020 7900 1234', type: 'client', value: 4350000, lastContact: '2026-03-15', status: 'active', projects: 1 },
  { id: 'c2', name: 'Amanda Foster', company: 'Northern Living Ltd', role: 'Project Director', email: 'a.foster@northernliving.co.uk', phone: '0161 900 5678', type: 'client', value: 2950000, lastContact: '2026-03-18', status: 'active', projects: 1 },
  { id: 'c3', name: 'Dr. Helen Shaw', company: 'NHS South Yorkshire', role: 'Head of Estates', email: 'h.shaw@nhs-sy.nhs.uk', phone: '0114 900 9012', type: 'client', value: 3250000, lastContact: '2026-03-10', status: 'active', projects: 1 },
  { id: 'c4', name: 'Phil Archer', company: 'Apex Electrical Ltd', role: 'Director', email: 'phil@apexelectrical.co.uk', phone: '0161 900 1234', type: 'subcontractor', value: 385000, lastContact: '2026-03-12', status: 'active', projects: 2 },
];

export const dailyReports: DailyReport[] = [
  { id: 'dr1', project: 'Canary Wharf Office Complex', date: '2026-03-20', preparedBy: 'Mike Turner', weather: 'Partly cloudy', temperature: '12°C', workersOnSite: 42, activities: ['Steel erection — Level 8', 'Concrete pour — Floor 7 slab', 'MEP first fix — Floors 3-4'], materials: ['C35/45 concrete — 120m³ delivered and poured', 'M20 bolts — 500 units'], equipment: ['Tower crane operational', 'Concrete pump running', '2× telehandlers'], issues: ['1-hour delay to crane operations due to wind speed'], photos: 24, progress: 68, aiSummary: 'Good productivity day overall. Concrete pour on Floor 7 completed ahead of schedule. Wind-related crane delay partially offset by additional workforce on MEP. On track for weekly target.' },
];

// Chart data
export const revenueData = [
  { month: 'Sep', revenue: 485000, costs: 342000, profit: 143000 },
  { month: 'Oct', revenue: 612000, costs: 445000, profit: 167000 },
  { month: 'Nov', revenue: 534000, costs: 378000, profit: 156000 },
  { month: 'Dec', revenue: 298000, costs: 225000, profit: 73000 },
  { month: 'Jan', revenue: 721000, costs: 512000, profit: 209000 },
  { month: 'Feb', revenue: 856000, costs: 601000, profit: 255000 },
  { month: 'Mar', revenue: 943000, costs: 648000, profit: 295000 },
];

export const safetyTrendData = [
  { month: 'Sep', incidents: 3, nearMisses: 8, toolboxTalks: 12 },
  { month: 'Oct', incidents: 2, nearMisses: 6, toolboxTalks: 14 },
  { month: 'Nov', incidents: 1, nearMisses: 9, toolboxTalks: 13 },
  { month: 'Dec', incidents: 0, nearMisses: 5, toolboxTalks: 10 },
  { month: 'Jan', incidents: 2, nearMisses: 7, toolboxTalks: 15 },
  { month: 'Feb', incidents: 1, nearMisses: 4, toolboxTalks: 16 },
  { month: 'Mar', incidents: 2, nearMisses: 5, toolboxTalks: 12 },
];

export const projectProgressData = projects.filter(p => p.status === 'active').map(p => ({
  name: p.name.split(' ').slice(0, 2).join(' '),
  progress: p.progress,
  budget: p.budget,
  spent: p.spent,
}));

// Risk register mock data
export const riskRegister = [
  { id: 'rr1', title: 'Ground contamination — Manchester site', project: 'Manchester City Apartments', category: 'Environmental', likelihood: 3, impact: 4, status: 'open', owner: 'Sarah Mitchell', mitigation: 'Phase 2 soil survey commissioned', review_date: '2026-04-01' },
  { id: 'rr2', title: 'Programme delay — steel delivery lead time', project: 'Canary Wharf Office Complex', category: 'Commercial', likelihood: 2, impact: 4, status: 'mitigated', owner: 'James Harrington', mitigation: 'Steel ordered 8 weeks ahead — confirmed delivery', review_date: '2026-04-15' },
  { id: 'rr3', title: 'Subcontractor insolvency risk', project: 'All Projects', category: 'Commercial', likelihood: 2, impact: 5, status: 'open', owner: 'Claire Watson', mitigation: 'Credit checks completed, payment retention held', review_date: '2026-05-01' },
  { id: 'rr4', title: 'CDM Principal Contractor compliance', project: 'Sheffield Hospital Refurb', category: 'Regulatory', likelihood: 2, impact: 5, status: 'open', owner: 'Lisa Okafor', mitigation: 'Construction Phase Plan to be submitted pre-commencement', review_date: '2026-04-01' },
];

// Named aliases for API service compatibility
export const mockProjects = projects;
export const mockInvoices = invoices;
export const mockTeamMembers = teamMembers;
export const mockSafetyIncidents = safetyIncidents;
export const mockRFIs = rfis;
export const mockChangeOrders = changeOrders;
export const mockRAMS = ramsDocuments;
export const mockCISReturns = cisReturns;
export const mockEquipment = equipment;
export const mockSubcontractors = subcontractors;
export const mockTimesheets = timesheets;
export const mockDocuments = documents;
export const mockTenders = tenders;
export const mockDailyReports = dailyReports;
export const mockMeetings = meetings;
export const mockMaterials = materials;
export const mockPunchList = punchListItems;
export const mockInspections = inspections;
export const mockContacts = contacts;
export const mockRiskRegister = riskRegister;

// Purchase Orders (Procurement) mock data
export const purchaseOrders = [
  { id: 'po1', po_number: 'PO-CW-0089', supplier: 'Tata Steel UK', description: 'UC 305×305×198 Steel Sections (28t)', value: 58800, project: 'Canary Wharf Office Complex', status: 'delivered', order_date: '2026-02-15', delivery_date: '2026-03-12', category: 'Structural Steel', notes: 'Delivered to site — signed off by J. Harrington' },
  { id: 'po2', po_number: 'PO-BB-0142', supplier: 'Hanson UK', description: 'Ready-Mix Concrete C40/50 (480m³)', value: 69600, project: 'Birmingham Road Bridge', status: 'on_site', order_date: '2026-03-01', delivery_date: '2026-03-18', category: 'Concrete', notes: 'Ongoing delivery — phased pours' },
  { id: 'po3', po_number: 'PO-MC-0067', supplier: 'CEMEX UK', description: 'CFA Piling Concrete (180m³)', value: 24840, project: 'Manchester City Apartments', status: 'pending_delivery', order_date: '2026-02-20', delivery_date: '2026-03-27', category: 'Concrete', notes: '' },
  { id: 'po4', po_number: 'PO-MC-0068', supplier: 'Sika Ltd', description: 'Waterproof Membrane Type B (1200m²)', value: 33600, project: 'Manchester City Apartments', status: 'pending_delivery', order_date: '2026-02-25', delivery_date: '2026-04-02', category: 'Waterproofing', notes: '' },
  { id: 'po5', po_number: 'PO-CW-0090', supplier: 'Hilti UK', description: 'Fastening & Anchoring Systems', value: 15420, project: 'Canary Wharf Office Complex', status: 'delivered', order_date: '2026-03-01', delivery_date: '2026-03-10', category: 'Fixings', notes: '' },
  { id: 'po6', po_number: 'PO-LS-0051', supplier: 'Kingspan Group', description: 'Insulated Composite Cladding Panels', value: 87500, project: 'Leeds Warehouse Extension', status: 'ordered', order_date: '2026-03-10', delivery_date: '2026-05-01', category: 'Cladding', notes: 'Long lead item — 8 week lead time' },
  { id: 'po7', po_number: 'PO-BB-0143', supplier: 'Lafarge Cement', description: 'Portland Cement 52.5N (50t)', value: 12750, project: 'Birmingham Road Bridge', status: 'delivered', order_date: '2026-01-30', delivery_date: '2026-02-28', category: 'Concrete', notes: '' },
  { id: 'po8', po_number: 'PO-CW-0091', supplier: 'Bosch Professional', description: 'Power Tools & Equipment', value: 24890, project: 'Canary Wharf Office Complex', status: 'pending_delivery', order_date: '2026-03-08', delivery_date: '2026-03-22', category: 'Tools', notes: '' },
  { id: 'po9', po_number: 'PO-SH-0023', supplier: 'Sto UK', description: 'External Insulation Composite System', value: 145000, project: 'Sheffield Hospital Refurb', status: 'pending_approval', order_date: '2026-03-18', delivery_date: '2026-05-15', category: 'Insulation', notes: 'Awaiting client approval on spec' },
];

export const mockPurchaseOrders = purchaseOrders;
