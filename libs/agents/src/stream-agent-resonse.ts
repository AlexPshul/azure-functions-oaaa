import {
  AgentEventMessageStream,
  DoneEvent,
  ErrorEvent,
  MessageDeltaChunk,
  MessageDeltaTextContent,
  MessageStreamEvent,
  RunStreamEvent,
  ThreadRun,
} from '@azure/ai-agents';
import { PassThrough, Readable } from 'stream';

export const streamAgentResponse = (streamEventMessages: AgentEventMessageStream): Readable => {
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
                console.log(`Text delta received:: ${textValue}`);
                // response.push(textValue);
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
      }
    }

    stream.write('\n\n');
    stream.end();
  });

  return stream;
};
