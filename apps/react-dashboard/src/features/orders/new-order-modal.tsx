import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Field } from '../../components/ui/field';
import { Modal } from '../../components/ui/modal';
import { formatCurrency } from '../../lib/format';
import { useProducts } from '../products/use-products';
import { useCreateOrder } from './use-orders';

const schema = z.object({
  customerName: z.string().min(2, 'Enter a customer name'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Select a product'),
        quantity: z.coerce.number().int().min(1, 'Min 1'),
      }),
    )
    .min(1, 'Add at least one item'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface NewOrderModalProps {
  onClose: () => void;
}

export function NewOrderModal({ onClose }: NewOrderModalProps) {
  const { data: products = [] } = useProducts();
  const createOrder = useCreateOrder();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      items: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const total = watchedItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? sum + product.price * (Number(item.quantity) || 0) : sum;
  }, 0);

  async function onSubmit(values: FormValues) {
    const previewItems = values.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    try {
      await createOrder.mutateAsync({
        customerName: values.customerName,
        items: values.items,
        optimisticPreview: { items: previewItems, totalAmount: total },
      });
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('root', {
          message: 'One of the selected items is out of stock.',
        });
      } else if (isAxiosError(err) && err.response?.status === 404) {
        setError('root', {
          message: 'One of the selected products no longer exists.',
        });
      } else {
        setError('root', {
          message: 'Could not create the order. Please try again.',
        });
      }
    }
  }

  return (
    <Modal
      title="New order"
      description="Select products and quantities"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          id="customerName"
          label="Customer name"
          placeholder="Amara Chukwu"
          error={errors.customerName?.message}
          {...register('customerName')}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Items</span>

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <select
                className="flex-1 rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
                {...register(`items.${index}.productId` as const)}
              >
                <option value="">Select product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatCurrency(product.price)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                className="w-20 rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
                {...register(`items.${index}.quantity` as const)}
              />

              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Remove item"
                className="rounded-sm p-2 text-ink-faint hover:bg-paper hover:text-status-cancelled disabled:opacity-40"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}

          {(errors.items?.root?.message || errors.root?.message) && (
            <p className="text-xs text-status-cancelled">
              {errors.items?.root?.message || errors.root?.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => append({ productId: '', quantity: 1 })}
            className="self-start text-sm font-medium text-accent hover:text-accent-hover"
          >
            + Add item
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-soft">Total</span>
          <span className="font-mono-data text-base font-medium text-ink">
            {formatCurrency(total)}
          </span>
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
