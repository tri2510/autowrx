// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import * as SelectPrimitive from '@radix-ui/react-select'
import clsx from 'clsx'
import { DaText } from './DaText'
import { cn } from '@/lib/utils'

const DaSelect = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    'value' | 'onChange' | 'defaultValue'
  > & {
    label?: string
    wrapperClassName?: string
    value?: string
    onValueChange?: (value: string) => void
    defaultValue?: string
    placeholderClassName?: string
    dataId?: string
  }
>(
  (
    {
      children,
      label,
      wrapperClassName,
      value,
      onValueChange,
      defaultValue,
      dataId,
      ...props
    },
    ref,
  ) => (
    <Select
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      <div data-id={dataId} className={cn('flex flex-col', wrapperClassName)}>
        <DaText className="!font-medium">{label}</DaText>
        {label && <div className="pb-1"></div>}
        <SelectTrigger
          ref={ref}
          {...props}
          className={cn('font-normal', props.className)}
        >
          <div className={cn(props.placeholderClassName)}>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </div>
    </Select>
  ),
)

const DaSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    helperText?: string
    helperClassName?: string
  }
>(({ className, children, helperText, helperClassName, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={clsx(
      'focus:bg-accent relative flex w-full cursor-pointer select-none rounded bg-white py-1.5 pl-2 pr-8 text-da-gray-medium outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      helperText ? 'flex' : 'items-center',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    {helperText && (
      <DaText className={cn('da-label-small pl-4', helperClassName)}>
        {helperText}
      </DaText>
    )}
  </SelectPrimitive.Item>
))
DaSelectItem.displayName = SelectPrimitive.Item.displayName

// Supported components
const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={clsx(
      'flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border border-da-gray-light bg-transparent px-2 py-2 shadow-sm focus:border-da-primary-500 disabled:opacity-50 [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <CaretSortIcon className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={clsx(
        'bg-popover relative z-[1500] max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-sm data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 data-[state=open]:animate-in data-[state=closed]:animate-out',
        className,
      )}
      position="popper"
      {...props}
    >
      <SelectPrimitive.Viewport
        className={clsx(
          'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] bg-white p-1',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))

SelectContent.displayName = SelectPrimitive.Content.displayName

export { DaSelect, DaSelectItem, SelectTrigger, SelectContent }
