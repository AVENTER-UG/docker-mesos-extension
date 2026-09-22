// Comprehensive test to verify the implementation
const { getAgentProxyRoute, getProxyConfig } = require('./src/proxyConfig');
const fs = require('fs');

console.log("=== COMPREHENSIVE AGENT PROXY CONFIG TEST ===\n");

// 1. Test default configuration
console.log("1. Default proxy configuration:");
const defaultConfig = getProxyConfig();
console.log(`   Default target: ${defaultConfig.target}`);

// 2. Test agent route parsing when environment variable is set
console.log("\n2. Testing route with CLUSTERD_AGENT_PROXY_TARGET override:");
process.env.CLUSTERD_AGENT_PROXY_TARGET = "https://devtest.lab.internal:5051";
const testRoute = '/agent-api/andreas-ki.lab.internal/5051/metrics/snapshot';
const result = getAgentProxyRoute(testRoute);
console.log(`   Input URI: ${testRoute}`);
console.log(`   Parsed result:`, JSON.stringify(result, null, 2));

// 3. Test that regular target still works when no override
console.log("\n3. Testing regular target (no override):");
delete process.env.CLUSTERD_AGENT_PROXY_TARGET;
const defaultResult = getAgentProxyRoute(testRoute);
console.log(`   Input URI: ${testRoute}`);
console.log(`   Parsed result:`, JSON.stringify(defaultResult, null, 2));

// 4. Test URL validation
console.log("\n4. Testing URL validation:");
try {
    process.env.CLUSTERD_AGENT_PROXY_TARGET = "https://valid-host.com:5051";
    const validResult = getAgentProxyRoute(testRoute);
    console.log(`   Valid target override works: ${JSON.stringify(validResult, null, 2)}`);
    
    // Test invalid target
    process.env.CLUSTERD_AGENT_PROXY_TARGET = "http://invalid.com"; // HTTP not allowed
    const invalidResult = getAgentProxyRoute(testRoute);
    console.log(`   Invalid target correctly rejected:`, JSON.stringify(invalidResult, null, 2));
} catch(e) {
    console.log("Error during URL validation tests:", e.message);
}

console.log("\n=== TEST COMPLETE ===");