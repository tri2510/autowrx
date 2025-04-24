import DaText from '@/components/atoms/DaText'
import InventoryInstanceForm from './InventoryInstanceForm'
import { useNavigate, useParams } from 'react-router-dom'
import useGetInventorySchema from '@/hooks/useGetInventorySchema'
import DaLoading from '@/components/atoms/DaLoading'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { createInstanceService } from '@/services/inventory.service'
import { InventoryInstanceFormData } from '@/types/inventory.type'

const InventoryInstanceCreate = () => {
  const { schemaId } = useParams<{ schemaId: string }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    data: schema,
    isLoading,
    error: fetchingSchemaError,
  } = useGetInventorySchema(schemaId)

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center p-4">
        <DaLoading />
      </div>
    )
  }

  if (fetchingSchemaError) {
    return (
      <div className="text-center p-4 text-red-600">
        Error loading schema:{' '}
        {fetchingSchemaError.message || 'Error fetching schema.'}
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="text-center p-4">
        Schema not found or ID is invalid. Cannot create instance.
      </div>
    )
  }

  const handleSubmit: (data: InventoryInstanceFormData) => void = async (
    data,
  ) => {
    if (!schemaId) {
      toast.error('Schema ID is missing.')
      return
    }

    setLoading(true)
    try {
      // The data is already validated by RJSF based on the schema
      await createInstanceService(schemaId, data)
      toast.success(`Instance created successfully!`)
      navigate(`/inventory/schema/${schemaId}/instances/${schemaId}`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create instance.')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-lg shadow-small px-6 py-4 bg-white max-w-2xl mx-auto">
        <div className="w-full flex justify-center">
          <DaText
            variant="title"
            className="text-2xl text-da-primary-500 font-bold mb-6 text-center"
          >
            Create New Instance for Schema: {schema.name}
          </DaText>
        </div>
        <InventoryInstanceForm
          onSubmit={handleSubmit}
          error={error}
          loading={loading}
          schema={schema.schema_definition}
        />
      </div>
    </div>
  )
}

export default InventoryInstanceCreate
