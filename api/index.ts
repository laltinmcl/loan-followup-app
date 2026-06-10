const express = require('express');
const app = express();
app.get('/api/v1/health', (_req: any, res: any) => res.json({ status: 'ok' }));
export default app;
