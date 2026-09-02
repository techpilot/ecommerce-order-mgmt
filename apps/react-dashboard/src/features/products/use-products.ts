import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { toProduct } from '../../lib/adapters';
import type { ApiPaginated, ApiProduct } from '../../types/api-types';
import type { Product } from '../../types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await apiClient.get<ApiPaginated<ApiProduct>>(
        '/products',
        { params: { limit: 100 } },
      );
      return data.data.map(toProduct);
    },
  });
}

interface CreateProductInput {
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput): Promise<Product> => {
      const { data } = await apiClient.post<ApiProduct>('/products', input);
      return toProduct(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
