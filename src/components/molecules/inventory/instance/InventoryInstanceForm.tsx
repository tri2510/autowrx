import Form from '@rjsf/fluent-ui'
import validator from '@rjsf/validator-ajv8' // Use the AJV8 validator
import { RJSFSchema } from '@rjsf/utils'
import { DaButton } from '@/components/atoms/DaButton'
import { TbLoader } from 'react-icons/tb'
import { DaInput } from '@/components/atoms/DaInput'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IChangeEvent } from '@rjsf/core'
import { InventoryInstanceFormData } from '@/types/inventory.type'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import useGetInventorySchema from '@/hooks/useGetInventorySchema'
import DaLoading from '@/components/atoms/DaLoading'
import useListInventorySchemas from '@/hooks/useListInventorySchemas'
import DaTooltip from '@/components/atoms/DaTooltip'

type InventoryInstanceFormProps = {
  initialSchemaId?: string | null
  initialData?: InventoryInstanceFormData
  onSubmit: (schemaId: string, data: InventoryInstanceFormData) => void
  loading?: boolean
  error?: string | null
  onCancel?: () => void
  isUpdating?: boolean
}

const InventoryInstanceForm = ({
  initialSchemaId,
  initialData,
  onSubmit,
  loading,
  error,
  onCancel,
  isUpdating,
}: InventoryInstanceFormProps) => {
  const [formData, setFormData] = useState({})

  const [instanceName, setInstanceName] = useState('')
  const [instanceNameError, setInstanceNameError] = useState('')
  const [schemaError, setSchemaError] = useState('')
  const [triedSubmitting, setTriedSubmitting] = useState(false)

  const [schemaId, setSchemaId] = useState(initialSchemaId || undefined)
  const formRef = useRef<any>(null)

  const {
    data: schema,
    isLoading,
    error: fetchingSchemaError,
  } = useGetInventorySchema(schemaId)
  const { data: schemaList } = useListInventorySchemas()

  useEffect(() => {
    if (initialSchemaId) setSchemaId(initialSchemaId)
  }, [initialSchemaId])

  // Update state with initial data if provided
  useEffect(() => {
    if (initialData) {
      setInstanceName(initialData.name)
      setFormData(initialData.data)
    }
  }, [initialData])

  const handleSubmitBtnClick = () => {
    setTriedSubmitting(true)
    if (!instanceName) {
      setInstanceNameError('Instance name is required.')
    }
    if (!schema) setSchemaError('Schema is required.')
    else formRef.current?.submit()
  }

  const handleSubmit:
    | ((
        data: IChangeEvent<any, RJSFSchema, any>,
        event: React.FormEvent<any>,
      ) => void)
    | undefined = ({ formData }, e) => {
    e.preventDefault()
    if (!schemaId || instanceNameError || schemaError) {
      return
    }

    onSubmit(schemaId, {
      data: formData,
      name: instanceName,
    })
  }

  useEffect(() => {
    if (triedSubmitting) {
      setSchemaError(!!schema ? '' : 'Schema is required.')
      setInstanceNameError(instanceName ? '' : 'Instance name is required.')
    }
  }, [triedSubmitting, schema, instanceName])

  const OptionalTooltipWrapper = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (isUpdating) {
        return (
          <DaTooltip content="Updating schema is not allowed.">
            {children}
          </DaTooltip>
        )
      }
      return <>{children}</>
    },
    [isUpdating],
  )

  if (isLoading) {
    return (
      <div className="h-[400px] max-h-[90vh] flex items-center justify-center p-4">
        <DaLoading />
      </div>
    )
  }

  return (
    <>
      <label
        htmlFor="instance-name"
        className="block da-txt-small font-medium text-da-gray-medium mb-1"
      >
        Instance Name <span className="text-red-500">*</span>
      </label>
      <DaInput
        value={instanceName}
        onChange={(e) => {
          setInstanceName(e.target.value)
        }}
        disabled={loading}
        type="text"
        id="instance-name"
      />

      {instanceNameError && (
        <div className="text-red-600 da-txt-small mt-2">
          {instanceNameError}
        </div>
      )}

      <label
        htmlFor="schema-id"
        className="block da-txt-small font-medium
        text-da-gray-medium mb-1 mt-4"
      >
        Schema <span className="text-red-500">*</span>
      </label>
      <OptionalTooltipWrapper>
        <DaSelect
          disabled={isUpdating}
          value={schemaId}
          onValueChange={(value) => setSchemaId(value)}
        >
          {schemaList?.results.map((schema) => (
            <DaSelectItem key={schema.id} value={schema.id}>
              {schema.name}
            </DaSelectItem>
          ))}
        </DaSelect>
      </OptionalTooltipWrapper>

      {schemaError && (
        <div className="text-red-600 da-txt-small mt-2">{schemaError}</div>
      )}
      <div className="border-t mt-4 mb-2" />

      {fetchingSchemaError && (
        <div className="text-red-600 da-txt-small mt-2" role="alert">
          Error fetching default schema: {fetchingSchemaError.message}
        </div>
      )}

      {schema && (
        <div>
          <Form
            ref={formRef}
            autoComplete="off"
            formData={formData}
            schema={schema.schema_definition} // Pass the schema definition
            validator={validator} // Pass the validator instance
            onSubmit={handleSubmit} // Handle form submission
            onChange={({ formData }) => {
              setFormData(formData)
            }}
            children={true}
            disabled={loading} // Disable form while submitting
          />
        </div>
      )}
      <div className="mt-16">
        {/* Global Form Error */}
        {error && (
          <div
            className="text-red-600 da-txt-regular mt-2 text-center"
            role="alert"
          >
            Error: {error}
          </div>
        )}
        {/* Custom Submit Button */}
        <div className="mt-6 flex justify-end gap-3">
          <DaButton variant="outline-nocolor" onClick={onCancel}>
            Cancel
          </DaButton>
          <DaButton onClick={handleSubmitBtnClick} disabled={loading}>
            {loading ? (
              <>
                <TbLoader className="mr-1 animate-spin" /> Submitting...
              </>
            ) : isUpdating ? (
              'Update Instance'
            ) : (
              'Create Instance'
            )}
          </DaButton>
        </div>
      </div>
    </>
  )
}

export default InventoryInstanceForm
