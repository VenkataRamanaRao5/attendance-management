import React, { useState, useRef } from 'react'
import { authFetch } from '../utils/api'

export default function ClassManager({ onSaved }) {
  const [className, setClassName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef()

  const saveNewClass = async () => {
    if (!className.trim() || !fileInputRef.current?.files[0]) {
      alert('Please enter class name and select a file')
      return
    }

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const lines = e.target.result.split(/\r?\n/)
        const students = []

        lines.forEach(line => {
          if (line.trim()) {
            const parts = line.split(',')
            students.push({
              roll: parts[0]?.trim() || 'N/A',
              name: parts[1]?.trim() || parts[0]?.trim() || line.trim()
            })
          }
        })

        const res = await authFetch('/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ className: className.trim(), students })
        })

        if (res.ok) {
          alert('✓ Class saved successfully')
          setClassName('')
          fileInputRef.current.value = ''
          onSaved?.()
        } else {
          const data = await res.json()
          alert(`Error: ${data.error || 'Failed to save class'}`)
        }
      }
      reader.readAsText(fileInputRef.current.files[0])
    } catch (err) {
      console.error('Error saving class:', err)
      alert('Error saving class')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Add New Class</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Class Name</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g., CSE-A, SE-B, MECH-1"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Upload Student List (CSV)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            Format: Roll No, Student Name (one per line)
          </p>
        </div>

        <button
          onClick={saveNewClass}
          disabled={isLoading}
          className="btn-success w-full disabled:opacity-50"
        >
          {isLoading ? 'Uploading...' : 'Upload & Save'}
        </button>
      </div>
    </div>
  )
}
