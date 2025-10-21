// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbCircleCheckFilled, TbLoader, TbLock } from 'react-icons/tb'
import { partialUpdateUserService } from '@/services/user.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const FormUpdatePassword = ({}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [changed, setChanged] = useState(false)
  const { data: profile } = useSelfProfileQuery()

  const validate = (password: string, confirmPassword: string) => {
    const errors = []
    if (password !== confirmPassword)
      errors.push('"password" and "confirm password" must be the same')
    return errors
  }

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!profile) return
    e.preventDefault()
    try {
      setLoading(true)
      const [password, confirmPassword] = [
        e.currentTarget.password.value,
        e.currentTarget.confirmPassword.value,
      ]
      const results = validate(password, confirmPassword)
      if (results.length > 0) {
        setError(results.join(', '))
        return
      }

      await partialUpdateUserService({ password })
      setChanged(true)
      setError('')
      await new Promise(() =>
        setTimeout(() => {
          // eslint-disable-next-line no-self-assign
          window.location.href = '/'
        }, 3000),
      )
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data.message || 'Something went wrong')
        return
      }
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={resetPassword}
      className="w-[30vw] lg:w-[25vw] max-h-[80vh] bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Change Password
      </DaText>

      {changed ? (
        <>
          <DaText className="block mt-4">
            Reset password success! Please login with your new password.
          </DaText>
          <TbCircleCheckFilled className="text-6xl text-green-500 mx-auto my-4" />
        </>
      ) : (
        <>
          {/* Content */}
          <DaInput
            name="password"
            placeholder="Password"
            label="Password"
            className="mt-4"
            Icon={TbLock}
            iconBefore
            type="password"
            iconSize={18}
          />

          <DaInput
            name="confirmPassword"
            placeholder="Confirm password"
            label="Confirm password"
            className="mt-4"
            Icon={TbLock}
            iconBefore
            type="password"
            iconSize={18}
          />

          {/* Error */}
          {error && (
            <DaText variant="small" className="mt-2 block text-red-500">
              {error}
            </DaText>
          )}
          {/* Action */}
          <DaButton
            disabled={loading}
            type="submit"
            variant="solid"
            className="w-full mt-6"
          >
            {loading && <TbLoader className="animate-spin text-lg mr-2" />}
            Change Password
          </DaButton>
        </>
      )}
    </form>
  )
}

export default FormUpdatePassword
