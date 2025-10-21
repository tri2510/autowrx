// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Tag } from './model.type'
import { CustomPropertyType, PropertyType } from './property.type.ts'

export type VSSRelease = {
  name: string
  published_at: string
  browser_download_url: string
}

export type VehicleAPI = {
  name: string
  type: string
  uuid: string
  description: string
  parent: string | null
  isWishlist: boolean
  shortName?: string
}

export type CVI = {
  model_id: string
  cvi: string
  id: string
  created_at: string
}

export type LeafTypes = 'actuator' | 'sensor' | 'attribute' | 'branch'

export type DataTypeNum =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float'
  | 'double'
export type DataTypeString = 'string'
export type DataTypeOther = 'boolean' | 'string[]' | 'uint8[]'
export type DataType = DataTypeNum | DataTypeString | DataTypeOther

interface LeafNode<Type extends LeafTypes> {
  type: Type
  datatype: DataType
  description: string
  uuid: string
  comment?: string
}

interface LeafNodeNum<Type extends LeafTypes> extends LeafNode<Type> {
  datatype: DataTypeNum
  min?: number
  max?: number
  unit?: string
}

interface LeafNodeString<Type extends LeafTypes> extends LeafNode<Type> {
  datatype: DataTypeString
  allowed?: string[]
}

interface LeafNodeOther<Type extends LeafTypes> extends LeafNode<Type> {
  datatype: DataTypeOther
  allowed?: string[]
}

type AnyLeafNode<Type extends LeafTypes> =
  | LeafNodeNum<Type>
  | LeafNodeString<Type>
  | LeafNodeOther<Type>

type Actuator = AnyLeafNode<'actuator'>
type Sensor = AnyLeafNode<'sensor'>
type Attribute = AnyLeafNode<'attribute'> & {
  default?: number | number[] | string | string[]
}

export type LeafNodes = Actuator | Sensor | Attribute
export type AnyNode = Branch | LeafNodes

export interface Branch {
  type: 'branch'
  uuid: string
  description: string
  comment?: string
  children: {
    [key: string]: AnyNode
  }
}

export type ExtendedApi = {
  id: string
  model: string
  apiName: string
  description?: string
  type?: string
  datatype?: string | null
  skeleton: string
  tags?: Tag[]
  unit?: string | null
  created_at?: string
  isWishlist?: boolean
  custom_properties?: Record<string, CustomPropertyType>
}

export type ExtendedApiRet = Omit<ExtendedApi, 'type' | 'description'> & {
  name: string
  type: string
  description: string
}

export type ExtendedApiCreate = Omit<ExtendedApi, 'id' | 'created_at'>

export type SkeletonNode = {
  id: number
  name: string
  type: string
  parent_id: string
  content: {
    bgImage: string
    shapes: any[]
  }
  bgImage: string
}

export type Skeleton = {
  nodes: SkeletonNode[]
}
