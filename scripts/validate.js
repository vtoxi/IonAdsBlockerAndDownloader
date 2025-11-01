#!/usr/bin/env node
/**
 * IonBlock - Validation Script
 * Validates extension code before publishing
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const ERRORS = [];
const WARNINGS = [];

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}IonBlock Extension Validator${colors.reset}\n`);

// 1. Validate manifest.json
function validateManifest() {
  console.log('→ Validating manifest.json...');
  
  const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    ERRORS.push('manifest.json not found');
    return;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required fields
    const required = ['manifest_version', 'name', 'version', 'description'];
    required.forEach(field => {
      if (!manifest[field]) {
        ERRORS.push(`manifest.json missing required field: ${field}`);
      }
    });
    
    // Check manifest version
    if (manifest.manifest_version !== 3) {
      ERRORS.push('manifest_version must be 3');
    }
    
    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      ERRORS.push('version must be in format X.Y.Z');
    }
    
    // Check for CSP
    if (!manifest.content_security_policy) {
      WARNINGS.push('No content_security_policy defined');
    }
    
    // Check icons
    if (!manifest.icons || !manifest.icons['16'] || !manifest.icons['48'] || !manifest.icons['128']) {
      ERRORS.push('Missing required icon sizes (16, 48, 128)');
    }
    
    console.log(`${colors.green}✓ manifest.json valid${colors.reset}`);
  } catch (e) {
    ERRORS.push(`manifest.json parse error: ${e.message}`);
  }
}

// 2. Check required files
function checkRequiredFiles() {
  console.log('\n→ Checking required files...');
  
  const required = [
    'background.js',
    'content_script.js',
    'popup.html',
    'popup.js',
    'popup.css',
    'utils/storage.js',
    'utils/messaging.js',
    'core/adBlocker.js',
    'core/mediaDownloader.js',
    'rules/ad_rules.json',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png'
  ];
  
  required.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      ERRORS.push(`Required file missing: ${file}`);
    }
  });
  
  console.log(`${colors.green}✓ Required files checked${colors.reset}`);
}

// 3. Check for console.log in production
function checkConsoleLogs() {
  console.log('\n→ Checking for console.log statements...');
  
  const jsFiles = [
    'background.js',
    'content_script.js',
    'popup.js',
    'core/adBlocker.js',
    'core/mediaDownloader.js'
  ];
  
  jsFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/console\.log\(/g);
      if (matches && matches.length > 0) {
        WARNINGS.push(`${file} contains ${matches.length} console.log statement(s)`);
      }
    }
  });
  
  console.log(`${colors.green}✓ Console log check complete${colors.reset}`);
}

// 4. Validate ad rules
function validateAdRules() {
  console.log('\n→ Validating ad rules...');
  
  const rulesPath = path.join(PROJECT_ROOT, 'rules/ad_rules.json');
  
  if (!fs.existsSync(rulesPath)) {
    ERRORS.push('rules/ad_rules.json not found');
    return;
  }
  
  try {
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    
    if (!Array.isArray(rules)) {
      ERRORS.push('ad_rules.json must be an array');
      return;
    }
    
    // Check rule format
    rules.forEach((rule, index) => {
      if (!rule.id || !rule.action || !rule.condition) {
        ERRORS.push(`Rule ${index} missing required fields`);
      }
    });
    
    console.log(`${colors.green}✓ Ad rules valid (${rules.length} rules)${colors.reset}`);
  } catch (e) {
    ERRORS.push(`ad_rules.json parse error: ${e.message}`);
  }
}

// 5. Check documentation
function checkDocumentation() {
  console.log('\n→ Checking documentation...');
  
  const docs = [
    'README.md',
    'PRIVACY_POLICY.md',
    'LICENSE'
  ];
  
  docs.forEach(doc => {
    const docPath = path.join(PROJECT_ROOT, doc);
    if (!fs.existsSync(docPath)) {
      ERRORS.push(`Missing documentation: ${doc}`);
    }
  });
  
  console.log(`${colors.green}✓ Documentation checked${colors.reset}`);
}

// 6. Check file sizes
function checkFileSizes() {
  console.log('\n→ Checking file sizes...');
  
  const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
  
  icons.forEach(icon => {
    const iconPath = path.join(PROJECT_ROOT, 'icons', icon);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      const sizeKB = stats.size / 1024;
      
      if (sizeKB > 500) {
        WARNINGS.push(`${icon} is large (${sizeKB.toFixed(2)} KB)`);
      }
    }
  });
  
  console.log(`${colors.green}✓ File sizes checked${colors.reset}`);
}

// Run all validations
function runValidation() {
  validateManifest();
  checkRequiredFiles();
  checkConsoleLogs();
  validateAdRules();
  checkDocumentation();
  checkFileSizes();
  
  // Print results
  console.log('\n' + '═'.repeat(50));
  console.log('Validation Results');
  console.log('═'.repeat(50) + '\n');
  
  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log(`${colors.green}✓ All checks passed!${colors.reset}\n`);
    console.log('Extension is ready for building and publishing.');
    process.exit(0);
  }
  
  if (ERRORS.length > 0) {
    console.log(`${colors.red}Errors (${ERRORS.length}):${colors.reset}`);
    ERRORS.forEach(err => console.log(`  ✗ ${err}`));
    console.log('');
  }
  
  if (WARNINGS.length > 0) {
    console.log(`${colors.yellow}Warnings (${WARNINGS.length}):${colors.reset}`);
    WARNINGS.forEach(warn => console.log(`  ⚠ ${warn}`));
    console.log('');
  }
  
  if (ERRORS.length > 0) {
    console.log(`${colors.red}Validation failed. Please fix errors before publishing.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.yellow}Validation passed with warnings. Review before publishing.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run
runValidation();

