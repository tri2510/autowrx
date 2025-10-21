// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listAssetsService,
  createAssetService,
  deleteAssetService,
  updateAssetService,
  shareMyAsset,
  removeUserFromShareList,
  getAssetById,
} from '@/services/asset.service.ts'
import { Asset, QueryAssetsParams } from '@/types/asset.type.ts'

export const ASSET_QUERY_KEY = {
  assets: ['assets'],
}

export const useAssets = () => {
  const queryClient = useQueryClient()

  // Fetch assets
  const useFetchAssets = (params?: QueryAssetsParams) =>
    useQuery<Asset[]>({
      queryKey: [...ASSET_QUERY_KEY.assets, params],
      queryFn: () => listAssetsService(params),
    })

  // Create a new asset
  const createAsset = useMutation({
    mutationFn: (newAsset: { name: string; type: string; data: string }) =>
      createAssetService(newAsset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY.assets })
    },
  })

  // Delete an asset
  const deleteAsset = useMutation({
    mutationFn: (id: string) => deleteAssetService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY.assets })
    },
  })

  // Update an asset
  const updateAsset = useMutation({
    mutationFn: (updatedAsset: {
      id: string
      payload: Partial<{ name: string; type: string; data: string }>
    }) => updateAssetService(updatedAsset.id, updatedAsset.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY.assets })
    },
  })

  return {
    useFetchAssets,
    createAsset,
    deleteAsset,
    updateAsset,
    shareMyAsset,
    removeUserFromShareList,
    getAssetById,
  }
}
