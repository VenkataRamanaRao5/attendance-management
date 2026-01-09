import React, { useState } from 'react'

export default function AbsenteesModal({
  show,
  onClose,
  numberPresent,
  numberAbsent,
  roll,
  onRollUpdate,
  onSave,
  isLoading
}) {
  const [editText, setEditText] = useState('')
  const [parseError, setParseError] = useState('')

  // Encoding: converts roll state to text format
  const absAsText = () => {
    const absentees = roll.filter(s => s.status === 'Absent')
    return absentees.map(a => `${a.roll} ${a.name}`).join('\n')
  }

  // Decoding: reverse of absAsText - parse text back to roll state
  const parseAndLoadAbsentees = () => {
    setParseError('')
    
    try {
      const lines = editText.trim().split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        setParseError('Please enter absentee data')
        return
      }

      // Parse each line as "rollno name"
      const absentRolls = lines
        .map(line => line.trim().split(/\s+/)[0])
        .filter(Boolean)

      if (absentRolls.length === 0) {
        setParseError('Could not parse roll numbers')
        return
      }

      // Update roll with parsed absentees
      const updatedRoll = roll.map(s => ({
        ...s,
        status: absentRolls.includes(s.roll) ? 'Absent' : 'Present'
      }))

      const newAbsent = absentRolls.length
      const newPresent = updatedRoll.length - newAbsent

      onRollUpdate(updatedRoll, newPresent, newAbsent)
      alert(`✓ Loaded ${newAbsent} absentees`)
    } catch (err) {
      setParseError('Error parsing: ' + err.message)
    }
  }

  // Load initial text when modal opens
  React.useEffect(() => {
    if (show) {
      setEditText(absAsText())
      setParseError('')
    }
  }, [show, roll])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(absAsText())
      alert('✓ Copied to clipboard')
    } catch (err) {
      alert('Failed to copy')
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-dark-200 rounded-lg border border-gray-700 max-w-2xl w-full my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 sticky top-0">
          <h2 className="text-xl font-bold">Attendance & Absentee Info</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-100 p-4 rounded border border-gray-700">
              <div className="text-gray-400 text-sm">Present</div>
              <div className="text-3xl font-bold text-status-present">
                {numberPresent}
              </div>
            </div>
            <div className="bg-dark-100 p-4 rounded border border-gray-700">
              <div className="text-gray-400 text-sm">Absent</div>
              <div className="text-3xl font-bold text-status-absent">
                {numberAbsent}
              </div>
            </div>
          </div>

          {/* Current Absentees Display */}
          <div>
            <label className="block text-sm font-medium mb-2">Absentees (Roll No Name, one per line)</label>
            <textarea
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value)
                setParseError('')
              }}
              placeholder="01 John Smith
02 Jane Doe
04 Bob Johnson"
              className="w-full h-48 bg-dark-100 text-dark-50 border border-gray-700 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {parseError && (
              <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-red-100 text-sm">
                {parseError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 sticky bottom-0 bg-dark-200 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={parseAndLoadAbsentees}
              className="btn-primary flex-1"
            >
              Load from Text
            </button>
            <button
              onClick={copyToClipboard}
              className="btn-secondary flex-1"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={isLoading}
              className="btn-success flex-1 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Attendance'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

