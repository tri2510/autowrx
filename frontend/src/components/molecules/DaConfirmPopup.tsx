// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, ReactElement } from 'react'
import DaDialog from './DaDialog'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import { Label } from '../atoms/label'

interface DaConfirmPopupProps {
  onConfirm: () => void
  label: string
  title?: string
  confirmText?: string
  children: ReactElement
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const DaConfirmPopup = ({
  onConfirm,
  label,
  title,
  confirmText,
  children,
  state,
}: DaConfirmPopupProps) => {
  const selfManaged = useState(false)
  const [isOpen, setIsOpen] = state ?? selfManaged
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    if (!confirmText || inputValue === confirmText) {
      onConfirm()
      setIsOpen(false)
      setInputValue('')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setInputValue('')
  }

  return (
    <DaDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={React.cloneElement(children, { onClick: () => setIsOpen(true) })}
      dialogTitle={title}
      className="w-125 max-w-[calc(100vw-40px)]"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={confirmText ? inputValue !== confirmText : false}
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-base">{label}</p>
        {confirmText && (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              You must type{' '}
              <strong className="font-semibold">{confirmText}</strong> to
              proceed.
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder={`Type "${confirmText}" to confirm`}
            />
          </div>
        )}
      </div>
    </DaDialog>
  )
}

export default DaConfirmPopup
