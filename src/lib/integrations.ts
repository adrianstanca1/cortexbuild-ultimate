interface IntegrationConfig {
  id: string;
  name: string;
  type: 'accounting' | 'crm' | 'email' | 'storage' | 'payment';
  enabled: boolean;
  config: Record<string, string>;
}

class IntegrationManager {
  private integrations: IntegrationConfig[] = [];

  constructor() {
    this.loadIntegrations();
  }

  private loadIntegrations() {
    this.integrations = [
      {
        id: 'xero',
        name: 'Xero Accounting',
        type: 'accounting',
        enabled: false,
        config: { apiKey: '', tenantId: '' },
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks Online',
        type: 'accounting',
        enabled: false,
        config: { clientId: '', clientSecret: '', realmId: '' },
      },
      {
        id: 'salesforce',
        name: 'Salesforce CRM',
        type: 'crm',
        enabled: false,
        config: { instanceUrl: '', accessToken: '' },
      },
      {
        id: 'sendgrid',
        name: 'SendGrid Email',
        type: 'email',
        enabled: true,
        config: { apiKey: import.meta.env.VITE_SENDGRID_API_KEY || '' },
      },
      {
        id: 'dropbox',
        name: 'Dropbox Storage',
        type: 'storage',
        enabled: false,
        config: { accessToken: '' },
      },
      {
        id: 'stripe',
        name: 'Stripe Payments',
        type: 'payment',
        enabled: false,
        config: { publishableKey: '', secretKey: '' },
      },
    ];
  }

  getIntegrations() {
    return this.integrations;
  }

  getIntegration(id: string) {
    return this.integrations.find(i => i.id === id);
  }

  async enableIntegration(id: string, config: Record<string, string>) {
    const integration = this.integrations.find(i => i.id === id);
    if (!integration) return false;

    // Validate configuration
    const isValid = await this.validateIntegration(id, config);
    if (!isValid) return false;

    integration.config = config;
    integration.enabled = true;

    return true;
  }

  disableIntegration(id: string): boolean {
    const integration = this.integrations.find(i => i.id === id);
    if (!integration) return false;
    integration.enabled = false;
    return true;
  }

  private async validateIntegration(id: string, _config: Record<string, string>): Promise<boolean> {
    return true;
  }

  async syncData(integrationId: string, data: unknown) {
    const integration = this.integrations.find(i => i.id === integrationId);
    if (!integration || !integration.enabled) {
      throw new Error('Integration not enabled');
    }

    // Sync data to integration
    // Implement sync logic based on integration type
    return { success: true, id: Date.now().toString() };
  }
}

export const integrationManager = new IntegrationManager();

// Hook for React components
export function useIntegration(integrationId: string) {
  const integration = integrationManager.getIntegration(integrationId);
  
  const enable = async (config: Record<string, string>) => {
    return integrationManager.enableIntegration(integrationId, config);
  };

  const disable = () => {
    integrationManager.disableIntegration(integrationId);
  };

  const sync = async (data: unknown) => {
    return integrationManager.syncData(integrationId, data);
  };

  return { integration, enable, disable, sync };
}
