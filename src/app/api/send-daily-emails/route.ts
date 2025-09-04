import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { format } from 'date-fns'

export async function GET(request: Request) {
  // This endpoint should be called by a cron job at 8:00 AM daily
  // You can use services like Vercel Cron Jobs, Railway, or Supabase Edge Functions

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check if Resend API key is available
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 }
    )
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const supabase = await createClient()

    // Get all students with their parent's assignments for today
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data: students } = await supabase
      .from('profiles')
      .select('id, email, name, parent_id')
      .eq('role', 'student')

    if (!students || students.length === 0) {
      return NextResponse.json({ message: 'No students found' })
    }

    const emailPromises = students.map(async (student: { id: string; name: string; parent_id: string; email?: string }) => {
      if (!student.parent_id) return null

      // Get today's assignments for this student
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('parent_id', student.parent_id)
        .eq('due_date', today)

      if (!assignments || assignments.length === 0) return null

      // Create email HTML
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .assignment { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4F46E5; }
              .assignment h3 { margin: 0 0 10px 0; color: #4F46E5; }
              .links { margin-top: 10px; }
              .link { display: inline-block; margin: 5px 0; color: #4F46E5; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Today's Assignments</h1>
                <p>Hi ${student.name || 'Student'}! Here are your assignments for ${format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>
              <div class="content">
                ${assignments.map((assignment: { title: string; links?: Array<{ url: string; title: string }> }) => `
                  <div class="assignment">
                    <h3>${assignment.title}</h3>
                    ${assignment.links && assignment.links.length > 0 ? `
                      <div class="links">
                        <strong>Resources:</strong><br>
                        ${assignment.links.map(link =>
        `<a href="${link.url}" class="link">📎 ${link.title}</a><br>`
      ).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
                <p style="margin-top: 20px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student" 
                     style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View All Assignments
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>MySchool - Homeschool Assignment Manager</p>
              </div>
            </div>
          </body>
        </html>
      `

      // Send email
      return resend.emails.send({
        from: 'MySchool <noreply@myschool.app>',
        to: student.email,
        subject: `Today's Assignments - ${format(new Date(), 'MMMM dd, yyyy')}`,
        html: emailHtml,
      })
    })

    const emailResults = await Promise.all(emailPromises)
    const successfulEmails = emailResults.filter(result => result !== null)

    // Create notifications for successfully sent emails
    if (successfulEmails.length > 0) {
      const notificationPromises = students.map(async (student: { id: string; name: string; parent_id: string }) => {
        return supabase
          .from('notifications')
          .insert({
            user_id: student.id,
            title: 'Daily Assignment Email Sent',
            message: `Your daily assignment email for ${format(new Date(), 'MMMM dd, yyyy')} has been sent to ${student.email}`,
            type: 'success',
            metadata: {
              action: 'email_sent',
              email: student.email,
              date: format(new Date(), 'yyyy-MM-dd')
            }
          })
      })

      await Promise.all(notificationPromises)
    }

    return NextResponse.json({
      message: 'Daily emails sent successfully',
      studentsCount: students.length,
      emailsSent: successfulEmails.length
    })
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to send daily emails' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // Alternative POST endpoint for manual trigger or testing
  return GET(request)
}
