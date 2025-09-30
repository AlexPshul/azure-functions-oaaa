import { AgentsClient, ConnectedAgentDetails, CreateAgentOptionalParams } from '@azure/ai-agents';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_AI_FOUNDRY_PROJECT_ENDPOINT } from './secrets';

export type ServiceAgent = { name: string; description: string; instructions: string; model: string; connectedAgents?: ServiceAgent[] };

const client = new AgentsClient(AZURE_AI_FOUNDRY_PROJECT_ENDPOINT, new DefaultAzureCredential());

type AgentOptions = Pick<CreateAgentOptionalParams, 'name' | 'description' | 'instructions' | 'tools'>;
const serviceAgentToAgentOptions = async (agent: ServiceAgent): Promise<AgentOptions> => {
  const connectedAgents = await Promise.all(agent.connectedAgents?.map(getAgent) ?? []);

  return {
    name: agent.name,
    description: agent.description,
    instructions: agent.instructions,
    tools: connectedAgents.map(({ id, name, description }) => ({
      type: 'connected_agent',
      connectedAgent: { id, name, description },
    })),
  };
};

export const findAgentByName = async (serviceAgent: ServiceAgent) => {
  console.log('Searching for agent:', serviceAgent.name);
  const agents = client.listAgents();
  for await (const agent of agents) {
    if (agent.name === serviceAgent.name) {
      const options = await serviceAgentToAgentOptions(serviceAgent);
      console.log('Found agent:', agent.name);
      return await client.updateAgent(agent.id, options);
    }
  }

  console.log('Agent not found:', serviceAgent.name);
  return null;
};

const createAgent = async (agent: ServiceAgent) => {
  const options = await serviceAgentToAgentOptions(agent);

  console.log(`Creating a new agent: ${agent.name}`);
  const createdAgent = await client.createAgent(agent.model, options);
  console.log('Created agent:', createdAgent.name);
  return createdAgent;
};

export const connectAgents = async (agent: ServiceAgent, agentsToConnect: ConnectedAgentDetails[]) => {
  const { id, tools } = await getAgent(agent);

  for (const connectedAgent of agentsToConnect) {
    const existingConnectedAgentIndex = tools
      .filter(existingTool => 'connectedAgent' in existingTool)
      .findIndex(existingTool => existingTool.connectedAgent.id === connectedAgent.id);

    if (existingConnectedAgentIndex === -1) tools.push({ type: 'connected_agent', connectedAgent });
    else tools[existingConnectedAgentIndex] = { type: 'connected_agent', connectedAgent };
  }

  return await client.updateAgent(id, { tools });
};

export const getAgent = async (agent: ServiceAgent) => (await findAgentByName(agent)) ?? (await createAgent(agent));
