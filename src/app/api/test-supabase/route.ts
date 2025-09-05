import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY



    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        url: !!supabaseUrl,
        key: !!supabaseKey
      }, { status: 500 })
    }

    // Test direct API connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })



    return NextResponse.json({
      status: 'success',
      supabaseReachable: response.ok,
      statusCode: response.status,
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error("API error:", error)

    return NextResponse.json({
      error: (error as Error).message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
