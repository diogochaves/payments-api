import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface ApiTokenEntry {
  tokenId: string;
  tenantId: string;
  revoked: boolean;
}

@Injectable()
export class ApiTokenService implements OnModuleInit {
  private readonly logger = new Logger(ApiTokenService.name);
  private readonly tokens = new Map<string, ApiTokenEntry>();

  onModuleInit() {
    this.loadTokens();
  }

  private loadTokens(): void {
    const raw = process.env.API_TOKENS;
    if (raw) {
      try {
        const entries = JSON.parse(raw) as Array<{
          token: string;
          tokenId: string;
          tenantId: string;
          revoked?: boolean;
        }>;
        for (const entry of entries) {
          this.tokens.set(entry.token, {
            tokenId: entry.tokenId,
            tenantId: entry.tenantId,
            revoked: entry.revoked ?? false,
          });
        }
        this.logger.log(
          `Loaded ${entries.length} API token(s) from API_TOKENS`,
        );
      } catch {
        this.logger.error(
          'Failed to parse API_TOKENS env var — no tokens loaded from config',
        );
      }
    }

    const localToken = process.env.API_TOKEN_LOCAL;
    if (localToken) {
      this.tokens.set(localToken, {
        tokenId: 'local-dev',
        tenantId: 'local',
        revoked: false,
      });
      this.logger.log('Local dev token registered (tokenId: local-dev)');
    }
  }

  validate(rawToken: string): ApiTokenEntry | null {
    const entry = this.tokens.get(rawToken);
    if (!entry) return null;
    if (entry.revoked) return null;
    return entry;
  }
}
