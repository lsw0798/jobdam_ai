import { createApp } from './app.js';
import { createMockRepository } from './repositories/mockRepository.js';

const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const app = createApp({
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  repository: createMockRepository(),
});

app.listen(port, () => {
  console.info(`Jobdam mock API is listening on port ${port}`);
});
