import {
  Agent,
  AgentsClient,
  DoneEvent,
  ErrorEvent,
  MessageDeltaChunk,
  MessageDeltaTextContent,
  MessageStreamEvent,
  RunStep,
  RunStepDeltaChunk,
  RunStepDeltaToolCallUnion,
  RunStepStreamEvent,
  RunStreamEvent,
  ThreadRun,
} from '@azure/ai-agents';
import { DefaultAzureCredential } from '@azure/identity';
import { PassThrough, Readable } from 'stream';
import { AZURE_AI_FOUNDRY_PROJECT_ENDPOINT } from './secrets';

export const streamAgentResponse = async (agent: Agent, message: string): Promise<Readable> => {
  const client = new AgentsClient(AZURE_AI_FOUNDRY_PROJECT_ENDPOINT, new DefaultAzureCredential());
  const thread = await client.threads.create();
  const userMessage = await client.messages.create(thread.id, 'user', message);
  console.log(`User message created with id: ${userMessage.id}`);

  const streamEventMessages = await client.runs.create(thread.id, agent.id).stream();

  const stream = new PassThrough();
  stream.write('\n\n');

  // eslint-disable-next-line no-async-promise-executor
  new Promise<void>(async resolve => {
    for await (const eventMessage of streamEventMessages) {
      switch (eventMessage.event) {
        case RunStreamEvent.ThreadRunCreated:
          console.log(`ThreadRun status: ${(eventMessage.data as ThreadRun).status}`);
          break;
        case MessageStreamEvent.ThreadMessageDelta:
          {
            const messageDelta = eventMessage.data as MessageDeltaChunk;
            messageDelta.delta.content.forEach(contentPart => {
              if (contentPart.type === 'text') {
                const textContent = contentPart as MessageDeltaTextContent;
                const textValue = textContent.text?.value || 'No text';
                process.stdout.write(textValue);
                stream.write(textValue);
              }
            });
          }
          break;

        case RunStreamEvent.ThreadRunCompleted:
          console.log('Thread Run Completed');
          break;
        case ErrorEvent.Error:
          console.log(`An error occurred. Data ${eventMessage.data}`);
          break;
        case DoneEvent.Done:
          console.log('Stream completed.');
          break;
        case RunStepStreamEvent.ThreadRunStepDelta:
          {
            const { delta } = eventMessage.data as RunStepDeltaChunk;
            if (delta.stepDetails && delta.stepDetails.type === 'tool_calls' && 'toolCalls' in delta.stepDetails) {
              const toolCalls = delta.stepDetails.toolCalls as RunStepDeltaToolCallUnion[];
              toolCalls.forEach(toolCall => {
                if (toolCall.id) {
                  // This will happen only when the tool is called for the first time
                  console.log(`Tool Call:`, toolCall.type);
                  stream.write('   > Called a tool: ' + toolCall.type + '\n');
                }
              });
            }
          }
          break;
        case RunStepStreamEvent.ThreadRunStepCompleted:
          {
            const { type } = eventMessage.data as RunStep;
            if (type === 'tool_calls') {
              console.log('Tool call completed.', JSON.stringify(eventMessage));
              stream.write('   < Tool call completed.\n\n');
            }
          }
          break;
      }
    }

    stream.write('\n\n');
    stream.end();
    resolve();
  });

  return stream;
};
