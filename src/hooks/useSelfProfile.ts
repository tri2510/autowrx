// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { getSelfService } from '@/services/user.service'
import useAuthStore from '@/stores/authStore'

const useSelfProfileQuery = () => {
  const getValidToken = useAuthStore((state) => state.getValidToken)
  const validToken = getValidToken()

  return useQuery({
    queryKey: ['getSelf'],
    queryFn: getSelfService,
    enabled: !!validToken?.token // Only run query if user has a valid token
  })
}

export default useSelfProfileQuery
