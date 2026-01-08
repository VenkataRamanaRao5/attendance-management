import React from 'react'

export default function RollList({ roll = [], onMarkAbsent, onMarkPresent }) {
  return (
    <div className="space-y-0">
      {roll.map((student, idx) => (
        <div
          key={student.roll}
          id={`entry${idx}`}
          className={`entry ${idx % 2 === 0 ? 'odd' : 'even'} ${
            student.status === 'Absent' ? 'absent' : ''
          }`}
        >
          <span className="rollno">{student.roll}</span>
          <span className="name">{student.name}</span>
          <button
            className={`attendance-mark ${
              student.status === 'Absent' ? 'absent' : ''
            }`}
            onClick={() => onMarkAbsent(student.roll)}
            title="Mark Absent"
          >
            A
          </button>
          <button
            className={`attendance-mark ${
              student.status === 'Present' ? 'present' : ''
            }`}
            onClick={() => onMarkPresent(student.roll)}
            title="Mark Present"
          >
            P
          </button>
        </div>
      ))}
    </div>
  )
}
