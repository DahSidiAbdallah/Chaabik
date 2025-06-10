#!/usr/bin/env node

/**
 * Script to update translations in the Chaabik project
 * This script:
 * 1. Extracts all translatable strings from the source code
 * 2. Updates existing translation files
 * 3. Identifies missing translations
 * 4. Optionally updates translation files with automatic translations (requires API key)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const LOCALES = ['en', 'fr', 'ar'];
const LOCALES_DIR = path.resolve('src/i18n/locales');
const PRIMARY_LOCALE = 'en'; // The source locale that should be complete

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Main function to update translations
 */
async function updateTranslations() {
  console.log(`${colors.blue}==== Chaabik Translation Update Tool ====${colors.reset}`);
  
  try {
    // Step 1: Extract translations
    console.log(`\n${colors.cyan}⚙️ Extracting translations from source code...${colors.reset}`);
    execSync('npm run extract-translations', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Translations extracted successfully${colors.reset}`);

    // Step 2: Analyze translation files
    console.log(`\n${colors.cyan}📊 Analyzing translation files...${colors.reset}`);
    
    // Read the primary locale file (source of truth)
    const primaryTranslations = JSON.parse(
      fs.readFileSync(path.join(LOCALES_DIR, `${PRIMARY_LOCALE}.json`), 'utf8')
    );
    
    // Count keys in primary locale
    const primaryKeyCount = countKeysDeep(primaryTranslations);
    console.log(`${colors.blue}Primary locale (${PRIMARY_LOCALE}): ${primaryKeyCount} keys${colors.reset}`);
    
    // Check other locales for missing translations
    for (const locale of LOCALES.filter(l => l !== PRIMARY_LOCALE)) {
      const localeFilePath = path.join(LOCALES_DIR, `${locale}.json`);
      
      // Read the locale file
      const localeTranslations = JSON.parse(
        fs.readFileSync(localeFilePath, 'utf8')
      );
      
      // Count keys and check for missing translations
      const localeKeyCount = countKeysDeep(localeTranslations);
      const missingTranslationsCount = countMissingTranslations(primaryTranslations, localeTranslations);
      
      const percentComplete = Math.round(((primaryKeyCount - missingTranslationsCount) / primaryKeyCount) * 100);
      
      if (missingTranslationsCount > 0) {
        console.log(
          `${colors.yellow}Locale ${locale}: ${localeKeyCount} keys, ${missingTranslationsCount} missing (${percentComplete}% complete)${colors.reset}`
        );
      } else {
        console.log(
          `${colors.green}Locale ${locale}: ${localeKeyCount} keys, ${missingTranslationsCount} missing (${percentComplete}% complete)${colors.reset}`
        );
      }
    }
    
    console.log(`\n${colors.green}✓ Translation analysis complete${colors.reset}`);
    console.log(`\n${colors.cyan}💡 Next steps:${colors.reset}`);
    console.log(`1. Review the missing translations in each locale file`);
    console.log(`2. Fill in the missing translations manually or use a translation service`);
    console.log(`3. For automatic translation, consider integrating with a translation API`);
    
  } catch (error) {
    console.error(`${colors.red}Error updating translations:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Count the number of keys in a nested object
 */
function countKeysDeep(obj, prefix = '') {
  let count = 0;
  
  for (const key in obj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively count nested keys
      count += countKeysDeep(obj[key], currentPath);
    } else {
      count++;
    }
  }
  
  return count;
}

/**
 * Count the number of missing translations in the target locale
 * compared to the source locale
 */
function countMissingTranslations(source, target, prefix = '') {
  let missingCount = 0;
  
  for (const key in source) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof source[key] === 'object' && source[key] !== null) {
      // If it's an object in the source but not in the target, or not an object in the target
      if (!target[key] || typeof target[key] !== 'object') {
        // Count all nested keys in the source as missing
        missingCount += countKeysDeep(source[key]);
      } else {
        // Recursively check nested objects
        missingCount += countMissingTranslations(source[key], target[key], currentPath);
      }
    } else {
      // For leaf nodes, check if the translation exists and is non-empty
      if (!target[key] || target[key] === '') {
        missingCount++;
      }
    }
  }
  
  return missingCount;
}

// Run the main function
updateTranslations();