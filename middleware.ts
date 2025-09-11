import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

// Define protected and public routes
const protectedRoutes = ['/student', '/parent', '/admin']
const publicRoutes = ['/login', '/signup', '/auth', '/']
const adminRoutes = ['/admin']
const parentRoutes = ['/parent']
const studentRoutes = ['/student']

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Check if current route needs protection
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))
  const isParentRoute = parentRoutes.some(route => path.startsWith(route))
  const isStudentRoute = studentRoutes.some(route => path.startsWith(route))
  
  // Decrypt session from cookie (optimistic, no DB call)
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  
  // If no session but accessing protected route, allow it for now (fallback to Supabase auth in APIs)
  // TODO: Re-enable strict session checking once all users have migrated
  // if (isProtectedRoute && !session?.userId) {
  //   const loginUrl = new URL('/login', req.nextUrl.origin)
  //   loginUrl.searchParams.set('redirect', path)
  //   return NextResponse.redirect(loginUrl)
  // }
  
  // Role-based route protection
  if (session?.userId) {
    // Redirect admin routes if not admin
    if (isAdminRoute && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl.origin))
    }
    
    // Redirect parent routes if not parent or admin
    if (isParentRoute && !['parent', 'admin'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl.origin))
    }
    
    // Redirect student routes if not student (parents/admins can access student view)
    if (isStudentRoute && !['student', 'parent', 'admin'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl.origin))
    }
    
    // Redirect authenticated users away from public auth pages
    if (isPublicRoute && ['/login', '/signup'].includes(path)) {
      // Redirect based on role
      const dashboardPath = session.role === 'admin' ? '/admin' : 
                           session.role === 'parent' ? '/parent' : '/student'
      return NextResponse.redirect(new URL(dashboardPath, req.nextUrl.origin))
    }
  }
  
  // Add session data to request headers for API routes
  if (path.startsWith('/api/') && session) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('X-User-Id', session.userId)
    requestHeaders.set('X-User-Role', session.role)
    if (session.parentId) {
      requestHeaders.set('X-User-Parent-Id', session.parentId)
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

// Configure which routes middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)' 
  ],
}