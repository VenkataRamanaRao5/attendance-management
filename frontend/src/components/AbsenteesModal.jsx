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
  const [pasteText, setPasteText] = useState('')
  const [parseError, setParseError] = useState('')

  const absAsText = () => {
    const absentees = roll.filter(s => s.status === 'Absent')
    const text = [
      `Number of present: ${numberPresent}`,
      `Number of absent: ${numberAbsent}`,
      '',
      'Absentees:',
      ...absentees.map(a => `${a.roll} ${a.name}`)
    ]
    return text.join('\n')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(absAsText())
      alert('✓ Copied to clipboard')
    } catch (err) {
      alert('Failed to copy')
    }
  }

  const parseAndLoadAbsentees = () => {
    setParseError('')
    if (!pasteText.trim()) {
      setParseError('Please paste absentee data')
      return
    }

    try {
      const lines = pasteText.trim().split('\n')
      const absenteeLines = []
      let inAbsenteeSection = false

      for (const line of lines) {
        if (line.includes('Absentees:')) {
          inAbsenteeSection = true
          continue
        }
        if (inAbsenteeSection && line.trim()) {
          absenteeLines.push(line.trim())
        }
      }

      if (absenteeLines.length === 0) {
        setParseError('No absentees found in pasted data')
        return
      }

      // Parse each line as "rollno name"
      const absentRolls = absenteeLines
        .map(line => line.split(/\s+/)[0])
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
      const newPresent = roll.length - newAbsent

      onRollUpdate(updatedRoll, newPresent, newAbsent)
      setPasteText('')
      alert(`✓ Loaded ${newAbsent} absentees and ${newPresent} present`)
    } catch (err) {
      setParseError('Error parsing data: ' + err.message)
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
            <label className="block text-sm font-medium mb-2">Current Absentees Report</label>
            <pre className="bg-dark-100 p-4 rounded border border-gray-700 text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
              {absAsText()}
            </pre>
          </div>

          {/* Load Absentees Section */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-bold mb-2">Load from Pasted Data</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Paste absentee list:</label>
              <textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value)
                  setParseError('')
                }}
                placeholder="Paste absentee report here..."
                className="w-full h-24 bg-dark-100 text-dark-50 border border-gray-700 rounded px-3 py-2 font-mono text-xs"
              />
              {parseError && (
                <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-red-100 text-sm">
                  {parseError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 sticky bottom-0 bg-dark-200 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={parseAndLoadAbsentees}
              className="btn-primary flex-1"
            >
              Load from Paste
            </button>
            <button
              onClick={copyToClipboard}
              className="btn-secondary flex-1"
            >
              Copy Report
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

