import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useResetCallback(initialValue: any, resetFn: () => any) {
    const [prevValue, setPrevValue] = useState(initialValue)
    if (prevValue !== initialValue) {
        resetFn()
        setPrevValue(initialValue)
    }
}

