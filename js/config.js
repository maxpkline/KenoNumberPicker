/**
 * config.js
 * Central configuration file for the Keno Number Picker application
 * All constants, settings, and configuration options are defined here
 */

// ============================================================================
// LOCATION CONFIGURATION
// ============================================================================

export const LOCATIONS = ['omaha', 'lincoln', 'fremont', 'norfolk', 'blair', 'beatrice'];

export const LOCATION_DISPLAY_NAMES = {
    omaha: 'Omaha',
    lincoln: 'Lincoln',
    fremont: 'Fremont',
    norfolk: 'Norfolk',
    blair: 'Blair',
    beatrice: 'Beatrice'
};

// ============================================================================
// KENO GAME CONFIGURATION
// ============================================================================

export const KENO_CONFIG = {
    totalNumbers: 80,           // Total numbers in keno (1-80)
    numbersDrawn: 20,           // Numbers drawn each game
    minPickCount: 1,            // Minimum numbers a player can pick
    maxPickCount: 20,           // Maximum numbers a player can pick
    defaultWindowSize: 10,      // Default window size for trend analysis
    recentGamesWindow: 50,      // Number of recent games for hot/cold analysis
    hotNumberThreshold: 10,     // Frequency threshold for "hot" numbers
    coldNumberThreshold: 2      // Frequency threshold for "cold" numbers
};

// ============================================================================
// KENO GAME TYPE NAMES
// ============================================================================

export const KENO_GAME_NAMES = {
    topBottom: "Top/Bottom & Left/Right",
    highRollers: "High Rollers",
    winnerTakeAll: "Winner Take All",
    "20Spot": "20 Spot",
    pennyKeno: "Penny Keno",
    "70sKeno": "70's Keno",
    hogWild: "Hog Wild",
    quarterMania: "Quarter Mania",
    regularKeno: "Regular Keno"
};

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

/**
 * Configuration for Model A (Basic Sequential Model)
 */
export const MODEL_A_CONFIG = {
    name: 'Model A',
    description: 'Basic sequential neural network with dropout and batch normalization',
    architecture: {
        inputShape: [20],
        layers: [
            {
                type: 'dense',
                units: 128,
                activation: 'relu',
                kernelInitializer: 'glorotNormal',
                kernelRegularizer: { l2: 0.01 },
                biasInitializer: 'zeros'
            },
            {
                type: 'dropout',
                rate: 0.3
            },
            {
                type: 'batchNormalization'
            },
            {
                type: 'dense',
                units: 64,
                activation: 'relu',
                kernelInitializer: 'glorotNormal',
                kernelRegularizer: { l2: 0.01 },
                biasInitializer: 'zeros'
            },
            {
                type: 'dropout',
                rate: 0.2
            },
            {
                type: 'batchNormalization'
            },
            {
                type: 'dense',
                units: 20,
                activation: 'sigmoid',
                kernelInitializer: 'glorotNormal',
                biasInitializer: 'zeros'
            }
        ]
    },
    training: {
        optimizer: {
            type: 'rmsprop',
            learningRate: 0.001,
            decay: 0,
            momentum: 0,
            epsilon: 1e-7
        },
        loss: 'meanSquaredError',
        metrics: ['mse', 'accuracy'],
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true
    },
    preprocessing: {
        windowSize: 1,          // Use 1 previous game
        normalization: 80       // Divide by 80 to normalize
    }
};

/**
 * Configuration for Model B (Rolling Window Model)
 */
export const MODEL_B_CONFIG = {
    name: 'Model B',
    description: 'Rolling window model with hot/cold number features',
    architecture: {
        inputShape: null,  // Calculated dynamically: (windowSize * 20) + 80
        layers: [
            {
                type: 'dense',
                units: 128,
                activation: 'relu',
                kernelInitializer: 'glorotNormal',
                kernelRegularizer: { l2: 0.01 },
                biasInitializer: 'zeros'
            },
            {
                type: 'dropout',
                rate: 0.3
            },
            {
                type: 'batchNormalization'
            },
            {
                type: 'dense',
                units: 64,
                activation: 'relu',
                kernelInitializer: 'glorotNormal',
                kernelRegularizer: { l2: 0.01 },
                biasInitializer: 'zeros'
            },
            {
                type: 'dropout',
                rate: 0.2
            },
            {
                type: 'batchNormalization'
            },
            {
                type: 'dense',
                units: 20,
                activation: 'sigmoid',
                kernelInitializer: 'glorotNormal',
                biasInitializer: 'zeros'
            }
        ]
    },
    training: {
        optimizer: {
            type: 'adamax',
            learningRate: 0.0005,
            beta1: 0.9,
            beta2: 0.999,
            epsilon: 1e-7
        },
        loss: 'meanSquaredError',
        metrics: ['mse', 'accuracy'],
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true
    },
    preprocessing: {
        windowSize: 5,          // Use 5 previous games
        normalization: 80,
        includeHotCold: true    // Include hot/cold features
    }
};

/**
 * Configuration for Model C (Binary Classification Model)
 */
export const MODEL_C_CONFIG = {
    name: 'Model C',
    description: 'Binary classification model predicting probability for each number',
    architecture: {
        inputShape: null,  // Calculated dynamically: windowSize * 20
        layers: [
            {
                type: 'dense',
                units: 128,
                activation: 'relu',
                kernelInitializer: 'glorotUniform'
            },
            {
                type: 'dropout',
                rate: 0.3
            },
            {
                type: 'batchNormalization'
            },
            {
                type: 'dense',
                units: 64,
                activation: 'relu'
            },
            {
                type: 'dropout',
                rate: 0.2
            },
            {
                type: 'dense',
                units: 80,  // Output probability for each number 1-80
                activation: 'sigmoid'
            }
        ]
    },
    training: {
        optimizer: {
            type: 'adam',
            learningRate: 0.001
        },
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true
    },
    preprocessing: {
        windowSize: 5,
        normalization: 80,
        outputType: 'binary'    // Binary vector for each number
    },
    prediction: {
        topN: 20    // Return top 20 likely numbers
    }
};

/**
 * Configuration for Hybrid Combo Ranker
 */
export const HYBRID_RANKER_CONFIG = {
    name: 'Hybrid Combo Ranker',
    description: 'Combines Model C predictions with historical combo analysis',
    comboSizes: [3, 4, 5],      // Analyze these combo sizes
    windowSize: 500,            // Number of recent games to analyze
    weights: {
        frequency: 0.4,         // Weight for historical frequency
        recentBoost: 0.3,       // Weight for recent appearances
        hotBoost: 0.3           // Weight for Model C hot numbers
    },
    topCombosPerSize: 10        // Return top 10 combos for each size
};

// ============================================================================
// ANALYSIS CONFIGURATION
// ============================================================================

export const ANALYSIS_CONFIG = {
    combinations: {
        minSize: 3,
        maxSize: 8,
        topResults: 10,
        includeConfidence: true
    },
    trends: {
        defaultWindowSize: 10,
        recentWeight: 2         // Weight for recent games in hot/cold analysis
    },
    gaps: {
        trackAllNumbers: true   // Track gaps for all 80 numbers
    },
    streaks: {
        trackCurrent: true,
        trackMax: true
    },
    coOccurrence: {
        minOccurrences: 1,
        topPairs: 10
    },
    predictions: {
        topN: 10,
        weights: {
            recentTrends: 0.4,
            gapAnalysis: 0.3,
            hotCold: 0.3
        }
    }
};

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
    animation: {
        bubbleInterval: 300,            // ms between bubble creation
        bubbleMinSize: 10,              // px
        bubbleMaxSize: 40,              // px
        bubbleMinDuration: 5,           // seconds
        bubbleMaxDuration: 10           // seconds
    },
    chart: {
        type: 'bar',
        barThickness: 12,
        responsive: true,
        maintainAspectRatio: false,
        defaultHeight: 500,
        colors: {
            primary: 'rgba(54, 162, 235, 0.5)',
            primaryBorder: 'rgba(54, 162, 235, 1)',
            secondary: 'rgba(255, 99, 132, 0.5)',
            secondaryBorder: 'rgba(255, 99, 132, 1)'
        }
    },
    table: {
        defaultPageSize: 10,
        animateOnLoad: true
    },
    modal: {
        closeOnOutsideClick: true
    },
    notifications: {
        duration: 3000,             // ms
        position: 'top-right'
    }
};

// ============================================================================
// DATA PATHS
// ============================================================================

export const DATA_PATHS = {
    current: (location) => `data/${location}.json`,
    allData: (location) => `data/${location}allData.json`,
    payouts: 'data/payoutData.json'
};

// ============================================================================
// TRAINING UI CONFIGURATION
// ============================================================================

export const TRAINING_UI_CONFIG = {
    updateInterval: 100,        // ms between UI updates during training
    progressBarSteps: 100,      // Number of steps in progress bar
    logMaxEntries: 50,          // Maximum number of log entries to keep
    metricsDecimalPlaces: 4,    // Decimal places for loss/metrics
    percentageDecimalPlaces: 2  // Decimal places for percentages
};

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

export const VALIDATION_CONFIG = {
    numbers: {
        min: 1,
        max: 80,
        required: true
    },
    date: {
        format: 'YYYY-MM-DD',
        required: true
    },
    bet: {
        min: 0,
        step: 0.01
    }
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
    enableModelA: true,
    enableModelB: true,
    enableModelC: true,
    enableHybridRanker: true,
    enableTicketAnalysis: true,
    enablePayoutCalculator: true,
    enableNumberPicker: true,
    enableAdvancedAnalytics: true,
    enableDataExport: false,        // Future feature
    enableModelComparison: false,   // Future feature
    enableRealTimeUpdates: false    // Future feature
};

// ============================================================================
// OPTIMIZER CONFIGURATIONS
// ============================================================================

export const OPTIMIZER_CONFIGS = {
    adam: {
        learningRate: 0.001,
        beta1: 0.9,
        beta2: 0.999,
        epsilon: 1e-7
    },
    adamax: {
        learningRate: 0.001,
        beta1: 0.9,
        beta2: 0.999,
        epsilon: 1e-7
    },
    adadelta: {
        learningRate: 0.001,
        rho: 0.95,
        epsilon: 1e-7
    },
    rmsprop: {
        learningRate: 0.001,
        decay: 0,
        momentum: 0,
        epsilon: 1e-7
    }
};

// ============================================================================
// EXPORT ALL CONFIGS (for convenience)
// ============================================================================

export default {
    LOCATIONS,
    LOCATION_DISPLAY_NAMES,
    KENO_CONFIG,
    KENO_GAME_NAMES,
    MODEL_A_CONFIG,
    MODEL_B_CONFIG,
    MODEL_C_CONFIG,
    HYBRID_RANKER_CONFIG,
    ANALYSIS_CONFIG,
    UI_CONFIG,
    DATA_PATHS,
    TRAINING_UI_CONFIG,
    VALIDATION_CONFIG,
    FEATURES,
    OPTIMIZER_CONFIGS
};