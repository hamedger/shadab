import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import { fetchAdminMenuItems } from '../lib/admin/menuAdmin'

export function useAdminMenu(locationId: string = DEFAULT_LOCATION_ID) {
  return useQuery({
    queryKey: ['adminMenu', locationId],
    queryFn: () => fetchAdminMenuItems(locationId),
    staleTime: 30 * 1000,
  })
}

export function useInvalidateAdminMenu() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['adminMenu'] })
    client.invalidateQueries({ queryKey: ['menu'] })
  }
}
