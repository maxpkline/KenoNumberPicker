/**
 * ArrayUtils.js
 * Utility functions for array manipulation, sorting, filtering, and transformation
 * Useful for processing Keno data and game numbers
 */

// ============================================================================
// ARRAY TRANSFORMATION
// ============================================================================

/**
 * Flatten a nested array to a single level
 * @param {Array} arr - Array to flatten
 * @param {number} depth - Depth to flatten (default: Infinity)
 * @returns {Array} Flattened array
 *
 * @example
 * flatten([[1, 2], [3, [4, 5]]]) // returns [1, 2, 3, 4, 5]
 */
export function flatten(arr, depth = Infinity) {
    if (depth === 0) return arr;
    return arr.reduce((acc, val) => {
        return acc.concat(Array.isArray(val) ? flatten(val, depth - 1) : val);
    }, []);
}

/**
 * Chunk an array into smaller arrays of specified size
 * @param {Array} arr - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array<Array>} Array of chunks
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // returns [[1, 2], [3, 4], [5]]
 */
export function chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Transpose a 2D array (swap rows and columns)
 * @param {Array<Array>} matrix - 2D array to transpose
 * @returns {Array<Array>} Transposed array
 *
 * @example
 * transpose([[1, 2], [3, 4]]) // returns [[1, 3], [2, 4]]
 */
export function transpose(matrix) {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/**
 * Rotate an array by n positions
 * @param {Array} arr - Array to rotate
 * @param {number} n - Number of positions (positive = right, negative = left)
 * @returns {Array} Rotated array
 *
 * @example
 * rotate([1, 2, 3, 4, 5], 2) // returns [4, 5, 1, 2, 3]
 */
export function rotate(arr, n) {
    const len = arr.length;
    const offset = ((n % len) + len) % len;
    return arr.slice(-offset).concat(arr.slice(0, -offset));
}

// ============================================================================
// ARRAY FILTERING & SEARCHING
// ============================================================================

/**
 * Get unique values from an array
 * @param {Array} arr - Array to process
 * @returns {Array} Array with unique values
 *
 * @example
 * unique([1, 2, 2, 3, 3, 3]) // returns [1, 2, 3]
 */
export function unique(arr) {
    return [...new Set(arr)];
}

/**
 * Get the intersection of multiple arrays (values present in all arrays)
 * @param {...Array} arrays - Arrays to intersect
 * @returns {Array} Intersection of all arrays
 *
 * @example
 * intersection([1, 2, 3], [2, 3, 4], [3, 4, 5]) // returns [3]
 */
export function intersection(...arrays) {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return unique(arrays[0]);

    const [first, ...rest] = arrays;
    return unique(first).filter(value =>
        rest.every(arr => arr.includes(value))
    );
}

/**
 * Get the union of multiple arrays (all unique values from all arrays)
 * @param {...Array} arrays - Arrays to union
 * @returns {Array} Union of all arrays
 *
 * @example
 * union([1, 2], [2, 3], [3, 4]) // returns [1, 2, 3, 4]
 */
export function union(...arrays) {
    return unique(flatten(arrays, 1));
}

/**
 * Get the difference between two arrays (values in first but not in second)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Difference
 *
 * @example
 * difference([1, 2, 3, 4], [2, 4]) // returns [1, 3]
 */
export function difference(arr1, arr2) {
    const set2 = new Set(arr2);
    return arr1.filter(item => !set2.has(item));
}

/**
 * Get symmetric difference (values in either array but not in both)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Symmetric difference
 *
 * @example
 * symmetricDifference([1, 2, 3], [2, 3, 4]) // returns [1, 4]
 */
export function symmetricDifference(arr1, arr2) {
    return [
        ...difference(arr1, arr2),
        ...difference(arr2, arr1)
    ];
}

/**
 * Filter array to only include items that appear at least n times
 * @param {Array} arr - Array to filter
 * @param {number} minCount - Minimum occurrence count
 * @returns {Array} Filtered array
 *
 * @example
 * filterByFrequency([1, 1, 2, 2, 2, 3], 2) // returns [1, 1, 2, 2, 2]
 */
export function filterByFrequency(arr, minCount) {
    const counts = countOccurrences(arr);
    return arr.filter(item => counts.get(item) >= minCount);
}

// ============================================================================
// ARRAY STATISTICS & AGGREGATION
// ============================================================================

/**
 * Count occurrences of each value in an array
 * @param {Array} arr - Array to analyze
 * @returns {Map} Map of value -> count
 *
 * @example
 * countOccurrences([1, 2, 2, 3, 3, 3]) // returns Map { 1 => 1, 2 => 2, 3 => 3 }
 */
export function countOccurrences(arr) {
    const counts = new Map();
    arr.forEach(item => {
        counts.set(item, (counts.get(item) || 0) + 1);
    });
    return counts;
}

/**
 * Get frequency distribution as sorted array
 * @param {Array} arr - Array to analyze
 * @param {boolean} descending - Sort by frequency descending (default: true)
 * @returns {Array<{value: any, count: number}>} Sorted frequency array
 *
 * @example
 * frequencyDistribution([1, 2, 2, 3, 3, 3])
 * // returns [{value: 3, count: 3}, {value: 2, count: 2}, {value: 1, count: 1}]
 */
export function frequencyDistribution(arr, descending = true) {
    const counts = countOccurrences(arr);
    const distribution = Array.from(counts.entries()).map(([value, count]) => ({
        value,
        count
    }));

    return distribution.sort((a, b) =>
        descending ? b.count - a.count : a.count - b.count
    );
}

/**
 * Group array elements by a key function
 * @param {Array} arr - Array to group
 * @param {Function} keyFn - Function to extract key from each element
 * @returns {Map} Map of key -> array of elements
 *
 * @example
 * groupBy([1, 2, 3, 4, 5], x => x % 2) // groups by even/odd
 */
export function groupBy(arr, keyFn) {
    const groups = new Map();
    arr.forEach(item => {
        const key = keyFn(item);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });
    return groups;
}

/**
 * Partition array into two arrays based on a predicate
 * @param {Array} arr - Array to partition
 * @param {Function} predicate - Function that returns true/false
 * @returns {[Array, Array]} [matching, notMatching]
 *
 * @example
 * partition([1, 2, 3, 4, 5], x => x > 3) // returns [[4, 5], [1, 2, 3]]
 */
export function partition(arr, predicate) {
    const matching = [];
    const notMatching = [];

    arr.forEach(item => {
        if (predicate(item)) {
            matching.push(item);
        } else {
            notMatching.push(item);
        }
    });

    return [matching, notMatching];
}

// ============================================================================
// ARRAY SAMPLING & RANDOM
// ============================================================================

/**
 * Shuffle an array (Fisher-Yates algorithm)
 * @param {Array} arr - Array to shuffle
 * @returns {Array} Shuffled copy of array
 *
 * @example
 * shuffle([1, 2, 3, 4, 5]) // returns random order like [3, 1, 5, 2, 4]
 */
export function shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Sample n random elements from an array
 * @param {Array} arr - Array to sample from
 * @param {number} n - Number of elements to sample
 * @param {boolean} unique - Whether samples should be unique (default: true)
 * @returns {Array} Sampled elements
 *
 * @example
 * sample([1, 2, 3, 4, 5], 3) // returns 3 random unique elements
 */
export function sample(arr, n, unique = true) {
    if (unique) {
        if (n > arr.length) {
            throw new Error('Cannot sample more unique elements than array length');
        }
        return shuffle(arr).slice(0, n);
    } else {
        return Array.from({ length: n }, () =>
            arr[Math.floor(Math.random() * arr.length)]
        );
    }
}

/**
 * Pick one random element from an array
 * @param {Array} arr - Array to pick from
 * @returns {*} Random element
 *
 * @example
 * pickRandom([1, 2, 3, 4, 5]) // returns one random element
 */
export function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================================
// ARRAY COMPARISON
// ============================================================================

/**
 * Check if two arrays are equal (same values in same order)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} True if equal
 */
export function areEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
}

/**
 * Check if two arrays have the same elements (ignoring order)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} True if same elements
 */
export function haveSameElements(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return areEqual(sorted1, sorted2);
}

/**
 * Find common elements between arrays and their counts
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Object} Object with matches array and count
 *
 * @example
 * findMatches([1, 2, 3], [2, 3, 4]) // returns { matches: [2, 3], count: 2 }
 */
export function findMatches(arr1, arr2) {
    const set2 = new Set(arr2);
    const matches = arr1.filter(item => set2.has(item));
    return {
        matches: unique(matches),
        count: matches.length
    };
}

// ============================================================================
// ARRAY SORTING & ORDERING
// ============================================================================

/**
 * Sort array by multiple criteria
 * @param {Array} arr - Array to sort
 * @param {Array<{key: string|Function, order: 'asc'|'desc'}>} criteria - Sort criteria
 * @returns {Array} Sorted array
 *
 * @example
 * sortBy(data, [
 *   { key: 'priority', order: 'desc' },
 *   { key: 'name', order: 'asc' }
 * ])
 */
export function sortBy(arr, criteria) {
    return [...arr].sort((a, b) => {
        for (const { key, order = 'asc' } of criteria) {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];

            if (aVal !== bVal) {
                const comparison = aVal < bVal ? -1 : 1;
                return order === 'asc' ? comparison : -comparison;
            }
        }
        return 0;
    });
}

/**
 * Get top N elements by a scoring function
 * @param {Array} arr - Array to process
 * @param {number} n - Number of top elements
 * @param {Function} scoreFn - Function to calculate score
 * @returns {Array} Top N elements
 *
 * @example
 * topN([{val: 5}, {val: 2}, {val: 8}], 2, x => x.val)
 * // returns [{val: 8}, {val: 5}]
 */
export function topN(arr, n, scoreFn) {
    return [...arr]
        .sort((a, b) => scoreFn(b) - scoreFn(a))
        .slice(0, n);
}

/**
 * Get bottom N elements by a scoring function
 * @param {Array} arr - Array to process
 * @param {number} n - Number of bottom elements
 * @param {Function} scoreFn - Function to calculate score
 * @returns {Array} Bottom N elements
 */
export function bottomN(arr, n, scoreFn) {
    return [...arr]
        .sort((a, b) => scoreFn(a) - scoreFn(b))
        .slice(0, n);
}

// ============================================================================
// SLIDING WINDOW OPERATIONS
// ============================================================================

/**
 * Create sliding windows over an array
 * @param {Array} arr - Source array
 * @param {number} windowSize - Size of each window
 * @param {number} step - Step size (default: 1)
 * @returns {Array<Array>} Array of windows
 *
 * @example
 * slidingWindow([1, 2, 3, 4, 5], 3)
 * // returns [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
 */
export function slidingWindow(arr, windowSize, step = 1) {
    const windows = [];
    for (let i = 0; i <= arr.length - windowSize; i += step) {
        windows.push(arr.slice(i, i + windowSize));
    }
    return windows;
}

/**
 * Apply a function to each sliding window
 * @param {Array} arr - Source array
 * @param {number} windowSize - Size of each window
 * @param {Function} fn - Function to apply to each window
 * @param {number} step - Step size (default: 1)
 * @returns {Array} Results from applying function to each window
 *
 * @example
 * mapWindow([1, 2, 3, 4, 5], 3, window => window.reduce((a,b) => a+b))
 * // returns [6, 9, 12]
 */
export function mapWindow(arr, windowSize, fn, step = 1) {
    return slidingWindow(arr, windowSize, step).map(fn);
}

// ============================================================================
// RANGE GENERATION
// ============================================================================

/**
 * Generate a range of numbers
 * @param {number} start - Start value (inclusive)
 * @param {number} end - End value (exclusive if step is positive, inclusive if negative)
 * @param {number} step - Step size (default: 1)
 * @returns {Array<number>} Range array
 *
 * @example
 * range(1, 5) // returns [1, 2, 3, 4]
 * range(1, 80) // generates Keno number range
 */
export function range(start, end, step = 1) {
    const result = [];
    if (step > 0) {
        for (let i = start; i < end; i += step) {
            result.push(i);
        }
    } else {
        for (let i = start; i > end; i += step) {
            result.push(i);
        }
    }
    return result;
}

/**
 * Generate array of specific length filled with a value or function result
 * @param {number} length - Array length
 * @param {*|Function} fillValue - Value or function(index) => value
 * @returns {Array} Generated array
 *
 * @example
 * fill(5, 0) // returns [0, 0, 0, 0, 0]
 * fill(5, i => i * 2) // returns [0, 2, 4, 6, 8]
 */
export function fill(length, fillValue) {
    return Array.from({ length }, (_, i) =>
        typeof fillValue === 'function' ? fillValue(i) : fillValue
    );
}

// ============================================================================
// EXPORT ALL (for convenience)
// ============================================================================

export default {
    // Transformation
    flatten,
    chunk,
    transpose,
    rotate,

    // Filtering & Searching
    unique,
    intersection,
    union,
    difference,
    symmetricDifference,
    filterByFrequency,

    // Statistics
    countOccurrences,
    frequencyDistribution,
    groupBy,
    partition,

    // Sampling
    shuffle,
    sample,
    pickRandom,

    // Comparison
    areEqual,
    haveSameElements,
    findMatches,

    // Sorting
    sortBy,
    topN,
    bottomN,

    // Sliding Window
    slidingWindow,
    mapWindow,

    // Range Generation
    range,
    fill
};