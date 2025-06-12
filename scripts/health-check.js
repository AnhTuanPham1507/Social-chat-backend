#!/usr/bin/env node

/**
 * Health Check Script for Social Chat Backend
 * This script performs comprehensive health checks for the application
 */

const http = require('http');
const process = require('process');

// Configuration
const HEALTH_CHECK_CONFIG = {
  host: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.PORT || 3000,
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
  endpoint: '/health'
};

/**
 * Performs HTTP health check
 */
function performHealthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HEALTH_CHECK_CONFIG.host,
      port: HEALTH_CHECK_CONFIG.port,
      path: HEALTH_CHECK_CONFIG.endpoint,
      method: 'GET',
      timeout: HEALTH_CHECK_CONFIG.timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const healthData = JSON.parse(data);
            resolve({
              status: 'healthy',
              statusCode: res.statusCode,
              data: healthData
            });
          } catch (error) {
            resolve({
              status: 'healthy',
              statusCode: res.statusCode,
              data: { message: 'OK' }
            });
          }
        } else {
          reject({
            status: 'unhealthy',
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}: ${data}`
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        status: 'unhealthy',
        statusCode: 0,
        error: `Connection error: ${error.message}`
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        status: 'unhealthy',
        statusCode: 0,
        error: `Health check timeout after ${HEALTH_CHECK_CONFIG.timeout}ms`
      });
    });

    req.end();
  });
}

/**
 * Main health check execution
 */
async function main() {
  try {
    console.log(`🏥 Performing health check on ${HEALTH_CHECK_CONFIG.host}:${HEALTH_CHECK_CONFIG.port}${HEALTH_CHECK_CONFIG.endpoint}`);
    
    const result = await performHealthCheck();
    
    console.log('✅ Health check passed:', {
      status: result.status,
      statusCode: result.statusCode,
      timestamp: new Date().toISOString()
    });
    
    if (result.data) {
      console.log('📊 Health data:', result.data);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Health check failed:', {
      status: error.status,
      statusCode: error.statusCode,
      error: error.error,
      timestamp: new Date().toISOString()
    });
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('🛑 Health check terminated by SIGTERM');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('🛑 Health check terminated by SIGINT');
  process.exit(1);
});

// Execute health check
if (require.main === module) {
  main();
}

module.exports = {
  performHealthCheck,
  HEALTH_CHECK_CONFIG
}; 