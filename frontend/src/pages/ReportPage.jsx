import React, { useState, useEffect } from 'react'
import { authFetch } from '../utils/api'

export default function ReportPage() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState(null)
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

  const generateReport = async () => {
    if (!selectedClass || !rollNo.trim() || !startDate || !endDate) {
      alert('Please fill all fields')
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        className: selectedClass,
        rollNo: rollNo.trim(),
        startDate,
        endDate
      })
      const res = await authFetch(`/report?${params}`)
      if (!res.ok) throw new Error('Failed to generate report')
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error('Error generating report:', err)
      alert('Error generating report')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-300 p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Attendance Report</h1>

        {/* Report Filters */}
        <div className="card p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full"
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.class_name} value={c.class_name}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Roll No.</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g., 01"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={isLoading}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report Results */}
        {report && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 border border-gray-700">
                <div className="text-gray-400 text-sm">Total Hours</div>
                <div className="text-3xl font-bold">{report.summary.totalHours}</div>
              </div>
              <div className="card p-4 border border-gray-700">
                <div className="text-status-present">Present Hours</div>
                <div className="text-3xl font-bold text-status-present">
                  {report.summary.presentHours}
                </div>
              </div>
              <div className="card p-4 border border-gray-700">
                <div className="text-status-absent">Absent Hours</div>
                <div className="text-3xl font-bold text-status-absent">
                  {report.summary.absentHours}
                </div>
              </div>
              <div className="card p-4 border border-gray-700">
                <div className="text-gray-400 text-sm">Attendance %</div>
                <div className="text-3xl font-bold text-blue-400">
                  {report.summary.percentage}%
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div className="card border border-gray-700 overflow-hidden">
              <div className="p-4 bg-dark-100 border-b border-gray-700">
                <h3 className="text-lg font-bold">Daily Attendance</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-200 border-b border-gray-700">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Hours & Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details && report.details.length > 0 ? (
                      report.details.map((dayRecord, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-dark-100' : 'bg-dark-200'}
                        >
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {new Date(dayRecord.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {dayRecord.entries.map((entry, entryIdx) => (
                                <span
                                  key={entryIdx}
                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                    entry.status === 'Present'
                                      ? 'bg-green-900 text-green-100'
                                      : 'bg-red-900 text-red-100'
                                  }`}
                                >
                                  Hr {entry.hour}: {entry.status === 'Present' ? '✓' : '✗'}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-4 py-3 text-center text-gray-400">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="card p-4 border border-gray-700 bg-dark-100">
              <h4 className="font-bold mb-2">Legend</h4>
              <div className="flex gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-900 text-green-100 rounded">✓</span>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-900 text-red-100 rounded">✗</span>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
