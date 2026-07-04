import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AsaasService } from '../../../infra/asaas.service';

@Controller('sandbox/asaas')
export class AsaasSandboxController {
  constructor(private readonly asaasService: AsaasService) {}

  @Post('payments/:providerPaymentId/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(@Param('providerPaymentId') providerPaymentId: string) {
    this.assertSandboxEnabled();

    if (!providerPaymentId?.trim()) {
      throw new BadRequestException('providerPaymentId is required');
    }

    try {
      return (await this.asaasService.confirmSandboxPayment(
        providerPaymentId,
      )) as Record<string, unknown>;
    } catch (error) {
      this.mapProviderError(error);
    }
  }

  private assertSandboxEnabled() {
    const asaasUrl = process.env.ASAAS_URL ?? '';

    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Asaas Sandbox operations are disabled in production',
      );
    }

    if (process.env.ASAAS_MOCK === 'true') {
      throw new BadRequestException(
        'Asaas Sandbox operations require ASAAS_MOCK=false',
      );
    }

    if (!asaasUrl.includes('api-sandbox.asaas.com')) {
      throw new ForbiddenException(
        'Asaas Sandbox operations require ASAAS_URL to point to sandbox',
      );
    }
  }

  private mapProviderError(error: unknown): never {
    const providerError = error as Error & { status?: number };
    const message =
      error instanceof Error
        ? error.message
        : 'Asaas Sandbox confirmation failed';

    if (message.includes('invalid_action')) {
      throw new ConflictException(message);
    }

    if (providerError.status === 400) {
      throw new BadRequestException(message);
    }

    if (providerError.status === 401 || providerError.status === 403) {
      throw new ForbiddenException(message);
    }

    if (providerError.status === 404) {
      throw new BadRequestException(message);
    }

    throw error;
  }
}
