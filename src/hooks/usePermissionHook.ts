// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { checkPermissionService } from '@/services/permission.service'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/stores/authStore'

const usePermissionHook = (...params: [string, string?][]) => {
  const getValidToken = useAuthStore((state) => state.getValidToken)
  const validToken = getValidToken()

  const { data } = useQuery({
    queryKey: ['permissions', params],
    queryFn: () => checkPermissionService(params),
    enabled: !!validToken?.token // Only run query if user has a valid token
  })
  return data || Array(params.length).fill(false)
}

export default usePermissionHook
