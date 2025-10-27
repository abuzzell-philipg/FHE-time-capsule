interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { number: 1, title: 'Upload Content' },
  { number: 2, title: 'Set Unlock' },
  { number: 3, title: 'Confirm' },
]

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="steps-indicator mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center flex-1">
              <div className={`step-circle w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-sm relative transition-all ${
                currentStep === step.number
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                  : currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 border-2 border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <p className={`text-sm mt-2 font-semibold transition-colors ${
                currentStep === step.number ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${
                currentStep > step.number
                  ? 'bg-green-500'
                  : currentStep === step.number
                  ? 'bg-gradient-to-r from-blue-500 to-gray-300'
                  : 'bg-gray-300'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

