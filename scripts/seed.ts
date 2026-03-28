import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const UserRole = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  FIELD_WORKER: 'FIELD_WORKER',
} as const;

const ProjectStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
} as const;

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETE: 'COMPLETE',
} as const;

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Construction',
      slug: 'acme-construction',
      industry: 'Commercial Construction',
      size: '100-500',
      description: 'Leading commercial construction company specializing in office towers, healthcare facilities, and infrastructure projects.',
      plan: 'enterprise',
      entitlements: JSON.stringify({
        maxProjects: 50,
        maxUsers: 100,
        features: ['ai-insights', 'advanced-reporting', 'api-access', 'custom-workflows'],
      }),
    },
  });

  console.log(`Created organization: ${org.name}`);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const pmPassword = await bcrypt.hash('pm123', 10);
  const workerPassword = await bcrypt.hash('worker123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme-construction.com',
      name: 'John Administrator',
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: '+1-555-0100',
    },
  });

  const projectManager = await prisma.user.create({
    data: {
      email: 'pm@acme-construction.com',
      name: 'Sarah Project Manager',
      password: pmPassword,
      role: UserRole.PROJECT_MANAGER,
      phone: '+1-555-0101',
    },
  });

  const fieldWorker = await prisma.user.create({
    data: {
      email: 'worker@acme-construction.com',
      name: 'Mike Field Worker',
      password: workerPassword,
      role: UserRole.FIELD_WORKER,
      phone: '+1-555-0102',
    },
  });

  const fieldWorker2 = await prisma.user.create({
    data: {
      email: 'worker2@acme-construction.com',
      name: 'Emily Field Worker',
      password: workerPassword,
      role: UserRole.FIELD_WORKER,
      phone: '+1-555-0103',
    },
  });

  console.log('Created users: admin, project manager, field workers');

  await prisma.teamMember.createMany({
    data: [
      { userId: admin.id, organizationId: org.id, role: 'ADMIN' },
      { userId: projectManager.id, organizationId: org.id, role: 'PROJECT_MANAGER' },
      { userId: fieldWorker.id, organizationId: org.id, role: 'FIELD_WORKER' },
      { userId: fieldWorker2.id, organizationId: org.id, role: 'FIELD_WORKER' },
    ],
  });

  console.log('Added team members to organization');

  const project1 = await prisma.project.create({
    data: {
      name: 'Downtown Office Tower',
      description: 'A 25-story commercial office building with underground parking and rooftop amenity space.',
      status: ProjectStatus.IN_PROGRESS,
      location: '123 Main Street, New York, NY 10001',
      clientName: 'Metropolitan Realty Group',
      clientEmail: 'contact@metropolitan-realty.com',
      budget: 12500000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2026-06-30'),
      organizationId: org.id,
      managerId: projectManager.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Highway 101 Expansion',
      description: '4-lane highway expansion with new interchange and bridge construction.',
      status: ProjectStatus.IN_PROGRESS,
      location: 'Highway 101, San Mateo County, CA',
      clientName: 'California Department of Transportation',
      clientEmail: 'dot@caltrans.ca.gov',
      budget: 45200000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2027-12-31'),
      organizationId: org.id,
      managerId: projectManager.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Medical Center Renovation',
      description: 'Complete interior renovation of existing hospital including new surgical suites.',
      status: ProjectStatus.PLANNING,
      location: '500 Hospital Drive, Boston, MA 02115',
      clientName: 'Boston Healthcare System',
      clientEmail: 'facilities@boston-healthcare.org',
      budget: 28700000,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2026-03-31'),
      organizationId: org.id,
      managerId: projectManager.id,
    },
  });

  console.log('Created projects: Downtown Office Tower, Highway 101 Expansion, Medical Center Renovation');

  await prisma.projectTeamMember.createMany({
    data: [
      { projectId: project1.id, userId: projectManager.id, role: 'PROJECT_MANAGER' },
      { projectId: project1.id, userId: fieldWorker.id, role: 'FIELD_WORKER' },
      { projectId: project2.id, userId: projectManager.id, role: 'PROJECT_MANAGER' },
      { projectId: project2.id, userId: fieldWorker2.id, role: 'FIELD_WORKER' },
      { projectId: project3.id, userId: projectManager.id, role: 'PROJECT_MANAGER' },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Install foundation rebar',
        description: 'Complete rebar installation for foundation section A and B',
        status: TaskStatus.COMPLETE,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-03-15'),
        projectId: project1.id,
        assigneeId: fieldWorker.id,
        creatorId: projectManager.id,
        completedAt: new Date('2024-03-14'),
      },
      {
        title: 'Pour concrete foundation',
        description: 'Pour concrete for building foundation sections A and B',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: new Date('2024-04-01'),
        projectId: project1.id,
        assigneeId: fieldWorker.id,
        creatorId: projectManager.id,
      },
      {
        title: 'Install steel framing - Floor 1-5',
        description: 'Erect structural steel for floors 1 through 5',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-05-15'),
        projectId: project1.id,
        assigneeId: fieldWorker2.id,
        creatorId: projectManager.id,
      },
      {
        title: 'Highway grading - Section 4',
        description: 'Complete grading for highway section 4',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-04-20'),
        projectId: project2.id,
        assigneeId: fieldWorker2.id,
        creatorId: projectManager.id,
      },
      {
        title: 'Bridge pier construction',
        description: 'Construct bridge piers 1 through 4',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-06-01'),
        projectId: project2.id,
        assigneeId: fieldWorker.id,
        creatorId: projectManager.id,
      },
    ],
  });

  console.log('Created tasks');

  await prisma.rFI.createMany({
    data: [
      {
        number: 'RFI-001',
        title: 'Foundation depth clarification',
        question: 'What is the required depth for the foundation footings per the new structural drawings?',
        answer: 'Foundation footings should be placed at minimum 4 feet below frost line, which per local code is 42 inches.',
        status: 'ANSWERED',
        projectId: project1.id,
        createdById: fieldWorker.id,
        assignedToId: projectManager.id,
        answeredById: projectManager.id,
        dueDate: new Date('2024-03-10'),
      },
      {
        number: 'RFI-002',
        title: 'Steel connection details',
        question: 'Cannot find connection detail for column base plates on structural drawings. Please provide.',
        status: 'OPEN',
        projectId: project1.id,
        createdById: fieldWorker.id,
        assignedToId: projectManager.id,
        dueDate: new Date('2024-03-25'),
      },
      {
        number: 'RFI-003',
        title: 'Highway drainage requirements',
        question: 'What is the required drainage capacity for the new culverts in section 3?',
        status: 'UNDER_REVIEW',
        projectId: project2.id,
        createdById: fieldWorker2.id,
        assignedToId: projectManager.id,
        dueDate: new Date('2024-04-05'),
      },
    ],
  });

  console.log('Created RFIs');

  await prisma.dailyReport.createMany({
    data: [
      {
        date: new Date('2024-03-18'),
        weather: 'Sunny',
        temperature: '72°F',
        workforceCount: 45,
        workPerformed: 'Continued concrete pours on floors 3-4. Installed MEP rough-in for floors 1-2. Progress on elevator shaft construction.',
        notes: 'Minor delay due to concrete delivery. Team recovered by end of shift.',
        projectId: project1.id,
        createdById: projectManager.id,
      },
      {
        date: new Date('2024-03-17'),
        weather: 'Partly Cloudy',
        temperature: '68°F',
        workforceCount: 48,
        workPerformed: 'Steel erection continued on floors 6-8. Concrete curing on floors 2-3. Started interior framing on floor 1.',
        notes: 'Safety inspection passed. No incidents.',
        projectId: project1.id,
        createdById: projectManager.id,
      },
      {
        date: new Date('2024-03-18'),
        weather: 'Sunny',
        temperature: '75°F',
        workforceCount: 32,
        workPerformed: 'Grading work on section 4. Set forms for bridge abutment. Hauled excavated material to disposal site.',
        notes: 'Equipment maintenance performed on excavator during lunch break.',
        projectId: project2.id,
        createdById: projectManager.id,
      },
    ],
  });

  console.log('Created daily reports');

  await prisma.safetyIncident.createMany({
    data: [
      {
        title: 'Near miss - dropped tool',
        description: 'A wrench was dropped from the 5th floor. No injuries occurred. Area was immediately cordoned off.',
        severity: 'MEDIUM',
        status: 'CLOSED',
        projectId: project1.id,
        reportedById: fieldWorker.id,
        assignedToId: projectManager.id,
      },
      {
        title: 'Minor slip on wet surface',
        description: 'Worker slipped on wet concrete but caught themselves. No injury, but reported for hazard review.',
        severity: 'LOW',
        status: 'CLOSED',
        projectId: project1.id,
        reportedById: fieldWorker2.id,
        assignedToId: projectManager.id,
      },
      {
        title: 'Unauthorized entry to restricted area',
        description: 'Visitor was found in active construction zone without proper PPE. Area supervisor addressed immediately.',
        severity: 'LOW',
        status: 'OPEN',
        projectId: project2.id,
        reportedById: fieldWorker.id,
        assignedToId: projectManager.id,
      },
    ],
  });

  await prisma.toolboxTalk.createMany({
    data: [
      {
        title: 'Fall Protection Awareness',
        date: new Date('2024-03-18'),
        presenterId: projectManager.id,
        projectId: project1.id,
        attendees: [fieldWorker.id, fieldWorker2.id, 'worker3', 'worker4', 'worker5'],
        notes: 'Discussed proper harness inspection and anchor point selection.',
      },
      {
        title: 'Heavy Equipment Safety',
        date: new Date('2024-03-11'),
        presenterId: projectManager.id,
        projectId: project2.id,
        attendees: [fieldWorker.id, fieldWorker2.id, 'operator1', 'operator2'],
        notes: 'Reviewed blind spots and communication protocols for heavy equipment.',
      },
    ],
  });

  await prisma.riskAssessment.createMany({
    data: [
      {
        title: 'Work at Heights - Floor 6-10',
        description: 'Risk assessment for steel erection work on floors 6-10',
        hazards: JSON.stringify([
          { hazard: 'Fall from height', risk: 'HIGH', control: '100% tie-off required' },
          { hazard: 'Struck by falling objects', risk: 'MEDIUM', control: 'Safety netting and exclusion zones' },
        ]),
        controls: JSON.stringify([
          { control: 'Daily harness inspection', frequency: 'Daily' },
          { control: 'Safety netting installation', frequency: 'Ongoing' },
        ]),
        status: 'APPROVED',
        projectId: project1.id,
        createdById: projectManager.id,
        approvedById: admin.id,
      },
    ],
  });

  console.log('Created safety data');

  await prisma.milestone.createMany({
    data: [
      {
        name: 'Foundation Complete',
        description: 'All foundation work finished',
        dueDate: new Date('2024-04-15'),
        completed: true,
        projectId: project1.id,
      },
      {
        name: 'Structural Steel Topped Out',
        description: 'Final steel beam placed',
        dueDate: new Date('2024-08-01'),
        completed: false,
        projectId: project1.id,
      },
      {
        name: 'Interior Rough-In Complete',
        description: 'All MEP rough-in finished',
        dueDate: new Date('2025-02-01'),
        completed: false,
        projectId: project1.id,
      },
      {
        name: 'Highway Section 4 Open',
        description: 'Section 4 ready for traffic',
        dueDate: new Date('2024-12-01'),
        completed: false,
        projectId: project2.id,
      },
    ],
  });

  await prisma.changeOrder.createMany({
    data: [
      {
        number: 'CO-001',
        title: 'Additional foundation reinforcement',
        description: 'Extra rebar required due to unexpected soil conditions',
        amount: 75000,
        status: 'APPROVED',
        projectId: project1.id,
        requestedById: projectManager.id,
        approvedById: admin.id,
      },
      {
        number: 'CO-002',
        title: 'Drainage system upgrade',
        description: 'Upgraded drainage capacity for new stormwater regulations',
        amount: 120000,
        status: 'PENDING',
        projectId: project2.id,
        requestedById: projectManager.id,
      },
    ],
  });

  await prisma.submittal.createMany({
    data: [
      {
        number: 'SUB-001',
        title: 'Structural steel shop drawings',
        description: 'Shop drawings for all structural steel members',
        status: 'APPROVED',
        projectId: project1.id,
        submittedById: projectManager.id,
        reviewedById: admin.id,
        dueDate: new Date('2024-02-15'),
      },
      {
        number: 'SUB-002',
        title: 'Concrete mix design',
        description: 'Concrete mix design for foundations and structural elements',
        status: 'UNDER_REVIEW',
        projectId: project1.id,
        submittedById: projectManager.id,
        dueDate: new Date('2024-03-20'),
      },
    ],
  });

  console.log('Created milestones, change orders, and submittals');

  await prisma.costCode.createMany({
    data: [
      { code: '01-100', description: 'General Conditions', organizationId: org.id },
      { code: '01-200', description: 'Site Work', organizationId: org.id },
      { code: '02-100', description: 'Concrete', organizationId: org.id },
      { code: '03-100', description: 'Steel', organizationId: org.id },
      { code: '05-100', description: 'MEP', organizationId: org.id },
    ],
  });

  await prisma.subcontractor.createMany({
    data: [
      {
        name: 'Bay Area Steel Erectors',
        trade: 'Structural Steel',
        email: 'info@baysteelerectors.com',
        phone: '+1-415-555-0100',
        organizationId: org.id,
      },
      {
        name: 'Premier Electrical Systems',
        trade: 'Electrical',
        email: 'projects@premierelectric.com',
        phone: '+1-212-555-0200',
        organizationId: org.id,
      },
      {
        name: 'Precision Plumbing Co',
        trade: 'Plumbing',
        email: 'work@precisionplumbing.com',
        phone: '+1-617-555-0300',
        organizationId: org.id,
      },
    ],
  });

  console.log('Created cost codes and subcontractors');

  await prisma.activityLog.createMany({
    data: [
      {
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project1.id,
        userId: admin.id,
        projectId: project1.id,
        metadata: JSON.stringify({ name: project1.name }),
      },
      {
        action: 'TASK_COMPLETED',
        entityType: 'TASK',
        entityId: 'task-1',
        userId: fieldWorker.id,
        projectId: project1.id,
        metadata: JSON.stringify({ title: 'Install foundation rebar' }),
      },
    ],
  });

  console.log('Created activity logs');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('  Admin:           admin@acme-construction.com / admin123');
  console.log('  Project Manager: pm@acme-construction.com / pm123');
  console.log('  Field Worker:    worker@acme-construction.com / worker123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
