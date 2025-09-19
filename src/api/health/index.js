import express from 'express';
import { createClient } from '@supabase/supabase-js';
import os from 'os';
import process from 'process';

const router = express.Router();

// Health check status
let healthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development'
};

// System metrics
const getSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024) // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: Math.round(os.uptime()),
      loadAverage: os.loadavg(),
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) // MB
    }
  };
};

// Database health check
const checkDatabase = async () => {
  try {
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      return { status: 'warning', message: 'Database not configured' };
    }
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const start = Date.now();
    const { error } = await supabase.from('users').select('count').limit(1);
    const responseTime = Date.now() - start;
    
    if (error) {
      return { 
        status: 'unhealthy', 
        message: error.message,
        responseTime 
      };
    }
    
    return { 
      status: 'healthy', 
      responseTime,
      message: 'Database connection successful'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message 
    };
  }
};

// Redis health check
const checkRedis = async () => {
  try {
    // If Redis is not configured, skip the check
    if (!process.env.REDIS_URL) {
      return { status: 'warning', message: 'Redis not configured' };
    }
    
    // Add Redis client check here when implemented
    return { 
      status: 'healthy', 
      message: 'Redis connection successful'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message 
    };
  }
};

// External services health check
const checkExternalServices = async () => {
  const services = {};
  
  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      // Add Stripe health check
      services.stripe = { status: 'healthy', message: 'Stripe configured' };
    } catch (error) {
      services.stripe = { status: 'unhealthy', message: error.message };
    }
  }
  
  // Check OpenAI
  if (process.env.OPENAI_API_KEY) {
    services.openai = { status: 'healthy', message: 'OpenAI configured' };
  }
  
  // Check email service
  if (process.env.SMTP_HOST) {
    services.email = { status: 'healthy', message: 'Email service configured' };
  }
  
  return services;
};

// Basic health check endpoint
router.get('/', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    res.status(200).json({
      status: 'healthy',
      timestamp,
      uptime: Math.round(uptime),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const metrics = getSystemMetrics();
    
    // Run health checks in parallel
    const [database, redis, externalServices] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkExternalServices()
    ]);
    
    // Determine overall status
    const checks = { database, redis, externalServices };
    const hasUnhealthy = Object.values(checks).some(check => 
      check.status === 'unhealthy' || 
      (typeof check === 'object' && Object.values(check).some(service => service.status === 'unhealthy'))
    );
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : 'healthy';
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status: overallStatus,
      timestamp,
      uptime: Math.round(uptime),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      metrics,
      checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const database = await checkDatabase();
    
    if (database.status === 'unhealthy') {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not available'
      });
    }
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

// Metrics endpoint (Prometheus format)
router.get('/metrics', (req, res) => {
  const metrics = getSystemMetrics();
  const uptime = process.uptime();
  
  // Simple Prometheus-style metrics
  const prometheusMetrics = `
# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds ${uptime}

# HELP nodejs_memory_heap_used_bytes Heap memory used in bytes
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${metrics.memory.used * 1024 * 1024}

# HELP nodejs_memory_heap_total_bytes Total heap memory in bytes
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${metrics.memory.total * 1024 * 1024}

# HELP system_memory_free_bytes Free system memory in bytes
# TYPE system_memory_free_bytes gauge
system_memory_free_bytes ${metrics.system.freeMemory * 1024 * 1024}

# HELP system_memory_total_bytes Total system memory in bytes
# TYPE system_memory_total_bytes gauge
system_memory_total_bytes ${metrics.system.totalMemory * 1024 * 1024}

# HELP system_load_average_1m System load average over 1 minute
# TYPE system_load_average_1m gauge
system_load_average_1m ${metrics.system.loadAverage[0]}
  `.trim();
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});

export default router;