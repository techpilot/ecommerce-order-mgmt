import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Field } from '../../components/ui/field';
import { Modal } from '../../components/ui/modal';
import { useCreateProduct } from './use-products';

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
}

export function AddProductModal({ onClose }: AddProductModalProps) {
  const createProduct = useCreateProduct();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    try {
      await createProduct.mutateAsync({
        name: values.name,
        sku: values.sku.toUpperCase(),
        price: values.price,
        stockQuantity: values.stockQuantity,
      });
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('sku', { message: 'A product with this SKU already exists.' });
      } else {
        setError('root', {
          message: 'Could not add the product. Please try again.',
        });
      }
    }
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
        {errors.root?.message && (
          <p className="text-sm text-status-cancelled">{errors.root.message}</p>
        )}
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
