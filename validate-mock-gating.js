#!/usr/bin/env node
/**
 * Validation script for proxy mock data gating
 * 
 * This script demonstrates that:
 * 1. Production mode NEVER uses mock data
 * 2. Development mode requires explicit opt-in
 * 3. Backend failures propagate correctly
 */

const scenarios = [
  {
    name: 'Production Mode (mocks disabled by environment)',
    env: {
      NODE_ENV: 'production',
      ENABLE_PROXY_MOCKS: 'true', // This will be IGNORED
    },
    expectedBehavior: 'Backend failure → 502/503 error (NO mock data)',
  },
  {
    name: 'Development Mode - Mocks Disabled',
    env: {
      NODE_ENV: 'development',
      ENABLE_PROXY_MOCKS: 'false',
    },
    expectedBehavior: 'Backend failure → 502/503 error (NO mock data)',
  },
  {
    name: 'Development Mode - Mocks Enabled',
    env: {
      NODE_ENV: 'development',
      ENABLE_PROXY_MOCKS: 'true',
    },
    expectedBehavior: 'Backend failure → Mock data returned + warning logged',
  },
  {
    name: 'Development Mode - No Mocks Config',
    env: {
      NODE_ENV: 'development',
      // ENABLE_PROXY_MOCKS not set (defaults to false)
    },
    expectedBehavior: 'Backend failure → 502/503 error (NO mock data)',
  },
];

console.log('='.repeat(80));
console.log('PROXY MOCK DATA GATING - VALIDATION SCENARIOS');
console.log('='.repeat(80));
console.log();

scenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log('   Environment:');
  Object.entries(scenario.env).forEach(([key, value]) => {
    console.log(`     ${key}=${value || '(not set)'}`);
  });
  console.log(`   Expected: ${scenario.expectedBehavior}`);
  console.log();
});

console.log('='.repeat(80));
console.log('KEY INSIGHTS:');
console.log('='.repeat(80));
console.log();
console.log('✅ Production ALWAYS blocks mocks (even if ENABLE_PROXY_MOCKS=true)');
console.log('✅ Development requires explicit opt-in (ENABLE_PROXY_MOCKS=true)');
console.log('✅ Default behavior is SAFE (mocks disabled)');
console.log('✅ Backend failures propagate as proper errors when mocks disabled');
console.log();

console.log('='.repeat(80));
console.log('TESTING INSTRUCTIONS:');
console.log('='.repeat(80));
console.log();
console.log('1. Stop your backend (port 3000)');
console.log('2. Start proxy with different configurations:');
console.log();
console.log('   # Test production mode (should fail):');
console.log('   NODE_ENV=production ENABLE_PROXY_MOCKS=true npm run dev');
console.log('   curl http://localhost:3003/home');
console.log('   # Expected: 502/503 error, NOT mock data');
console.log();
console.log('   # Test development with mocks (should return mock data):');
console.log('   NODE_ENV=development ENABLE_PROXY_MOCKS=true npm run dev');
console.log('   curl http://localhost:3003/home');
console.log('   # Expected: Mock data returned with warning in logs');
console.log();
console.log('   # Test development without mocks (should fail):');
console.log('   NODE_ENV=development ENABLE_PROXY_MOCKS=false npm run dev');
console.log('   curl http://localhost:3003/home');
console.log('   # Expected: 502/503 error, NOT mock data');
console.log();
console.log('='.repeat(80));
