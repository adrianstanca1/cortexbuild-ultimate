import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/database/client'

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string; companyId: string | null; organizationId: string; permissions: string[] }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {
      organizationId: user.organizationId,
    }

    if (session.user.role === 'FIELD_WORKER' || session.user.role === 'VIEWER') {
      where.members = {
        some: {
          userId: session.user.id,
        },
      }
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        company: {
          select: { name: true },
        },
        projectManager: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          select: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
            role: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            rfis: true,
            submittals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string; companyId: string | null; organizationId: string; permissions: string[] }

    if (!user.permissions?.includes('projects:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      code,
      type,
      address,
      city,
      country,
      budget,
      startDate,
      endDate,
      projectManagerId,
    } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.project.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Project code already exists' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        code,
        type: type || 'Commercial',
        address,
        city,
        country: country || 'USA',
        budget: parseFloat(budget) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNING',
        progress: 0,
        companyId: user.companyId!,
        projectManagerId: projectManagerId || user.id,
      },
      include: {
        company: { select: { name: true } },
        projectManager: { select: { id: true, fullName: true } },
      },
    })

    // Add creator as project member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        role: 'admin',
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
