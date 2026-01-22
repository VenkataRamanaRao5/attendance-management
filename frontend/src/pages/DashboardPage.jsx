import React, { useState, useEffect } from 'react'
import { authFetch } from '../utils/api'
import ClassManager from '../components/ClassManager'
import AttendancePanel from '../components/AttendancePanel'
import RollList from '../components/RollList'
import AbsenteesModal from '../components/AbsenteesModal'
import ReportPage from './ReportPage'

export default function DashboardPage() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [roll, setRoll] = useState([])
  const [numberPresent, setNumberPresent] = useState(0)
  const [numberAbsent, setNumberAbsent] = useState(0)
  const [showManager, setShowManager] = useState(false)
  const [showAbsentees, setShowAbsentees] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceHour, setAttendanceHour] = useState('')
  const [mode, setMode] = useState('attendance') // attendance or report
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    const res = await authFetch('/classes')
    if (!res.ok) return
    const data = await res.json()
    setClasses(data)
  }

  const loadClassRoster = async (className) => {
    if (!className) return
    setIsLoading(true)
    try {
      const res = await authFetch(`/roster/${className}`)
      if (!res.ok) throw new Error('Failed to load roster')
      const data = await res.json()
      if (data?.students) {
        const students = data.students.map(s => ({ ...s, status: 'Present' }))
        setRoll(students)
        setNumberPresent(students.length)
        setNumberAbsent(0)
      }
    } catch (err) {
      console.error('Error loading roster:', err)
      alert('Failed to load roster')
    } finally {
      setIsLoading(false)
    }
  }

  const saveAttendance = async () => {
    if (!selectedClass || !attendanceDate || !attendanceHour.trim()) {
      alert('Please fill all fields')
      return
    }

    const hourList = attendanceHour
      .split(/,\s*/)
      .map(e => e.trim())

    const attendanceMap = {}
    roll.forEach(s => (attendanceMap[s.roll] = s.status))

    setIsLoading(true)
    try {
      const res = await authFetch('/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          date: attendanceDate,
          hour: hourList,
          attendanceData: attendanceMap
        })
      })
      if (res.ok) {
        alert('✓ Attendance saved!')
        setShowAbsentees(false)
      } else {
        alert('Error saving attendance')
      }
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error saving attendance')
    } finally {
      setIsLoading(false)
    }
  }

  const markAbsent = (rollNo) => {
    setRoll(r =>
      r.map(s =>
        s.roll === rollNo ? { ...s, status: 'Absent' } : s
      )
    )
    const student = roll.find(s => s.roll === rollNo)
    if (student?.status === 'Present') {
      setNumberAbsent(n => n + 1)
      setNumberPresent(n => n - 1)
    }
  }

  const markPresent = (rollNo) => {
    setRoll(r =>
      r.map(s =>
        s.roll === rollNo ? { ...s, status: 'Present' } : s
      )
    )
    const student = roll.find(s => s.roll === rollNo)
    if (student?.status === 'Absent') {
      setNumberAbsent(n => Math.max(0, n - 1))
      setNumberPresent(n => n + 1)
    }
  }

  const absAsText = () => {
    const absentees = roll.filter(s => s.status === 'Absent')
    return absentees.map(a => `${a.roll} ${a.name}`).join('\n')
  }

  const copyAbsentees = () => {
    navigator.clipboard.writeText(absAsText())
    alert('✓ Copied to clipboard')
  }

  const logout = () => {
    localStorage.clear()
    window.location.href += '/#/login'
  }

  if (mode === 'report') {
    return (
      <>
        <button
          onClick={() => setMode('attendance')}
          className="btn-secondary absolute top-4 right-4"
        >
          ← Back to Attendance
        </button>
        <ReportPage />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Header */}
      <div className="bg-dark-200 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold">
            Attendance - {localStorage.getItem('user')}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowManager(!showManager)}
              className="btn-ghost"
            >
              + Manage Classes
            </button>
            <button
              onClick={() => setMode('report')}
              className="btn-secondary"
            >
              Query Reports
            </button>
            <button
              onClick={logout}
              className="btn-danger"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Class Manager */}
        {showManager && (
          <div className="mb-6">
            <ClassManager
              onSaved={() => {
                setShowManager(false)
                fetchClasses()
              }}
            />
          </div>
        )}

        {/* Attendance Controls */}
        <AttendancePanel
          classes={classes}
          selectedClass={selectedClass}
          onClassChange={(cls) => {
            setSelectedClass(cls)
            loadClassRoster(cls)
          }}
          attendanceDate={attendanceDate}
          onDateChange={setAttendanceDate}
          attendanceHour={attendanceHour}
          onHourChange={setAttendanceHour}
          onShowAbsenteeInfo={() => setShowAbsentees(true)}
          isLoading={isLoading}
        />

        {/* Roll List */}
        {roll.length > 0 && (
          <div id="roll" className="mt-6 bg-dark-200 border border-gray-700 rounded-lg p-2 h-[100vh] overflow-y-auto">
            <RollList
              roll={roll}
              onMarkAbsent={markAbsent}
              onMarkPresent={markPresent}
            />
          </div>
        )}
      </div>

      {/* Absentees Modal */}
      <AbsenteesModal
        show={showAbsentees}
        onClose={() => setShowAbsentees(false)}
        numberPresent={numberPresent}
        numberAbsent={numberAbsent}
        roll={roll}
        onRollUpdate={(updatedRoll, newPresent, newAbsent) => {
          setRoll(updatedRoll)
          setNumberPresent(newPresent)
          setNumberAbsent(newAbsent)
        }}
        onSave={saveAttendance}
        isLoading={isLoading}
      />
    </div>
  )
}
