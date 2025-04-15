import { User } from './user.type'

export type CreateInventoryItem = {
  type: string
  data: {
    [key: string | number | symbol]: any
  }
}

export type InventoryItem = CreateInventoryItem & {
  id: string
  typeData?: any
}

export type InventoryType = {
  id: string
  name: string
  description: string
  schema: any
  created_by?: Partial<User>
  createdAt: string
  updatedAt: string
}

export interface InventorySchema {
  id: string
  name: string
  description?: string
  schema_definition: Record<string, any>
  created_by?: User
  created_at: string
}

export interface InventorySchemaPopulated {
  name: string
  id: string
}

export interface InventorySchemaFormData {
  name: string
  description?: string
  schema_definition: string
}

export type CreateInventorySchemaPayload = Omit<
  InventorySchemaFormData,
  'schema_definition'
> & {
  schema_definition: Record<string, any>
}

export type UpdateInventorySchemaPayload = Partial<
  Omit<InventorySchemaFormData, 'schema_definition'>
> & {
  schema_definition?: Record<string, any>
}

export interface InventoryInstance {
  id: string
  name: string
  schema: InventorySchemaPopulated
  data: Record<string, any>
  created_by?: User
  created_at: string
}

export type InventoryInstanceFormData = {
  name: string
  data: Record<string, any>
}

export type InventoryInstanceCreatePayload = InventoryInstanceFormData

export type InventoryInstanceUpdatePayload = Omit<
  InventoryInstanceFormData,
  'data'
> & {
  data?: Record<string, any>
}
