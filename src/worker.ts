import {startBackendWorkers} from './jobs/worker.js'; import {closeQueues} from './jobs/queues.js'; import {closeRedis} from './cache/redis.js';
const workers=startBackendWorkers(); console.log(`started ${workers.length} BullMQ workers`);
async function shutdown(){await Promise.all(workers.map(w=>w.close())); await closeQueues(); await closeRedis(); process.exit(0)}
process.on('SIGTERM',shutdown); process.on('SIGINT',shutdown);
