import React from 'react'

export default function AttendancePanel({
  classes,
  selectedClass,
  onClassChange,
  attendanceDate,
  onDateChange,
  attendanceHour,
  onHourChange,
  onShowAbsenteeInfo,
  isLoading
}) {
  return (
    <div className="card p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Mark Attendance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
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
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Hour(s)</label>
          <input
            type="text"
            value={attendanceHour}
            onChange={(e) => onHourChange(e.target.value)}
            placeholder="e.g., 1 or 5,6,7"
            className="w-full"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={onShowAbsenteeInfo}
            disabled={isLoading}
            className="btn-success w-full disabled:opacity-50"
          >
            {isLoading ? '...' : 'Attendance & Absentee Info'}
          </button>
        </div>
      </div>
    </div>
  )
}
