import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { toOrder } from '../../lib/adapters';
import type { ApiOrder } from '../../types/api-types';
import type { Order } from '../../types';

const ORDERS_KEY = ['orders'];

export function useOrders() {
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: async (): Promise<Order[]> => {
      const { data } = await apiClient.get<ApiOrder[]>('/orders');
      return data.map(toOrder);
    },
    refetchInterval: 5000, // simple polling for status changes (shipped/cancelled etc.)
    refetchIntervalInBackground: false,
  });
}

interface CreateOrderInput {
  customerName: string;
  items: { productId: string; quantity: number }[];
  optimisticPreview: { items: Order['items']; totalAmount: number };
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<Order> => {
      const { customerName, items } = input; // strip the preview before sending
      const { data } = await apiClient.post<ApiOrder>('/orders', {
        customerName,
        items,
      });
      return toOrder(data);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ORDERS_KEY });
      const previousOrders = queryClient.getQueryData<Order[]>(ORDERS_KEY);

      const optimisticOrder: Order = {
        id: `optimistic-${Date.now()}`,
        customerName: input.customerName,
        items: input.optimisticPreview.items,
        totalAmount: input.optimisticPreview.totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Order[]>(ORDERS_KEY, (old) => [
        optimisticOrder,
        ...(old ?? []),
      ]);

      return { previousOrders };
    },
    onError: (_err, _input, context) => {
      if (context?.previousOrders)
        queryClient.setQueryData(ORDERS_KEY, context.previousOrders);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}
