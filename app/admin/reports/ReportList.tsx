'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deletePostAdmin, deleteReplyAdmin } from '../actions'

type Report = {
  id: string
  reason: string
  created_at: string
  reporter_id: string
  post_id: string | null
  reply_id: string | null
  posts: { id: string; content: string; author_id: string; created_at: string } | null
  replies: { id: string; content: string; author_id: string; created_at: string; post_id: string } | null
}

export function ReportList({ initialReports }: { initialReports: Report[] }) {
  const supabase = createClient()
  const [reports, setReports] = useState(initialReports)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDismiss(reportId: string) {
    setBusy(reportId)
    setError(null)
    const { data, error } = await supabase
      .from('reports')
      .update({ status: 'dismissed' })
      .eq('id', reportId)
      .select('id')

    if (error || !data?.length) {
      setError('Could not dismiss the report. Check that you are signed in as admin.')
    } else {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    }
    setBusy(null)
  }

  async function handleDelete(report: Report) {
    const label = report.reply_id ? 'reply' : 'post'
    if (!confirm(`Permanently delete this ${label}?`)) return
    setBusy(report.id)
    setError(null)

    try {
      if (report.post_id && report.posts) {
        await deletePostAdmin(report.post_id)
      } else if (report.reply_id && report.replies) {
        await deleteReplyAdmin(report.reply_id, `Reported: ${report.reason}`)
      } else {
        throw new Error('The content is already gone.')
      }

      // Remove this report and any other report about the same content
      setReports((prev) =>
        prev.filter(
          (r) =>
            r.id !== report.id &&
            !(report.post_id && r.post_id === report.post_id) &&
            !(report.reply_id && r.reply_id === report.reply_id)
        )
      )
    } catch (err: any) {
      setError('Failed to delete: ' + (err.message || 'Unknown error'))
    }
    setBusy(null)
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-10 text-center text-[14px] text-[#6b6b6b]">
        No pending reports. The campus is clean! 🎉
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-[#4a1d27] bg-[#2a1218] px-4 py-3 text-[13px] text-[#ff8a9b]">
          {error}
        </div>
      )}

      {reports.map((report) => {
        const isReply = !!report.reply_id
        const content = isReply ? report.replies?.content : report.posts?.content
        const disabled = busy === report.id

        return (
          <div key={report.id} className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#2a2a2a] px-2.5 py-0.5 text-[12px] font-medium text-white">
                {isReply ? 'Reply' : 'Post'}
              </span>
              <span className="text-[12px] text-[#6b6b6b]">
                {new Date(report.created_at).toLocaleString()}
              </span>
            </div>

            <p className="mt-3 text-[13px] text-[#ff4d6d]">Reason: {report.reason}</p>

            <div className="mt-3 rounded-xl bg-[#222] p-3">
              <p className="whitespace-pre-wrap break-words text-[14px] leading-snug text-[#f3f3f3]">
                {content || '[Content already deleted]'}
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleDismiss(report.id)}
                disabled={disabled}
                className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
              >
                Dismiss
              </button>
              {content && (
                <button
                  onClick={() => handleDelete(report)}
                  disabled={disabled}
                  className="rounded-full bg-[#ff3040] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#e02a39] disabled:opacity-50"
                >
                  Delete {isReply ? 'reply' : 'post'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}