import { useState } from 'react'
import { format, addMinutes, addHours, addDays, addMonths, addYears } from 'date-fns'
import { validateUnlockTime } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

interface Step2UnlockTimeProps {
  onNext: (unlockTime: Date) => void
  onBack: () => void
}

const quickTimes = [  
  { label: '1 hour', emoji: '☕', value: () => addHours(new Date(), 1) },
  { label: '1 day', emoji: '🌙', value: () => addDays(new Date(), 1) },
  { label: '7 days', emoji: '📅', value: () => addDays(new Date(), 7) },
  { label: '1 month', emoji: '🌸', value: () => addMonths(new Date(), 1) },
  { label: '6 months', emoji: '🎄', value: () => addMonths(new Date(), 6) },
  { label: '1 year', emoji: '🎂', value: () => addYears(new Date(), 1) },
  { label: '3 years', emoji: '🌟', value: () => addYears(new Date(), 3) },
]

export default function Step2UnlockTime({ onNext, onBack }: Step2UnlockTimeProps) {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  const handleQuickSelect = (getTime: () => Date) => {
    const time = getTime()
    setSelectedTime(time)
    setCustomDate(format(time, 'yyyy-MM-dd'))
    setCustomTime(format(time, 'HH:mm'))
  }

  // const handleCustomChange = () => {
  //   if (!customDate || !customTime) return
    
  //   const datetime = new Date(`${customDate}T${customTime}`)
  //   setSelectedTime(datetime)
  // }

  const handleNext = () => {
    if (!selectedTime) {
      alert('Please select unlock time')
      return
    }
    
    const validation = validateUnlockTime(selectedTime)
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    
    onNext(selectedTime)
  }

  const getTimeDiff = () => {
    if (!selectedTime) return null
    const now = new Date()
    const diff = selectedTime.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return { days, hours, total: diff }
  }

  const timeDiff = getTimeDiff()

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Step 2: Set Unlock Time</span>
      </h2>
      
      {/* Quick select */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Quick Select
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickTimes.map((item) => (
            <button
              key={item.label}
              onClick={() => handleQuickSelect(item.value)}
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-900 font-medium group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.emoji}</div>
              <div className="text-sm">{item.label}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-sm text-gray-500 font-medium">or custom time</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>
      
      {/* Custom datetime */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Precise Unlock Time
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-2">Date</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value)
                if (customTime) {
                  const datetime = new Date(`${e.target.value}T${customTime}`)
                  setSelectedTime(datetime)
                }
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              max={format(addYears(new Date(), 3), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-2">Time</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => {
                setCustomTime(e.target.value)
                if (customDate) {
                  const datetime = new Date(`${customDate}T${e.target.value}`)
                  setSelectedTime(datetime)
                }
              }}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-900"
            />
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
         <span>Min 1 hour, Max 3 years</span>
        </div>
      </div>
      
      {/* Preview */}
      {selectedTime && timeDiff && timeDiff.total > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Unlock Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Unlock:</span>
                  <span className="font-medium text-gray-900">
                    {format(selectedTime, 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Lock Duration:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {timeDiff.days > 0 ? `${timeDiff.days} days ` : ''}
                    {timeDiff.hours} hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </span>
        </button>
        
        <button
          onClick={handleNext}
          disabled={!selectedTime}
          className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <span className="flex items-center gap-2">
            <span>Next: Confirm Creation</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}

