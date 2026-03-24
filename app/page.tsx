'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ProjectsList } from '@/components/construction/ProjectsList'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading...</h2>
          <p className="text-muted-foreground">Preparing your workspace</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">CortexBuild Ultimate</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/projects" className="text-muted-foreground hover:text-foreground">Projects</a>
              <a href="/tasks" className="text-muted-foreground hover:text-foreground">Tasks</a>
              <a href="/rfi" className="text-muted-foreground hover:text-foreground">RFI</a>
              <a href="/submittals" className="text-muted-foreground hover:text-foreground">Submittals</a>
              <a href="/safety" className="text-muted-foreground hover:text-foreground">Safety</a>
              <a href="/quality" className="text-muted-foreground hover:text-foreground">Quality</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-medium">{session.user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <ProjectsList
          projects={[
            {
              id: '1',
              name: 'Downtown Office Tower',
              code: 'DOT-2024',
              type: 'Commercial',
              status: 'ACTIVE',
              budget: 5000000,
              progress: 45,
              city: 'San Francisco',
              startDate: '2024-01-15',
            },
            {
              id: '2',
              name: 'Residential Complex Phase 1',
              code: 'RCP-2024',
              type: 'Residential',
              status: 'PLANNING',
              budget: 2500000,
              progress: 10,
              city: 'Oakland',
              startDate: '2024-03-01',
            },
            {
              id: '3',
              name: 'Warehouse Expansion',
              code: 'WEX-2024',
              type: 'Industrial',
              status: 'ACTIVE',
              budget: 1200000,
              progress: 60,
              city: 'San Jose',
              startDate: '2024-02-01',
            },
          ]}
        />
      </main>
    </div>
  )
}
