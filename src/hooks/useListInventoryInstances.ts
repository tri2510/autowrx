import { listInventoryInstancesService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

type UseListInventoryInstancesParams = {
  page?: number
  limit?: number
  search?: string
  schema?: string
  enabled?: boolean
}

const useListInventoryInstances = (params: UseListInventoryInstancesParams) => {
  const { page = 1, limit = 10, search, schema, enabled = true } = params

  const options: Record<string, any> = {
    page,
    limit,
    // search,
    schema,
  }

  for (const key in options) {
    if (options[key] === undefined || options[key] === '') {
      delete options[key]
    }
  }

  return useQuery({
    queryKey: ['inventoryInstanceList', options],
    queryFn: () => listInventoryInstancesService(options),
    placeholderData: (previousData) => previousData, // Keep existing data while fetching new page
    enabled, // Control query execution
  })
}

export default useListInventoryInstances
