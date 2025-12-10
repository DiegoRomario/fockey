/**
 * Main Content Script for Fockey Chrome Extension
 * Entry point that delegates to the YouTube orchestrator
 *
 * NOTE: The actual orchestration logic is now in ./youtube/index.ts
 * This file serves as the main entry point specified in manifest.json
 */

// Import the YouTube orchestrator which handles all module loading and coordination
import './youtube/index';
