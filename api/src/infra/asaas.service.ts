/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  ProviderChargeRequest,
  ProviderChargeResponse,
} from '../modules/invoices/types/invoice.types';

@Injectable()
export class AsaasService {
  private api = axios.create({
    baseURL: this.baseUrl(),
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': process.env.ASAAS_USER_AGENT ?? 'payments-api',
      access_token: process.env.ASAAS_TOKEN,
    },
  });

  async createCustomer(payload: {
    name: string;
    cpfCnpj: string;
    email?: string;
    mobilePhone?: string;
    externalReference: string;
    notificationDisabled?: boolean;
  }) {
    if (this.mockEnabled()) {
      return {
        id: `cus_mock_${payload.externalReference}`,
        object: 'customer',
        name: payload.name,
        cpfCnpj: payload.cpfCnpj,
        externalReference: payload.externalReference,
      };
    }

    try {
      const { data } = await this.api.post('/customers', payload);
      return data;
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }

  async createCharge(
    payload: ProviderChargeRequest,
  ): Promise<ProviderChargeResponse> {
    if (this.mockEnabled()) {
      const id = `pay_mock_${payload.externalReference}`;
      return {
        id,
        status: 'PENDING',
        invoiceUrl: `https://sandbox.asaas.com/i/${id}`,
        payload: {
          id,
          object: 'payment',
          status: 'PENDING',
          invoiceUrl: `https://sandbox.asaas.com/i/${id}`,
          ...payload,
        },
      };
    }

    try {
      const { data } = await this.api.post('/payments', payload);
      return {
        id: data.id,
        status: data.status,
        invoiceUrl: data.invoiceUrl,
        bankSlipUrl: data.bankSlipUrl,
        transactionReceiptUrl: data.transactionReceiptUrl,
        payload: data,
      };
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }

  async createPayment(payload: any, eventEmitter) {
    try {
      const { data } = await this.api.post('/paymentLinks', payload);
      return data;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      eventEmitter.emit('payments.invoice.psp_not_integrated', {
        timestamp: new Date(),
        payload: { message: error.message },
      });
      return null;
    }
  }

  private baseUrl(): string {
    const url = process.env.ASAAS_URL ?? 'https://api-sandbox.asaas.com/v3';
    return url.endsWith('/v3') ? url : `${url.replace(/\/$/, '')}/v3`;
  }

  private mockEnabled(): boolean {
    return process.env.ASAAS_MOCK === 'true';
  }

  private extractErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error.message : 'Unknown Asaas error';
    }

    const errors = error.response?.data?.errors;

    if (Array.isArray(errors) && errors.length > 0) {
      return errors
        .map((item) => `${item.code}: ${item.description}`)
        .join('; ');
    }

    return error.message;
  }
}
