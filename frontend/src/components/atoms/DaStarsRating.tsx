// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'
import { useState } from 'react'
import { HiStar } from 'react-icons/hi'
import Rating from 'react-rating'

interface DaStarsRatingProps {
  initialRating: number
  readonly?: boolean
  onChange?: (value: number) => void
  className?: string
}

const DaStarsRating = ({
  initialRating,
  readonly = false,
  onChange,
  className,
}: DaStarsRatingProps) => {
  const [rating, setRating] = useState(initialRating)
  const RatingComponent = Rating as any

  const handleRatingChange = (value: number) => {
    if (value !== rating) {
      // Only update if value has changed
      setRating(value)
      if (onChange) {
        onChange(value)
      }
    }
  }

  return (
    <RatingComponent
      className={cn('h-6 mx-2', className)}
      readonly={readonly}
      emptySymbol={<HiStar className="text-gray-300" size={24} />}
      initialRating={initialRating} // Set only on initial load
      fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
      onChange={handleRatingChange}
    />
  )
}

export default DaStarsRating
