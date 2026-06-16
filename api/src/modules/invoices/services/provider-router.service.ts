import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProvider } from '../types/invoice.types';

@Injectable()
export class ProviderRouterService {
  resolve(requestedProvider?: PaymentProvider): PaymentProvider {
    const provider =
      requestedProvider ??
      (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProvider) ??
      'ITAU';

    if (!this.enabledProviders().includes(provider)) {
      throw new BadRequestException(`Provider ${provider} is not enabled`);
    }

    if (provider === 'ITAU') {
      throw new BadRequestException(
        'Provider ITAU is not implemented in this gateway yet',
      );
    }

    return provider;
  }

  private enabledProviders(): PaymentProvider[] {
    const raw = process.env.ENABLED_PAYMENT_PROVIDERS ?? 'ASAAS';
    return raw
      .split(',')
      .map((provider) => provider.trim().toUpperCase())
      .filter(Boolean) as PaymentProvider[];
  }
}
