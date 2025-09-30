import { initializeAgents } from '@oaaa/agents';
import { accountant, intern } from '../agent-definitions';

initializeAgents([accountant, intern]);
