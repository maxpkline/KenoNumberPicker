/**
 * MathUtils.js
 * Mathematical utility functions for the Keno Number Picker application
 * Includes probability calculations, combinations, statistics, etc.
 */

import { KENO_CONFIG } from '../config.js';

// ============================================================================
// COMBINATION & PERMUTATION FUNCTIONS
// ============================================================================

/**
 * Calculate combinations (n choose k)
 * Returns the number of ways to choose k items from n items
 *
 * @param {number} n - Total number of items
 * @param {number} k - Number of items to choose
 * @returns {number} Number of combinations
 *
 * @example
 * combinations(5, 2) // returns 10
 */
export function combinations(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k < 0) return 0;

    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return Math.round(result);
}

/**
 * Generate all combinations of a given size from an array
 *
 * @param {Array} arr - Source array
 * @param {number} size - Size of combinations
 * @returns {Array<Array>} Array of all combinations
 *
 * @example
 * getCombinations([1, 2, 3], 2) // returns [[1,2], [1,3], [2,3]]
 */
export function getCombinations(arr, size) {
    const result = [];

    function combine(start, combo) {
        if (combo.length === size) {
            result.push([...combo]);
            return;
        }

        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }

    combine(0, []);
    return result;
}

/**
 * Generate all k-combinations from numbers 1 to n
 *
 * @param {number} n - Upper limit of numbers
 * @param {number} k - Size of combinations
 * @returns {Array<Array<number>>} Array of all combinations
 */
export function generateNumberCombinations(n, k) {
    const numbers = Array.from({ length: n }, (_, i) => i + 1);
    return getCombinations(numbers, k);
}

// ============================================================================
// PROBABILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the probability of hitting exactly 'matches' numbers in a single Keno game
 * Uses hypergeometric distribution
 *
 * P(X = matches) = [C(numbersDrawn, matches) * C(totalNumbers - numbersDrawn, spotCount - matches)] / C(totalNumbers, spotCount)
 *
 * @param {number} matches - Number of matches to calculate probability for
 * @param {number} spotCount - Number of spots the player picked
 * @param {number} totalNumbers - Total numbers in the game (default: 80)
 * @param {number} numbersDrawn - Numbers drawn each round (default: 20)
 * @returns {number} Probability as a decimal (0-1)
 *
 * @example
 * probabilityOfHitting(5, 10) // returns probability of hitting 5 out of 10 picked numbers
 */
export function probabilityOfHitting(
    matches,
    spotCount,
    totalNumbers = KENO_CONFIG.totalNumbers,
    numbersDrawn = KENO_CONFIG.numbersDrawn
) {
    // Validate inputs
    if (matches > spotCount) return 0;
    if (matches > numbersDrawn) return 0;
    if (spotCount > totalNumbers) return 0;
    if (spotCount - matches > totalNumbers - numbersDrawn) return 0;

    // Calculate using hypergeometric distribution
    const numerator = combinations(numbersDrawn, matches) *
        combinations(totalNumbers - numbersDrawn, spotCount - matches);
    const denominator = combinations(totalNumbers, spotCount);

    if (denominator === 0) return 0;

    return numerator / denominator;
}

/**
 * Calculate the probability of hitting at least 'matches' numbers across multiple games
 *
 * @param {number} matches - Number of matches
 * @param {number} spotCount - Number of spots picked
 * @param {number} numGames - Number of games
 * @param {number} totalNumbers - Total numbers in the game
 * @param {number} numbersDrawn - Numbers drawn each round
 * @returns {number} Probability as a decimal (0-1)
 *
 * @example
 * probabilityAcrossGames(5, 10, 20) // returns probability of hitting 5 numbers at least once in 20 games
 */
export function probabilityAcrossGames(
    matches,
    spotCount,
    numGames,
    totalNumbers = KENO_CONFIG.totalNumbers,
    numbersDrawn = KENO_CONFIG.numbersDrawn
) {
    const singleGameProb = probabilityOfHitting(matches, spotCount, totalNumbers, numbersDrawn);

    // Calculate probability of NOT hitting in any game
    const probNone = Math.pow(1 - singleGameProb, numGames);

    // Return probability of hitting at least once
    return 1 - probNone;
}

/**
 * Calculate expected value for a given payout structure
 *
 * @param {number} spotCount - Number of spots picked
 * @param {Object} payouts - Object mapping matches to payout amounts
 * @param {number} betAmount - Amount bet
 * @returns {number} Expected value
 *
 * @example
 * calculateExpectedValue(5, { 5: 100, 4: 10, 3: 2 }, 1)
 */
export function calculateExpectedValue(spotCount, payouts, betAmount = 1) {
    let expectedValue = 0;

    Object.entries(payouts).forEach(([matches, payout]) => {
        const prob = probabilityOfHitting(parseInt(matches), spotCount);
        expectedValue += prob * payout * betAmount;
    });

    return expectedValue;
}

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate mean (average) of an array of numbers
 *
 * @param {Array<number>} numbers - Array of numbers
 * @returns {number} Mean value
 */
export function mean(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
}

/**
 * Calculate median of an array of numbers
 *
 * @param {Array<number>} numbers - Array of numbers
 * @returns {number} Median value
 */
export function median(numbers) {
    if (numbers.length === 0) return 0;

    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

/**
 * Calculate standard deviation of an array of numbers
 *
 * @param {Array<number>} numbers - Array of numbers
 * @returns {number} Standard deviation
 */
export function standardDeviation(numbers) {
    if (numbers.length === 0) return 0;

    const avg = mean(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = mean(squareDiffs);

    return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate variance of an array of numbers
 *
 * @param {Array<number>} numbers - Array of numbers
 * @returns {number} Variance
 */
export function variance(numbers) {
    if (numbers.length === 0) return 0;

    const avg = mean(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));

    return mean(squareDiffs);
}

/**
 * Calculate z-score for a value in a dataset
 *
 * @param {number} value - Value to calculate z-score for
 * @param {Array<number>} numbers - Dataset
 * @returns {number} Z-score
 */
export function zScore(value, numbers) {
    const avg = mean(numbers);
    const stdDev = standardDeviation(numbers);

    if (stdDev === 0) return 0;

    return (value - avg) / stdDev;
}

/**
 * Calculate percentile rank of a value in a dataset
 *
 * @param {number} value - Value to find percentile for
 * @param {Array<number>} numbers - Dataset
 * @returns {number} Percentile (0-100)
 */
export function percentileRank(value, numbers) {
    if (numbers.length === 0) return 0;

    const sorted = [...numbers].sort((a, b) => a - b);
    const index = sorted.findIndex(n => n >= value);

    if (index === -1) return 100;

    return (index / sorted.length) * 100;
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize a value to the range [0, 1]
 *
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value in range
 * @param {number} max - Maximum value in range
 * @returns {number} Normalized value
 */
export function normalize(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
}

/**
 * Normalize an array of numbers to [0, 1]
 *
 * @param {Array<number>} numbers - Array to normalize
 * @returns {Array<number>} Normalized array
 */
export function normalizeArray(numbers) {
    if (numbers.length === 0) return [];

    const min = Math.min(...numbers);
    const max = Math.max(...numbers);

    return numbers.map(n => normalize(n, min, max));
}

/**
 * Denormalize a value from [0, 1] back to original range
 *
 * @param {number} value - Normalized value
 * @param {number} min - Original minimum
 * @param {number} max - Original maximum
 * @returns {number} Denormalized value
 */
export function denormalize(value, min, max) {
    return value * (max - min) + min;
}

// ============================================================================
// DISTANCE & SIMILARITY FUNCTIONS
// ============================================================================

/**
 * Calculate Euclidean distance between two arrays
 *
 * @param {Array<number>} arr1 - First array
 * @param {Array<number>} arr2 - Second array
 * @returns {number} Euclidean distance
 */
export function euclideanDistance(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        throw new Error('Arrays must have the same length');
    }

    const sumSquares = arr1.reduce((sum, val, i) => {
        return sum + Math.pow(val - arr2[i], 2);
    }, 0);

    return Math.sqrt(sumSquares);
}

/**
 * Calculate cosine similarity between two arrays
 *
 * @param {Array<number>} arr1 - First array
 * @param {Array<number>} arr2 - Second array
 * @returns {number} Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        throw new Error('Arrays must have the same length');
    }

    const dotProduct = arr1.reduce((sum, val, i) => sum + val * arr2[i], 0);
    const magnitude1 = Math.sqrt(arr1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(arr2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate Jaccard similarity between two sets
 *
 * @param {Set|Array} set1 - First set
 * @param {Set|Array} set2 - Second set
 * @returns {number} Jaccard similarity (0-1)
 */
export function jaccardSimilarity(set1, set2) {
    const s1 = set1 instanceof Set ? set1 : new Set(set1);
    const s2 = set2 instanceof Set ? set2 : new Set(set2);

    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clamp a value between min and max
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to a specified number of decimal places
 *
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
export function roundTo(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate weighted average
 *
 * @param {Array<number>} values - Values to average
 * @param {Array<number>} weights - Weights for each value
 * @returns {number} Weighted average
 */
export function weightedAverage(values, weights) {
    if (values.length !== weights.length) {
        throw new Error('Values and weights must have the same length');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);

    return weightedSum / totalWeight;
}

/**
 * Generate a random integer between min and max (inclusive)
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate an array of unique random integers
 *
 * @param {number} count - Number of random integers to generate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} Array of unique random integers
 */
export function uniqueRandomIntegers(count, min, max) {
    if (count > (max - min + 1)) {
        throw new Error('Cannot generate more unique numbers than range allows');
    }

    const numbers = new Set();
    while (numbers.size < count) {
        numbers.add(randomInt(min, max));
    }

    return Array.from(numbers).sort((a, b) => a - b);
}

// ============================================================================
// EXPORT ALL FUNCTIONS (for convenience)
// ============================================================================

export default {
    // Combinations
    combinations,
    getCombinations,
    generateNumberCombinations,

    // Probability
    probabilityOfHitting,
    probabilityAcrossGames,
    calculateExpectedValue,

    // Statistics
    mean,
    median,
    standardDeviation,
    variance,
    zScore,
    percentileRank,

    // Normalization
    normalize,
    normalizeArray,
    denormalize,

    // Distance & Similarity
    euclideanDistance,
    cosineSimilarity,
    jaccardSimilarity,

    // Helpers
    clamp,
    roundTo,
    weightedAverage,
    randomInt,
    uniqueRandomIntegers
};