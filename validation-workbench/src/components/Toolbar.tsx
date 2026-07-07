import { ENV_PRESETS } from '../constants';
import type { DeployEnv, RuntimeMode } from '../types';

interface ToolbarProps {
  apiUrl: string;
  apiToken: string;
  webhookToken: string;
  tenantId: string;
  runtimeMode: RuntimeMode;
  deployEnv: DeployEnv;
  onApiUrlChange: (v: string) => void;
  onApiTokenChange: (v: string) => void;
  onWebhookTokenChange: (v: string) => void;
  onTenantIdChange: (v: string) => void;
  onRuntimeModeChange: (v: RuntimeMode) => void;
  onEnvPreset: (preset: 'LOCAL' | 'STAGING') => void;
}

export function Toolbar({
  apiUrl,
  apiToken,
  webhookToken,
  tenantId,
  runtimeMode,
  deployEnv,
  onApiUrlChange,
  onApiTokenChange,
  onWebhookTokenChange,
  onTenantIdChange,
  onRuntimeModeChange,
  onEnvPreset,
}: ToolbarProps) {
  const isStaging = deployEnv === 'staging';

  return (
    <section className="toolbar">
      <div className="toolbar-title">
        <p className="eyebrow">Payments API</p>
        <h1>Testador BDD de pagamentos</h1>
      </div>

      <div className="env-switcher" role="group" aria-label="Ambiente de destino">
        {(Object.keys(ENV_PRESETS) as DeployEnv[]).map((env) => (
          <button
            key={env}
            type="button"
            className={`env-btn${deployEnv === env ? ' env-btn--active' : ''}`}
            onClick={() => onEnvPreset(env === 'local' ? 'LOCAL' : 'STAGING')}
          >
            <span className={`env-badge env-badge--${env}`}>{ENV_PRESETS[env].badge}</span>
            {ENV_PRESETS[env].label}
          </button>
        ))}
      </div>

      {!isStaging && (
        <label className="api-field runtime-field">
          <span>Runtime</span>
          <select
            value={runtimeMode}
            onChange={(event) => onRuntimeModeChange(event.target.value as RuntimeMode)}
          >
            <option value="LOCAL_MOCK">Local mock</option>
            <option value="ASAAS_SANDBOX_REAL">Asaas Sandbox real</option>
            <option value="LOCALSTACK">LocalStack</option>
          </select>
        </label>
      )}

      <label className="api-field api-field--url">
        <span>API URL</span>
        <input
          value={apiUrl}
          onChange={(event) => onApiUrlChange(event.target.value)}
          placeholder="http://localhost:3011"
          readOnly={isStaging}
        />
      </label>

      <label className="api-field">
        <span>API Token</span>
        <input
          value={apiToken}
          onChange={(event) => onApiTokenChange(event.target.value)}
          placeholder="X-Api-Token"
          type={isStaging ? 'password' : 'text'}
        />
      </label>

      {!isStaging && (
        <label className="api-field">
          <span>Webhook token</span>
          <input
            value={webhookToken}
            onChange={(event) => onWebhookTokenChange(event.target.value)}
            placeholder="ASAAS_WEBHOOK_TOKEN"
          />
        </label>
      )}

      <label className="api-field">
        <span>Tenant ID</span>
        <input
          value={tenantId}
          onChange={(event) => onTenantIdChange(event.target.value)}
          placeholder="magazine-siara"
        />
      </label>
    </section>
  );
}
