import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details && typeof details === 'object' ? details : {}) },
    { status }
  );
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, context: { session: NonNullable<Awaited<ReturnType<typeof getServerSession>>> }) => Promise<NextResponse>
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(request, { session });
}

export function withEntitlements(
  requiredEntitlements: string[]
) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest, context: { entitlements: string[] }) => Promise<NextResponse>
  ) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entitlements: string[] = [];

    return handler(request, { entitlements });
  };
}
