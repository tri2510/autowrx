import DaText from '@/components/atoms/DaText'
import InventoryInstanceForm from './InventoryInstanceForm'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { createInstanceService } from '@/services/inventory.service'
import { InventoryInstanceFormData } from '@/types/inventory.type'

const InventoryInstanceCreate = () => {
  const [params] = useSearchParams()
  const querySchemaId = params.get('schemaId')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (
    schemaId: string,
    data: InventoryInstanceFormData,
  ) => {
    if (!schemaId) {
      toast.error('Schema ID is missing.')
      return
    }

    setLoading(true)
    try {
      // The data is already validated by RJSF based on the schema
      const instance = await createInstanceService(schemaId, data)
      toast.success(`Instance created successfully!`)
      if (instance && instance.id) {
        navigate(`/inventory/instance/${instance.id}`)
      } else {
        toast.error('Failed to retrieve instance ID. Please try again.')
      }
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
            Create New Instance
          </DaText>
        </div>
        <InventoryInstanceForm
          onCancel={() => navigate(`/inventory/instance`)}
          onSubmit={handleSubmit}
          error={error}
          loading={loading}
          initialSchemaId={querySchemaId}
        />
      </div>
    </div>
  )
}

export default InventoryInstanceCreate
