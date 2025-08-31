import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseKey)
    
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
    
    console.log('Supabase API response status:', response.status)
    
    return NextResponse.json({
      status: 'success',
      supabaseReachable: response.ok,
      statusCode: response.status,
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}