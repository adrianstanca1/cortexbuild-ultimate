// CortexBuild Ultimate - Database Seed Script
// Seeds organizations, companies, users, and projects

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Hash password
  const hashedPassword = await bcrypt.hash('CortexBuild123!', 12)
  
  // Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Construction Inc',
      slug: 'demo',
      industry: 'Construction',
      plan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      isActive: true,
    },
  })
  console.log('✅ Organization:', org.name)
  
  // Create AI Model Config (Ollama local LLM)
  const aiConfig = await prisma.aiModelConfig.create({
    data: {
      organizationId: org.id,
      provider: 'OLLAMA',
      model: 'llama3.1:8b',
      apiEndpoint: 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 4096,
      isActive: true,
      isDefault: true,
    },
  })
  console.log('✅ AI Config:', aiConfig.model)
  
  // Create Company
  const company = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'CortexBuild Operations',
      address: '123 Construction Ave',
      city: 'San Francisco',
      country: 'USA',
      email: 'ops@cortexbuild.com',
    },
  })
  console.log('✅ Company:', company.name)
  
  // Create Users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@cortexbuild.com' },
      update: {},
      create: {
        email: 'admin@cortexbuild.com',
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        passwordHash: hashedPassword,
        companyId: company.id,
        organizationId: org.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@cortexbuild.com' },
      update: {},
      create: {
        email: 'manager@cortexbuild.com',
        firstName: 'Project',
        lastName: 'Manager',
        fullName: 'Project Manager',
        role: 'PROJECT_MANAGER',
        passwordHash: hashedPassword,
        companyId: company.id,
        organizationId: org.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'field@cortexbuild.com' },
      update: {},
      create: {
        email: 'field@cortexbuild.com',
        firstName: 'Field',
        lastName: 'Worker',
        fullName: 'Field Worker',
        role: 'FIELD_WORKER',
        passwordHash: hashedPassword,
        companyId: company.id,
        organizationId: org.id,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Users:', users.length)
  
  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Downtown Office Tower',
        code: 'DOT-2024',
        type: 'Commercial',
        address: '555 Market St',
        city: 'San Francisco',
        country: 'USA',
        status: 'ACTIVE',
        startDate: new Date('2024-01-15'),
        budget: 5000000,
        companyId: company.id,
        projectManagerId: users[1].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Residential Complex Phase 1',
        code: 'RCP-2024',
        type: 'Residential',
        address: '100 Oak St',
        city: 'Oakland',
        country: 'USA',
        status: 'PLANNING',
        startDate: new Date('2024-03-01'),
        budget: 2500000,
        companyId: company.id,
        projectManagerId: users[1].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Warehouse Expansion',
        code: 'WEX-2024',
        type: 'Industrial',
        address: '2000 Industrial Blvd',
        city: 'San Jose',
        country: 'USA',
        status: 'ACTIVE',
        startDate: new Date('2024-02-01'),
        budget: 1200000,
        companyId: company.id,
        projectManagerId: users[0].id,
      },
    }),
  ])
  console.log('✅ Projects:', projects.length)
  
  // Create Tasks
  const tasks = []
  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      tasks.push(
        await prisma.task.create({
          data: {
            title: `Task ${i + 1} - ${project.name}`,
            code: `${project.code}-T${i + 1}`,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            projectId: project.id,
            assigneeId: users[2].id,
            createdById: users[1].id,
            dueDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
            percentComplete: Math.floor(Math.random() * 100),
          },
        })
      )
    }
  }
  console.log('✅ Tasks:', tasks.length)
  
  // Create Milestones
  for (const project of projects) {
    await prisma.milestone.create({
      data: {
        name: 'Foundation Complete',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
        projectId: project.id,
        createdById: users[1].id,
      },
    })
    await prisma.milestone.create({
      data: {
        name: 'Structural Complete',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'pending',
        projectId: project.id,
        createdById: users[1].id,
      },
    })
  }
  console.log('✅ Milestones created')
  
  // Create RFI
  const rfi = await prisma.rFI.create({
    data: {
      number: 1,
      rfiNumber: 'DOT-2024-RFI-001',
      subject: 'Foundation specifications',
      question: 'What are the load-bearing requirements for the foundation?',
      status: 'OPEN',
      priority: 'HIGH',
      projectId: projects[0].id,
      requestedById: users[2].id,
    },
  })
  console.log('✅ RFI:', rfi.rfiNumber)
  
  // Create Safety Incident
  const incident = await prisma.safetyIncident.create({
    data: {
      incidentNumber: 'INC-2024-001',
      title: 'Minor fall from scaffold',
      description: 'Worker slipped and fell from 6ft scaffold',
      severity: 'low',
      status: 'reported',
      occurrenceDate: new Date(),
      location: 'Downtown Office Tower - Floor 2',
      projectId: projects[0].id,
      reportedById: users[2].id,
    },
  })
  console.log('✅ Safety Incident:', incident.incidentNumber)
  
  // Create Weather Log
  await prisma.weatherLog.create({
    data: {
      date: new Date(),
      temperature: 18.5,
      conditions: 'clear',
      projectId: projects[0].id,
      recordedById: users[2].id,
    },
  })
  console.log('✅ Weather log created')
  
  // Create Daily Log
  await prisma.dailyLog.create({
    data: {
      logNumber: 'DOT-2024-DL-001',
      date: new Date(),
      workPerformed: 'Foundation excavation and forming',
      headcount: 12,
      projectId: projects[0].id,
      createdById: users[2].id,
    },
  })
  console.log('✅ Daily log created')
  
  // Create Document
  const doc = await prisma.document.create({
    data: {
      number: 'DOC-001',
      title: 'Project Specifications',
      type: 'general',
      fileSize: BigInt(1024 * 1024),
      mimeType: 'application/pdf',
      cloudStoragePath: '/documents/specs.pdf',
      projectId: projects[0].id,
      uploadedById: users[1].id,
    },
  })
  console.log('✅ Document:', doc.number)
  
  console.log('\n🎉 Seeding complete!')
  console.log('\n📊 Summary:')
  console.log('   - 1 Organization')
  console.log('   - 1 Company')
  console.log('   - 3 Users (admin, manager, field)')
  console.log('   - 3 Projects')
  console.log('   - 15 Tasks')
  console.log('   - 6 Milestones')
  console.log('   - 1 RFI')
  console.log('   - 1 Safety Incident')
  console.log('   - Weather & Daily logs')
  console.log('   - 1 Document')
  console.log('\n🔐 Default credentials:')
  console.log('   Email: admin@cortexbuild.com')
  console.log('   Password: CortexBuild123!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
