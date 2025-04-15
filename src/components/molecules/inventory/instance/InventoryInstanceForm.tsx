import Form from '@rjsf/fluent-ui'
import validator from '@rjsf/validator-ajv8' // Use the AJV8 validator
import { RJSFSchema } from '@rjsf/utils'
import { DaButton } from '@/components/atoms/DaButton'
import { TbLoader } from 'react-icons/tb'
import { DaInput } from '@/components/atoms/DaInput'
import { useState } from 'react'
import { IChangeEvent } from '@rjsf/core'
import { InventoryInstanceFormData } from '@/types/inventory.type'

type InventoryInstanceFormProps = {
  schema: RJSFSchema
  onSubmit: (data: InventoryInstanceFormData) => void
  loading?: boolean
  error?: string | null
}

const InventoryInstanceForm = ({
  schema,
  onSubmit,
  loading,
  error,
}: InventoryInstanceFormProps) => {
  const [formData, setFormData] = useState({})

  const [instanceName, setInstanceName] = useState('')
  const [instanceNameError, setInstanceNameError] = useState('')
  const [triedSubmitting, setTriedSubmitting] = useState(false)

  const handleSubmit:
    | ((
        data: IChangeEvent<any, RJSFSchema, any>,
        event: React.FormEvent<any>,
      ) => void)
    | undefined = ({ formData }, e) => {
    e.preventDefault()
    setTriedSubmitting(true)
    if (!instanceName) {
      setInstanceNameError('Instance name is required.')
    } else {
      setInstanceNameError('')
      onSubmit({
        data: formData,
        name: instanceName,
      })
    }
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
          if (triedSubmitting) {
            setInstanceNameError(
              !e.target.value ? 'Instance name is required.' : '',
            )
          }
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

      <div className="border-t mt-4 mb-2" />

      <div>
        <Form
          autoComplete="off"
          formData={formData}
          schema={schema} // Pass the schema definition
          validator={validator} // Pass the validator instance
          onSubmit={handleSubmit} // Handle form submission
          onChange={({ formData }) => {
            setFormData(formData)
          }}
          disabled={loading} // Disable form while submitting
        >
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
            <div className="mt-6 flex justify-end">
              <DaButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <TbLoader className="mr-1 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Create Instance'
                )}
              </DaButton>
            </div>
          </div>
        </Form>
      </div>
    </>
  )
}

export default InventoryInstanceForm
