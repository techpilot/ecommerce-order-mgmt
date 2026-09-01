import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Field } from '../../components/ui/field';
import { Modal } from '../../components/ui/modal';
import type { Product } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Enter a product name'),
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .regex(/^[A-Z0-9-]+$/i, 'Use letters, numbers, and dashes only'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  stockQuantity: z.coerce
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface AddProductModalProps {
  onClose: () => void;
  onCreate: (product: Product) => void;
}

export function AddProductModal({ onClose, onCreate }: AddProductModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    // TODO: replace with POST /api/v1/products once the Nest Product module is live.
    await new Promise((resolve) => setTimeout(resolve, 300));

    onCreate({
      id: crypto.randomUUID(),
      sku: values.sku.toUpperCase(),
      name: values.name,
      price: values.price,
      stockQuantity: values.stockQuantity,
      lowStockThreshold: 15,
    });
    onClose();
  }

  return (
    <Modal
      title="Add product"
      description="Add a new SKU to inventory"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          id="name"
          label="Product name"
          placeholder="Wireless Mouse"
          error={errors.name?.message}
          {...register('name')}
        />

        <Field
          id="sku"
          label="SKU"
          placeholder="SKU-011"
          error={errors.sku?.message}
          {...register('sku')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            id="price"
            label="Price (USD)"
            type="number"
            step="0.01"
            min="0"
            placeholder="24.99"
            error={errors.price?.message}
            {...register('price')}
          />
          <Field
            id="stockQuantity"
            label="Initial stock"
            type="number"
            min="0"
            placeholder="50"
            error={errors.stockQuantity?.message}
            {...register('stockQuantity')}
          />
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
