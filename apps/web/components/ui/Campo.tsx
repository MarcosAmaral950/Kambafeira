'use client'
import { InputHTMLAttributes, forwardRef } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  erro?: string
}

export const Campo = forwardRef<HTMLInputElement, Props>(
  ({ label, erro, id, className = '', ...resto }, ref) => {
    const campoId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={campoId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          ref={ref}
          id={campoId}
          className={`
            w-full px-4 py-3 border rounded-lg text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-400
            ${erro ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...resto}
        />
        {erro && <p className="text-xs text-red-600">{erro}</p>}
      </div>
    )
  }
)
Campo.displayName = 'Campo'
