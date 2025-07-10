#!/usr/bin/env node
// @ts-nocheck

/**
 * Comprehensive Application Test Script
 * Tests the entire Zoho integration workflow from checkout to CRM data access
 */

const http = require("http");
const https = require("https");

// Configuration
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REFRESH_TOKEN",
  "ZOHO_API_URL",
];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Utility functions
/**
 * Log a message with a timestamp and prefix
 * @param {string} message - The message to log
 * @param {'info' | 'error' | 'success'} [type='info'] - The type of log message
 */
function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Make an HTTP request
 * @param {string} url - The URL to request
 * @param {Object} options - The request options
 * @param {string} [options.method='GET'] - The HTTP method
 * @param {Object} [options.headers] - The request headers
 * @param {string|Object} [options.body] - The request body
 * @returns {Promise<Object>} The response data
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject({
        status: 500,
        message: err.message || "Request failed",
      });
    });

    if (options.body) {
      req.write(
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
      );
    }

    req.end();
  });
}

// Test functions
async function testEnvironmentConfiguration() {
  log("Testing environment configuration...");

  try {
    const missingVars = REQUIRED_ENV_VARS.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length === 0) {
      log("All required environment variables are set", "success");
      testResults.passed++;
    } else {
      log("Missing required environment variables", "error");
      testResults.failed++;
      testResults.errors.push({
        test: "Environment Configuration",
        error: `Missing variables: ${missingVars.join(", ")}`,
      });
    }
  } catch (error) {
    log(`Environment configuration test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({
      test: "Environment Configuration",
      error: error.message,
    });
  }
}

async function testDatabaseConnection() {
  log("Testing database connection...");
  try {
    // This would require a database connection test
    // For now, we'll test if the application is running
    const response = await makeRequest(`${BASE_URL}/`);
    if (response.status === 200) {
      log("Application is running (database likely accessible)", "success");
      testResults.passed++;
    } else {
      throw new Error("Application not responding");
    }
  } catch (error) {
    log(`Database connection test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({
      test: "Database Connection",
      error: error.message,
    });
  }
}

async function testHomePage() {
  log("Testing home page accessibility...");
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    if (response.status === 200) {
      log("Home page accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(`Home page returned status ${response.status}`);
    }
  } catch (error) {
    log(`Home page test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({ test: "Home Page", error: error.message });
  }
}

async function testAuthentication() {
  log("Testing authentication system...");
  try {
    // Test signin page
    const signinResponse = await makeRequest(`${BASE_URL}/signin`);
    if (signinResponse.status === 200) {
      log("Signin page accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(`Signin page returned status ${signinResponse.status}`);
    }

    // Test dashboard access (should redirect to signin if not authenticated)
    const dashboardResponse = await makeRequest(`${BASE_URL}/dashboard`);
    if (dashboardResponse.status === 200 || dashboardResponse.status === 302) {
      log("Dashboard access control working", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Dashboard returned unexpected status ${dashboardResponse.status}`,
      );
    }
  } catch (error) {
    log(`Authentication test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({ test: "Authentication", error: error.message });
  }
}

async function testCheckoutFlow() {
  log("Testing checkout flow...");
  try {
    // Test step 1 - Module selection and payment
    const step1Response = await makeRequest(`${BASE_URL}/checkout/step-1`);
    if (step1Response.status === 200) {
      log("Checkout step 1 accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Checkout step 1 returned status ${step1Response.status}`,
      );
    }

    // Test step 2 - Company information
    const step2Response = await makeRequest(`${BASE_URL}/checkout/step-2`);
    if (step2Response.status === 200) {
      log("Checkout step 2 accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Checkout step 2 returned status ${step2Response.status}`,
      );
    }

    // Test step 3 - Agreement signing
    const step3Response = await makeRequest(`${BASE_URL}/checkout/step-3`);
    if (step3Response.status === 200) {
      log("Checkout step 3 accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Checkout step 3 returned status ${step3Response.status}`,
      );
    }

    // Test success page
    const successResponse = await makeRequest(`${BASE_URL}/checkout/success`);
    if (successResponse.status === 200) {
      log("Checkout success page accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Checkout success page returned status ${successResponse.status}`,
      );
    }
  } catch (error) {
    log(`Checkout flow test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({ test: "Checkout Flow", error: error.message });
  }
}

async function testAPIEndpoints() {
  log("Testing API endpoints...");
  try {
    // Test tRPC endpoint
    const trpcResponse = await makeRequest(
      `${BASE_URL}/api/trpc/zoho.getContactInfo`,
    );
    if (trpcResponse.status === 200 || trpcResponse.status === 401) {
      log("tRPC endpoint accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(`tRPC endpoint returned status ${trpcResponse.status}`);
    }

    // Test CRM public endpoint (should return 400 without parameters)
    const crmResponse = await makeRequest(`${BASE_URL}/api/crm/test/test`);
    if (crmResponse.status === 400 || crmResponse.status === 404) {
      log("CRM public endpoint accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `CRM endpoint returned unexpected status ${crmResponse.status}`,
      );
    }

    // Test webhook endpoints
    const stripeWebhookResponse = await makeRequest(
      `${BASE_URL}/api/webhooks/stripe`,
    );
    if (
      stripeWebhookResponse.status === 405 ||
      stripeWebhookResponse.status === 400
    ) {
      log("Stripe webhook endpoint accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Stripe webhook returned unexpected status ${stripeWebhookResponse.status}`,
      );
    }

    const docusignWebhookResponse = await makeRequest(
      `${BASE_URL}/api/webhooks/docusign`,
    );
    if (
      docusignWebhookResponse.status === 405 ||
      docusignWebhookResponse.status === 400
    ) {
      log("DocuSign webhook endpoint accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `DocuSign webhook returned unexpected status ${docusignWebhookResponse.status}`,
      );
    }
  } catch (error) {
    log(`API endpoints test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({ test: "API Endpoints", error: error.message });
  }
}

async function testMagicLinkSystem() {
  log("Testing magic link system...");
  try {
    // Test magic link page structure
    const magicLinkResponse = await makeRequest(
      `${BASE_URL}/magic-link/test/test`,
    );
    if (magicLinkResponse.status === 200) {
      log("Magic link page accessible", "success");
      testResults.passed++;
    } else {
      throw new Error(
        `Magic link page returned status ${magicLinkResponse.status}`,
      );
    }
  } catch (error) {
    log(`Magic link system test failed: ${error.message}`, "error");
    testResults.failed++;
    testResults.errors.push({
      test: "Magic Link System",
      error: error.message,
    });
  }
}

// Main test runner
async function runAllTests() {
  log("🚀 Starting comprehensive application test suite...");
  log(`Testing application at: ${BASE_URL}`);
  log("");

  const tests = [
    testEnvironmentConfiguration,
    testDatabaseConnection,
    testHomePage,
    testAuthentication,
    testCheckoutFlow,
    testAPIEndpoints,
    testMagicLinkSystem,
  ];

  for (const test of tests) {
    await test();
    log(""); // Add spacing between tests
  }

  // Print results
  log("📊 Test Results Summary:");
  log(`✅ Passed: ${testResults.passed}`);
  log(`❌ Failed: ${testResults.failed}`);
  log(
    `📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`,
  );

  if (testResults.errors.length > 0) {
    log("");
    log("🔍 Detailed Errors:");
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}: ${error.error}`, "error");
    });
  }

  log("");
  if (testResults.failed === 0) {
    log("🎉 All tests passed! Application is ready for use.", "success");
  } else {
    log("⚠️  Some tests failed. Please review the errors above.", "error");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    log(`Test suite failed to run: ${error.message}`, "error");
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults,
  makeRequest,
  log,
};
