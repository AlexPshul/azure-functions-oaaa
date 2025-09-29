import { app } from '@azure/functions';

app.get('report', {
  authLevel: 'anonymous',
  handler: async (req, context) => {
    return { status: 200 };
  },
});
