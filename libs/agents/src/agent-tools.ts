import { ConnectedAgentDetails } from '@azure/ai-agents';
import { app } from '@azure/functions';
import { getAgent, ServiceAgent } from './get-agent';

const agentsCache: ConnectedAgentDetails[] = [];

export const getInitializedAgents = () => agentsCache;

export const updateAgents = async (serviceAgents: ServiceAgent[]) => {
  agentsCache.length = 0;
  const createdAgents = await Promise.all(serviceAgents.map(getAgent));
  agentsCache.push(...createdAgents.map(agent => ({ id: agent.id, name: agent.name || '', description: agent.description || '' })));

  return agentsCache;
};

export const initializeAgents = (serviceAgents: ServiceAgent[]) => {
  app.setup({ enableHttpStream: true });

  app.get('get-agent-definitions', {
    route: 'agents',
    handler: async () => {
      if (agentsCache.length === serviceAgents.length) return { status: 200, jsonBody: agentsCache };

      const agents = await updateAgents(serviceAgents);

      return { status: 200, jsonBody: agents };
    },
  });
};
