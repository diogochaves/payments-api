import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { SinglePaymentScreen } from './screens/SinglePaymentScreen';
import { MultiPaymentScreen } from './screens/MultiPaymentScreen';
import { ENV_PRESETS, LOCAL_WEBHOOK_TOKEN } from './constants';
import type { DeployEnv, RuntimeMode } from './types';

type ActiveScreen = 'single' | 'multi';

function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('single');
  const [deployEnv, setDeployEnv] = useState<DeployEnv>('local');
  const [apiUrl, setApiUrl] = useState(ENV_PRESETS.local.apiUrl);
  const [apiToken, setApiToken] = useState(ENV_PRESETS.local.apiToken);
  const [webhookToken, setWebhookToken] = useState(LOCAL_WEBHOOK_TOKEN);
  const [tenantId, setTenantId] = useState('magazine-siara');
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>('LOCAL_MOCK');

  const handleEnvPreset = (preset: 'LOCAL' | 'STAGING') => {
    const env: DeployEnv = preset === 'LOCAL' ? 'local' : 'staging';
    const presetConfig = ENV_PRESETS[env];

    setDeployEnv(env);
    setApiUrl(presetConfig.apiUrl);
    setApiToken(presetConfig.apiToken);

    if (env === 'staging') {
      setRuntimeMode('ASAAS_SANDBOX_REAL');
    } else {
      setRuntimeMode('LOCAL_MOCK');
    }
  };

  const handleRuntimeModeChange = (mode: RuntimeMode) => {
    setRuntimeMode(mode);

    if (mode === 'ASAAS_SANDBOX_REAL') {
      setWebhookToken((current) =>
        current === 'webhook-secret'
          ? 'payments-api-local-webhook-token-0001'
          : current,
      );
    }
  };

  return (
    <main className="app-shell">
      <Toolbar
        apiUrl={apiUrl}
        apiToken={apiToken}
        webhookToken={webhookToken}
        tenantId={tenantId}
        runtimeMode={runtimeMode}
        deployEnv={deployEnv}
        onApiUrlChange={setApiUrl}
        onApiTokenChange={setApiToken}
        onWebhookTokenChange={setWebhookToken}
        onTenantIdChange={setTenantId}
        onRuntimeModeChange={handleRuntimeModeChange}
        onEnvPreset={handleEnvPreset}
      />

      <nav className="screen-nav">
        <button
          type="button"
          className={`screen-tab${activeScreen === 'single' ? ' active' : ''}`}
          onClick={() => setActiveScreen('single')}
        >
          Pagamento Simples
        </button>
        <button
          type="button"
          className={`screen-tab${activeScreen === 'multi' ? ' active' : ''}`}
          onClick={() => setActiveScreen('multi')}
        >
          Múltiplos Pagamentos
        </button>
      </nav>

      {activeScreen === 'single' && (
        <SinglePaymentScreen
          apiUrl={apiUrl}
          apiToken={apiToken}
          webhookToken={webhookToken}
          tenantId={tenantId}
          runtimeMode={runtimeMode}
          deployEnv={deployEnv}
        />
      )}

      {activeScreen === 'multi' && (
        <MultiPaymentScreen
          apiUrl={apiUrl}
          apiToken={apiToken}
          webhookToken={webhookToken}
          tenantId={tenantId}
          runtimeMode={runtimeMode}
        />
      )}
    </main>
  );
}

export default App;
