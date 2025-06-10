/**
 * Translation Synchronization Script
 * 
 * This script scans the English locale file (en.json) and ensures all keys exist in other locale files.
 * Missing keys are added with their English values marked for translation.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const SOURCE_LOCALE = 'en.json';
const TARGET_MARK = '[TRANSLATE]'; // Marker to indicate text needs translation

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function writeJsonFile(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

function getLocaleFiles() {
  try {
    return fs.readdirSync(LOCALES_DIR)
      .filter(file => file.endsWith('.json') && file !== SOURCE_LOCALE);
  } catch (error) {
    console.error('Error reading locales directory:', error.message);
    process.exit(1);
  }
}

function syncKeys(sourceObj, targetObj, path = '') {
  let changes = 0;
  
  for (const key in sourceObj) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof sourceObj[key] === 'object' && sourceObj[key] !== null) {
      // Create nested object if it doesn't exist
      if (!targetObj[key] || typeof targetObj[key] !== 'object') {
        targetObj[key] = {};
        console.log(`Added missing section: ${currentPath}`);
        changes++;
      }
      
      // Recursively sync nested objects
      changes += syncKeys(sourceObj[key], targetObj[key], currentPath);
    } else {
      // Add missing string key
      if (targetObj[key] === undefined) {
        targetObj[key] = `${TARGET_MARK} ${sourceObj[key]}`;
        console.log(`Added missing key: ${currentPath}`);
        changes++;
      }
    }
  }
  
  return changes;
}

function syncTranslations() {
  // Read the source locale file (English)
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE);
  const sourceData = readJsonFile(sourcePath);
  
  // Get all target locale files
  const targetFiles = getLocaleFiles();
  
  let totalChanges = 0;
  let filesChanged = 0;
  
  // Process each target locale file
  targetFiles.forEach(file => {
    const targetPath = path.join(LOCALES_DIR, file);
    const targetData = readJsonFile(targetPath);
    
    // Sync missing keys
    console.log(`\nProcessing ${file}...`);
    const changes = syncKeys(sourceData, targetData);
    
    if (changes > 0) {
      // Write updated translations back to file
      if (writeJsonFile(targetPath, targetData)) {
        console.log(`✅ Updated ${file} with ${changes} change(s)`);
        totalChanges += changes;
        filesChanged++;
      }
    } else {
      console.log(`✓ No changes needed for ${file}`);
    }
  });
  
  console.log(`\n=== Translation Sync Complete ===`);
  console.log(`Files processed: ${targetFiles.length}`);
  console.log(`Files updated: ${filesChanged}`);
  console.log(`Total keys added: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log(`\nPlease review the changes and properly translate the values marked with "${TARGET_MARK}".`);
  }
}

// Run the sync process
syncTranslations(); 