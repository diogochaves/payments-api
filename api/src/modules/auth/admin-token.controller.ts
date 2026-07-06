import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { TokenRepository } from './token.repository';

@Controller('admin/tokens')
export class AdminTokenController {
  constructor(private readonly tokenRepository: TokenRepository) {}

  @Post()
  async create(
    @Headers('x-admin-secret') secret: string | undefined,
    @Body() dto: CreateTokenDto,
  ) {
    this.assertSecret(secret);
    const created = await this.tokenRepository.create(dto.tenantId);
    return {
      tokenId: created.tokenId,
      tenantId: created.tenantId,
      rawToken: created.rawToken,
      createdAt: created.createdAt,
    };
  }

  @Get(':tenantId')
  async list(
    @Headers('x-admin-secret') secret: string | undefined,
    @Param('tenantId') tenantId: string,
  ) {
    this.assertSecret(secret);
    const tokens = await this.tokenRepository.listByTenant(tenantId);
    return { tenantId, tokens };
  }

  @Delete(':tenantId/:tokenId')
  @HttpCode(204)
  async revoke(
    @Headers('x-admin-secret') secret: string | undefined,
    @Param('tenantId') tenantId: string,
    @Param('tokenId') tokenId: string,
  ) {
    this.assertSecret(secret);
    const found = await this.tokenRepository.revoke(tenantId, tokenId);
    if (!found) throw new NotFoundException('Token not found');
  }

  private assertSecret(provided: string | undefined): void {
    const expected = process.env.ADMIN_SECRET;
    if (!expected || !provided || provided !== expected) {
      throw new ForbiddenException('Invalid or missing X-Admin-Secret');
    }
  }
}
