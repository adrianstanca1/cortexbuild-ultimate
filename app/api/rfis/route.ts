import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/database/client'

// GET /api/rfis - List RFIs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    const rfis = await prisma.rFI.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        requestedBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
        attachments: true,
        _count: {
          select: { attachments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ rfis })
  } catch (error) {
    console.error('Error fetching RFIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RFIs' },
      { status: 500 }
    )
  }
}

// POST /api/rfis - Create RFI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      subject,
      question,
      priority,
      projectId,
      assignedToId,
    } = body

    // Validate required fields
    if (!subject || !projectId || !question) {
      return NextResponse.json(
        { error: 'Subject, question, and project are required' },
        { status: 400 }
      )
    }

    // Get next RFI number for this project
    const projectRfis = await prisma.rFI.findMany({
      where: { projectId },
      orderBy: { number: 'desc' },
      take: 1,
    })

    const nextNumber = projectRfis.length > 0 ? projectRfis[0].number + 1 : 1

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { code: true },
    })

    const rfiNumber = `${project?.code}-RFI-${String(nextNumber).padStart(3, '0')}`

    const rfi = await prisma.rFI.create({
      data: {
        number: nextNumber,
        rfiNumber,
        subject,
        question,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        projectId,
        requestedById: session.user.id,
        assignedToId,
      },
      include: {
        project: { select: { name: true, code: true } },
        requestedBy: { select: { id: true, fullName: true } },
      },
    })

    return NextResponse.json({ rfi }, { status: 201 })
  } catch (error) {
    console.error('Error creating RFI:', error)
    return NextResponse.json(
      { error: 'Failed to create RFI' },
      { status: 500 }
    )
  }
}
