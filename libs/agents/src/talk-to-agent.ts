import { AgentsClient } from '@azure/ai-agents';
import { app } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_AI_FOUNDRY_PROJECT_ENDPOINT } from './secrets';

export const registerTalkToAgentEndpoint = () => {
  app.post('message-agent', {
    route: 'agent/{agentName}',
    handler: async (req, context) => {
      const client = new AgentsClient(AZURE_AI_FOUNDRY_PROJECT_ENDPOINT, new DefaultAzureCredential());
      const agent = await client.getAgent('asst_9YURWxgHzRYTvobQfTJAmMmw');

      return { status: 200, body: agent.name };
    },
  });
};
