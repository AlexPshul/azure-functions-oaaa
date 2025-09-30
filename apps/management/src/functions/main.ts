import { ConnectedAgentDetails } from '@azure/ai-agents';
import { app } from '@azure/functions';
import { connectAgents, initializeAgents, streamAgentResponse } from '@oaaa/agents';
import axios from 'axios';
import { theBigBoss } from '../agent-definitions';

const financeDepartmentAgentsUrl = 'http://localhost:7072/api/agents';

type PurchaseRequest = {
  name: string;
  description: string;
  reasoning: string;
  price: number;
};

initializeAgents([theBigBoss]);

app.post('check-purchase-request', {
  handler: async (req, context) => {
    const { name, description, reasoning, price } = (await req.json()) as PurchaseRequest;
    context.log('Requested purchase');
    context.log({ name, description, reasoning, price });

    const { data: financeAgents } = await axios.get<ConnectedAgentDetails[]>(financeDepartmentAgentsUrl);
    const theBigBossAgent = await connectAgents(theBigBoss, financeAgents);

    const responseStream = await streamAgentResponse(
      theBigBossAgent,
      `
      A purchase request has been made with the following details:
      Name: ${name}
      Description: ${description}
      Reasoning: ${reasoning}
      Price: $${price}

      As the Big Boss, please approve or deny this request based on the company's budget and priorities. Provide a brief explanation for your decision.
      If this request is ridiculous, please respond with a snorky comment to humiliate the requester.
      If the request is reasonable but can't be approved right away, provide an explanation with numbers on why this is not approved right away.
    `,
    );

    return { status: 200, body: responseStream };
  },
});
