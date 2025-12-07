import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import './TasksDueToday.css'

// --- Backend Logic (Unchanged) ---

async function fetchTasksDueToday() {
  const today = new Date().toISOString().split('T')[0]
  const start = `${today}T00:00:00Z`
  const end = `${today}T23:59:59Z`

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, related_id, due_at, is_complete')
    .gte('due_at', start)
    .lte('due_at', end)

  if (error) throw error
  return data
}

async function markComplete(taskId) {
  const { data, error } = await supabase.from('tasks').update({ is_complete: true }).eq('id', taskId)
  if (error) throw error
  return data
}

// --- Icons (SVG) ---
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const IconClock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>

// --- Main Component ---

export default function TasksDueToday() {
  const localMode = !SUPABASE_CONFIGURED

  // Local State
  const [tasksLocal, setTasksLocal] = useState(null)
  const [isLoadingLocal, setIsLoadingLocal] = useState(true)
  const [errorLocal, setErrorLocal] = useState(null)

  // Form State
  const [localTitle, setLocalTitle] = useState('')
  const [localRelatedId, setLocalRelatedId] = useState('')
  const [localDueAt, setLocalDueAt] = useState('')
  const [localType, setLocalType] = useState('call')

  // --- Logic Hooks ---

  useEffect(() => {
    if (!localMode) return
    const STORAGE_KEY = 'learnlynk_tasks'
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setTasksLocal(JSON.parse(raw))
      } else {
        const now = new Date()
        const toISOStringAt = (d) => new Date(d.getTime()).toISOString()
        const todayMid = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0))
        const seed = [
          { id: 'local-1', title: 'Call: Follow up with student', related_id: 'app-101', due_at: toISOStringAt(todayMid), is_complete: false, type: 'call' },
          { id: 'local-2', title: 'Email: Send offer letter', related_id: 'app-102', due_at: toISOStringAt(new Date(todayMid.getTime() + 1000 * 60 * 60 * 2)), is_complete: false, type: 'email' },
          { id: 'local-3', title: 'Review: Check documents', related_id: 'app-103', due_at: toISOStringAt(new Date(todayMid.getTime() + 1000 * 60 * 60 * 4)), is_complete: false, type: 'review' },
          { id: 'local-4', title: 'Call: Schedule interview', related_id: 'app-104', due_at: toISOStringAt(new Date(todayMid.getTime() + 1000 * 60 * 60 * 6)), is_complete: false, type: 'call' }
        ]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
        setTasksLocal(seed)
      }
    } catch (e) { setErrorLocal(e) }
    finally { setIsLoadingLocal(false) }
  }, [localMode])

  const saveTasksLocal = (next) => {
    const STORAGE_KEY = 'learnlynk_tasks'
    const updated = typeof next === 'function' ? next(tasksLocal) : next
    setTasksLocal(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const markCompleteLocal = (taskId) => {
    try {
      saveTasksLocal((cur) => cur.map(t => t.id === taskId ? { ...t, is_complete: true } : t))
    } catch (e) { setErrorLocal(e) }
  }

  const addTaskLocal = (e) => {
    e.preventDefault()
    try {
      const id = `local-${Date.now()}`
      const due = localDueAt ? new Date(localDueAt).toISOString() : new Date().toISOString()
      const next = [
        ...(tasksLocal || []),
        { id, title: localTitle || '(no title)', related_id: localRelatedId || 'local-app', due_at: due, is_complete: false, type: localType }
      ]
      saveTasksLocal(next)
      resetForm()
    } catch (err) { setErrorLocal(err) }
  }

  const seedDemoLocal = () => {
    const STORAGE_KEY = 'learnlynk_tasks'
    const now = new Date()
    const toISOStringAt = (d) => new Date(d.getTime()).toISOString()
    const todayMid = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0))
    const demo = [
      { id: `local-${Date.now()}-1`, title: 'Demo: Call with client A', related_id: 'app-201', due_at: toISOStringAt(todayMid), is_complete: false, type: 'call' },
      { id: `local-${Date.now()}-2`, title: 'Demo: Send onboarding email', related_id: 'app-202', due_at: toISOStringAt(new Date(todayMid.getTime() + 1000 * 60 * 60)), is_complete: false, type: 'email' }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
    setTasksLocal(demo)
  }

  const queryClient = useQueryClient()
  const { data, error, isLoading } = useQuery(['tasksDueToday'], fetchTasksDueToday, {
    retry: (failureCount, error) => {
      try {
        const msg = error?.message || (error && JSON.stringify(error)) || ''
        if (typeof msg === 'string' && msg.includes("Could not find the table 'public.tasks'")) return false
      } catch (e) { }
      return failureCount < 1
    },
    enabled: !localMode
  })

  const mutation = useMutation((taskId) => markComplete(taskId), {
    onSuccess: () => queryClient.invalidateQueries(['tasksDueToday'])
  })

  async function addTaskSupabase(e) {
    e.preventDefault()
    try {
      const due = localDueAt ? new Date(localDueAt).toISOString() : new Date().toISOString()
      const payload = { tenant_id: null, related_id: localRelatedId || null, type: localType, title: localTitle || null, due_at: due }
      const { error: insertErr } = await supabase.from('tasks').insert([payload]).select('id').single()
      if (insertErr) throw insertErr
      resetForm()
      queryClient.invalidateQueries(['tasksDueToday'])
    } catch (err) { setErrorLocal(err) }
  }

  const resetForm = () => {
    setLocalTitle('')
    setLocalRelatedId('')
    setLocalDueAt('')
    setLocalType('call')
  }

  const displayTasks = localMode ? tasksLocal : data
  const displayLoading = localMode ? isLoadingLocal : isLoading
  const displayError = localMode ? errorLocal : error

  // Filter out completed tasks for the main view to keep it clean (optional, remove filter if you want to see them)
  const activeTasks = displayTasks?.filter(t => !t.is_complete) || []

  // --- Render ---

  if (displayLoading) return <div className="loading-state">Loading tasks...</div>
  if (displayError) return <div className="error-state">Error: {String(displayError.message || displayError)}</div>

  return (
    <>
      {/* Styles moved to TasksDueToday.css for clarity and to avoid rendering as text */}

      <motion.div
        className="task-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header">
          <h2>Tasks Due Today</h2>
          <div className="sub-text">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>

        <form onSubmit={localMode ? addTaskLocal : addTaskSupabase} className="task-form">
          <input
            className="task-input"
            placeholder="What needs doing?"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            required
          />
          <input
            className="task-input"
            placeholder="App ID (opt)"
            value={localRelatedId}
            onChange={(e) => setLocalRelatedId(e.target.value)}
          />
          <select className="task-select" value={localType} onChange={(e) => setLocalType(e.target.value)}>
            <option value="call"  >Call</option>
            <option value="email" >Email</option>
            <option value="review">Review</option>
          </select>
          {/* Due date hidden in simple view, defaults to Now, or toggle visibility if needed */}
          <button type="submit" className="add-btn">
            <IconPlus />
          </button>
          <button type="button" className="add-btn seed-btn" style={{ marginLeft: 8 }} onClick={seedDemoLocal} title="Seed demo data">
            Seed Demo
          </button>
        </form>
        

        <ul className="task-list">
          <AnimatePresence mode="popLayout">
            {activeTasks.length > 0 ? (
              activeTasks.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="task-card"
                >
                  <div className="task-info">
                    <h4>{t.title || '(Untitled)'}</h4>
                    <div className="task-meta">
                      <span className="tag">{t.related_id || 'General'}</span>
                      <span className="tag" style={{ textTransform: 'capitalize' }}>{t.type || 'task'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconClock /> {new Date(t.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    className="complete-btn"
                    onClick={() => localMode ? markCompleteLocal(t.id) : mutation.mutate(t.id)}
                    disabled={mutation.isLoading}
                    title="Mark Complete"
                  >
                    <IconCheck />
                  </button>
                </motion.li>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-state"
              >
                All caught up! No tasks due.
              </motion.div>
            )}
          </AnimatePresence>
        </ul>
      </motion.div>
    </>
  )
}