// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useRef } from 'react'

interface DaImportFileProps {
  onFileChange: (file: File) => void
  children: React.ReactNode
  accept?: string
  className?: string
}

const DaImportFile: React.FC<DaImportFileProps> = ({
  onFileChange,
  children,
  accept = '.png, .jpg, .jpeg',
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileChange(file)
    }
  }

  return (
    <>
      <div className={className} onClick={handleClick}>
        {children}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}

export default DaImportFile
