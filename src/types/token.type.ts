// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export type Token = {
  token: string
  expires: string
}

export type User = {
  id: string
  name: string
  email: string
  provider: string
  provider_data: any[]
  created_at: string
}

export type AuthToken = {
  user: User
  tokens: {
    access: Token
    refresh?: Token
  }
}
