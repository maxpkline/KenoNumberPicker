/**
 * DataLoader.js
 * Handles loading, caching, and processing of Keno data from JSON files
 * Centralizes all data fetching logic and provides a clean API
 */

import { DATA_PATHS, LOCATIONS } from '../config.js';

/**
 * DataLoader class - Singleton pattern for managing Keno data
 */
class DataLoader {
    constructor() {
        // Cache for loaded data to avoid repeated fetches
        this.cache = {
            current: {},      // Current day data for each location
            allData: {},      // All historical data for each location
            payouts: null,    // Payout data
            counts: {}        // Number frequency counts for each location
        };

        // Track loading state
        this.loading = {
            current: new Set(),
            allData: new Set(),
            payouts: false
        };

        // Error tracking
        this.errors = [];
    }

    // ========================================================================
    // CORE LOADING FUNCTIONS
    // ========================================================================

    /**
     * Read JSON data from a file path
     * @private
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise<Object|null>} Parsed JSON data or null on error
     */
    async _readJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Could not fetch ${filePath}`);
            }
            const jsonData = await response.json();
            console.log(`✓ Successfully loaded: ${filePath}`);
            return jsonData;
        } catch (error) {
            console.error(`✗ Error loading ${filePath}:`, error);
            this.errors.push({ filePath, error: error.message, timestamp: new Date() });
            return null;
        }
    }

    /**
     * Load current day data for a location
     * @param {string} location - Location name (e.g., 'omaha')
     * @param {boolean} forceReload - Force reload even if cached
     * @returns {Promise<Object|null>} Current day game data
     */
    async loadCurrent(location, forceReload = false) {
        // Return cached data if available
        if (!forceReload && this.cache.current[location]) {
            console.log(`↻ Using cached current data for ${location}`);
            return this.cache.current[location];
        }

        // Prevent duplicate requests
        if (this.loading.current.has(location)) {
            console.log(`⏳ Already loading current data for ${location}...`);
            return this._waitForLoad('current', location);
        }

        this.loading.current.add(location);

        const filePath = DATA_PATHS.current(location);
        const data = await this._readJSON(filePath);

        if (data) {
            this.cache.current[location] = data;
        }

        this.loading.current.delete(location);
        return data;
    }

    /**
     * Load all historical data for a location
     * @param {string} location - Location name
     * @param {boolean} forceReload - Force reload even if cached
     * @returns {Promise<Object|null>} All historical game data
     */
    async loadAllData(location, forceReload = false) {
        // Return cached data if available
        if (!forceReload && this.cache.allData[location]) {
            console.log(`↻ Using cached all data for ${location}`);
            return this.cache.allData[location];
        }

        // Prevent duplicate requests
        if (this.loading.allData.has(location)) {
            console.log(`⏳ Already loading all data for ${location}...`);
            return this._waitForLoad('allData', location);
        }

        this.loading.allData.add(location);

        const filePath = DATA_PATHS.allData(location);
        const data = await this._readJSON(filePath);

        if (data) {
            this.cache.allData[location] = data;
        }

        this.loading.allData.delete(location);
        return data;
    }

    /**
     * Load payout data
     * @param {boolean} forceReload - Force reload even if cached
     * @returns {Promise<Object|null>} Payout data for all game types
     */
    async loadPayouts(forceReload = false) {
        if (!forceReload && this.cache.payouts) {
            console.log('↻ Using cached payout data');
            return this.cache.payouts;
        }

        if (this.loading.payouts) {
            console.log('⏳ Already loading payout data...');
            return this._waitForPayoutLoad();
        }

        this.loading.payouts = true;

        const filePath = DATA_PATHS.payouts;
        const data = await this._readJSON(filePath);

        if (data) {
            this.cache.payouts = data;
        }

        this.loading.payouts = false;
        return data;
    }

    /**
     * Wait for a pending load to complete
     * @private
     */
    async _waitForLoad(type, location) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.loading[type].has(location)) {
                    clearInterval(checkInterval);
                    resolve(this.cache[type][location]);
                }
            }, 100);
        });
    }

    /**
     * Wait for payout load to complete
     * @private
     */
    async _waitForPayoutLoad() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.loading.payouts) {
                    clearInterval(checkInterval);
                    resolve(this.cache.payouts);
                }
            }, 100);
        });
    }

    // ========================================================================
    // BULK LOADING FUNCTIONS
    // ========================================================================

    /**
     * Load current data for all locations
     * @returns {Promise<Object>} Object with all locations' current data
     */
    async loadAllCurrentData() {
        console.log('📦 Loading current data for all locations...');
        const promises = LOCATIONS.map(location =>
            this.loadCurrent(location).then(data => ({ location, data }))
        );

        const results = await Promise.all(promises);
        const locationData = {};

        results.forEach(({ location, data }) => {
            if (data) {
                locationData[location] = data;
            }
        });

        console.log(`✓ Loaded current data for ${Object.keys(locationData).length} locations`);
        return locationData;
    }

    /**
     * Load all historical data for all locations
     * @returns {Promise<Object>} Object with all locations' historical data
     */
    async loadAllHistoricalData() {
        console.log('📦 Loading historical data for all locations...');
        const promises = LOCATIONS.map(location =>
            this.loadAllData(location).then(data => ({ location, data }))
        );

        const results = await Promise.all(promises);
        const locationData = {};

        results.forEach(({ location, data }) => {
            if (data) {
                locationData[location] = data;
            }
        });

        console.log(`✓ Loaded historical data for ${Object.keys(locationData).length} locations`);
        return locationData;
    }

    /**
     * Load everything (current, historical, payouts)
     * @returns {Promise<Object>} Object with all data
     */
    async loadAll() {
        console.log('📦 Loading all application data...');

        const [current, historical, payouts] = await Promise.all([
            this.loadAllCurrentData(),
            this.loadAllHistoricalData(),
            this.loadPayouts()
        ]);

        console.log('✓ All data loaded successfully');

        return {
            current,
            historical,
            payouts
        };
    }

    // ========================================================================
    // DATA PROCESSING FUNCTIONS
    // ========================================================================

    /**
     * Process Keno data from date-based structure to flat array
     * Converts { date: { gameNumber: [numbers] } } to array of game objects
     * @param {Object} jsonData - Raw JSON data
     * @returns {Array<Object>} Flattened and sorted game data
     */
    processKenoData(jsonData) {
        if (!jsonData) {
            console.error('No JSON data to process');
            return [];
        }

        // Flatten the date-based structure
        let flattenedData = [];

        Object.keys(jsonData).forEach(date => {
            const gamesForDate = jsonData[date];
            Object.entries(gamesForDate).forEach(([gameNumber, numbers]) => {
                flattenedData.push({
                    date,
                    gameNumber,
                    numbers: Array.isArray(numbers)
                        ? numbers.map(num => parseInt(num, 10))
                        : []
                });
            });
        });

        // Sort by date (newest first) and game number (highest first)
        flattenedData.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return parseInt(b.gameNumber) - parseInt(a.gameNumber);
        });

        console.log(`✓ Processed ${flattenedData.length} games`);
        return flattenedData;
    }

    /**
     * Load and process all data for a location
     * @param {string} location - Location name
     * @returns {Promise<Object>} Processed data
     */
    async loadAndProcess(location) {
        const [current, allData] = await Promise.all([
            this.loadCurrent(location),
            this.loadAllData(location)
        ]);

        return {
            current: current || {},
            allData: this.processKenoData(allData),
            location
        };
    }

    /**
     * Get number frequency counts for a location
     * @param {string} location - Location name
     * @returns {Promise<Array<Object>>} Array of {number, count} objects sorted by count
     */
    async getNumberCounts(location) {
        // Return cached counts if available
        if (this.cache.counts[location]) {
            return this.cache.counts[location];
        }

        const data = await this.loadCurrent(location);
        if (!data) return [];

        const numberCounts = new Map();

        // Count occurrences
        Object.values(data).forEach(gameData => {
            if (Array.isArray(gameData)) {
                gameData.forEach(number => {
                    const num = parseInt(number, 10);
                    numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
                });
            }
        });

        // Convert to sorted array
        const sortedCounts = Array.from(numberCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([number, count]) => ({ number, count }));

        // Cache the result
        this.cache.counts[location] = sortedCounts;

        return sortedCounts;
    }

    /**
     * Get games for a specific date
     * @param {string} location - Location name
     * @param {string} date - Date string (format: MM/DD/YYYY or YYYY-MM-DD)
     * @returns {Promise<Object|null>} Games for that date
     */
    async getGamesForDate(location, date) {
        const allData = await this.loadAllData(location);
        if (!allData) return null;

        // Try to find the date (handle different formats)
        const normalizedDate = this._normalizeDate(date);

        return allData[date] || allData[normalizedDate] || null;
    }

    /**
     * Normalize date format
     * @private
     */
    _normalizeDate(date) {
        // Convert YYYY-MM-DD to MM/DD/YYYY or vice versa
        if (date.includes('-')) {
            const [year, month, day] = date.split('-');
            return `${month}/${day}/${year}`;
        } else if (date.includes('/')) {
            const [month, day, year] = date.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return date;
    }

    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================

    /**
     * Clear cache for a specific location or all locations
     * @param {string|null} location - Location to clear, or null for all
     */
    clearCache(location = null) {
        if (location) {
            delete this.cache.current[location];
            delete this.cache.allData[location];
            delete this.cache.counts[location];
            console.log(`✓ Cleared cache for ${location}`);
        } else {
            this.cache = {
                current: {},
                allData: {},
                payouts: null,
                counts: {}
            };
            console.log('✓ Cleared all cache');
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            currentLocations: Object.keys(this.cache.current).length,
            allDataLocations: Object.keys(this.cache.allData).length,
            countsLocations: Object.keys(this.cache.counts).length,
            payoutsLoaded: this.cache.payouts !== null,
            errors: this.errors.length
        };
    }

    /**
     * Check if data is cached
     * @param {string} type - 'current', 'allData', or 'payouts'
     * @param {string|null} location - Location name (not needed for payouts)
     * @returns {boolean} True if cached
     */
    isCached(type, location = null) {
        if (type === 'payouts') {
            return this.cache.payouts !== null;
        }
        return location && this.cache[type] && this.cache[type][location] !== undefined;
    }

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    /**
     * Get all errors
     * @returns {Array} Array of error objects
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * Clear error log
     */
    clearErrors() {
        this.errors = [];
    }

    /**
     * Check if there are any errors
     * @returns {boolean} True if errors exist
     */
    hasErrors() {
        return this.errors.length > 0;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create a single instance to be shared across the application
const dataLoader = new DataLoader();

// ============================================================================
// EXPORTS
// ============================================================================

// Export the singleton instance as default
export default dataLoader;

// Also export the class for testing purposes
export { DataLoader };