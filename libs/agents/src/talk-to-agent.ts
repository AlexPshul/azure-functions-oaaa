import { AgentsClient } from '@azure/ai-agents';
import { app } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_AI_FOUNDRY_PROJECT_ENDPOINT } from './secrets';
import { streamAgentResponse } from './stream-agent-resonse';

const findAgentByName = async (agentsClient: AgentsClient, agentName: string) => {
  const agents = agentsClient.listAgents();
  for await (const agent of agents) {
    if (agent.name === agentName) {
      return agent;
    }
  }

  return null;
};

export const registerTalkToAgentEndpoint = () => {
  app.setup({ enableHttpStream: true });

  app.post('message-agent', {
    route: 'agent/{agentName}',
    handler: async (req, context) => {
      const { message } = (await req.json()) as { message: string };
      if (!message) return { status: 400, body: 'Message is required' };

      const client = new AgentsClient(AZURE_AI_FOUNDRY_PROJECT_ENDPOINT, new DefaultAzureCredential());
      const agent = await findAgentByName(client, req.params['agentName']);

      if (!agent) return { status: 404, body: 'Agent not found' };

      const thread = await client.threads.create();
      const userMessage = await client.messages.create(thread.id, 'user', message);
      console.log(`User message created with id: ${userMessage.id}`);

      const streamEventMessages = await client.runs.create(thread.id, agent.id).stream();
      const stream = streamAgentResponse(streamEventMessages);

      return { status: 200, body: stream };
    },
  });
};
