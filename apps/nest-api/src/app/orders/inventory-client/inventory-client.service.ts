import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface StockResponse {
  sku: string;
  name: string;
  stockQuantity: number;
}

export interface ReserveResponse {
  sku: string;
  stockQuantity: number;
  reserved: number;
}

interface InventoryErrorBody {
  error?: string;
  sku?: string;
}

@Injectable()
export class InventoryClientService {
  private readonly logger = new Logger(InventoryClientService.name);

  constructor(private readonly http: HttpService) {}

  async getStock(sku: string): Promise<StockResponse> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<StockResponse>(`/inventory/${sku}`),
      );
      return data;
    } catch (err) {
      throw this.translateError(err, sku);
    }
  }

  /**
   * Reserves (decrements) stock for a single SKU. The .NET service performs the
   * check-and-decrement as one atomic conditional UPDATE, so a successful response
   * here means the stock has genuinely been committed — there's nothing left to
   * confirm on our side.
   */
  async reserve(sku: string, quantity: number): Promise<ReserveResponse> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<ReserveResponse>('/inventory/reserve', {
          sku,
          quantity,
        }),
      );
      return data;
    } catch (err) {
      throw this.translateError(err, sku);
    }
  }

  private translateError(err: unknown, sku: string): Error {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const body = err.response?.data as InventoryErrorBody | undefined;

      if (status === 404) {
        return new NotFoundException(
          `Product with SKU "${sku}" was not found in inventory.`,
        );
      }
      if (status === 409) {
        return new ConflictException(`Insufficient stock for SKU "${sku}".`);
      }
      if (status === 400) {
        return new ConflictException(
          body?.error ??
            `Inventory service rejected the request for SKU "${sku}".`,
        );
      }

      // Network error, timeout, DNS failure, or the .NET service is down/5xx.
      this.logger.error(
        `Inventory service call failed for SKU ${sku}: ${err.message}`,
      );
      return new ServiceUnavailableException(
        'Inventory service is currently unavailable. Please try again shortly.',
      );
    }

    this.logger.error(
      `Unexpected error calling inventory service for SKU ${sku}`,
      err as Error,
    );
    return new ServiceUnavailableException(
      'Inventory service is currently unavailable.',
    );
  }
}
