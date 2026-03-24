import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/database/client'

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { name: true, code: true },
        },
        assignee: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      code,
      priority,
      projectId,
      assigneeId,
      dueDate,
    } = body

    // Validate required fields
    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and project are required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        code: code || `TASK-${Date.now()}`,
        priority: priority || 'MEDIUM',
        status: 'NOT_STARTED',
        projectId,
        assigneeId,
        createdById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: { select: { name: true, code: true } },
        assignee: { select: { id: true, fullName: true } },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}


