import { getInventoryInstanceService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

const useGetInventoryInstance = (id?: string) => {
  return useQuery({
    queryKey: ['inventoryInstance', id],
    queryFn: () => getInventoryInstanceService(id!),
    enabled: !!id, // Only run the query if id is available
  })
}

export default useGetInventoryInstance
