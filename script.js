async function showScreen(screenId) {
    const buttons = document.getElementsByClassName('button');
    for (let button of buttons) {
        button.classList.remove('button-selected');
    }
    const selectedButton = document.getElementById(screenId + 'Button');
    selectedButton.classList.add('button-selected');

    // Hide all screens
    const screens = document.getElementsByClassName('screen');
    hideAllGameDataTables();
    for (let screen of screens) {
        screen.classList.remove('active');
    }

    // Show the selected screen
    document.getElementById(screenId).classList.add('active');

    // Call displayData based on the selected screen dynamically
    displayData(locationsData[screenId], screenId);
    console.log(locationsData[screenId + 'Counts']);
    displayCombinationAnalysis(screenId);
    displayPredictions(screenId);
    displayStreaks(screenId);
    displayCoOccurrence(screenId);

    // Display all data co-occurrences
    displayAllDataCoOccurences(screenId);

    // Update the chart with the new location data
    updateChart(screenId);
}

// Function to read JSON data of current day keno games from data folder
async function readData(location) {
    const filePath = `data/${location}.json`;
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Could not fetch the file: ${filePath}`);
        }
        const jsonData = await response.json();
        console.log("JSON data read successfully:", jsonData);
        return jsonData;
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return null;
    }
}

async function processKenoData(location) {
    const jsonData = await readData(location);

    if (!jsonData) {
        console.error("No JSON data to process.");
        return null;
    }
    // Flatten and reorder the data
    let flattenedData = [];
    Object.keys(jsonData).reverse().forEach(date => {
        const games = jsonData[date];
        Object.keys(games).forEach(gameNumber => {
            flattenedData.push({
                kenoGameNumber: parseInt(gameNumber),
                kenoGameStats: games[gameNumber]
            });
        });
    });

    // Assign new IDs to ensure duplicate game numbers across dates are treated as separate entries
    const reformattedData = {};
    flattenedData.forEach((game, index) => {
        reformattedData[index + 1] = game.kenoGameStats;
    });

    return reformattedData;
}


let locationsData = {};
let allDataFromLocations = {};

async function loadData() {
    try {
        // Load data for all locations and store them in the locationsData object
        const omahaData = await readData('omaha');
        const lincolnData = await readData('lincoln');
        const fremontData = await readData('fremont');
        const norfolkData = await readData('norfolk');
        const blairData = await readData('blair');
        const beatriceData = await readData('beatrice');

        const allOmahaData = await processKenoData('omahaallData');
        const allLincolnData = await processKenoData('lincolnallData');
        const allFremontData = await processKenoData('fremontallData');
        const allNorfolkData = await processKenoData('norfolkallData');
        const allBlairData = await processKenoData('blairallData');
        const allBeatriceData = await processKenoData('beatriceallData');

        // Storing the data in locationsData
        locationsData['omaha'] = omahaData;
        locationsData['lincoln'] = lincolnData;
        locationsData['fremont'] = fremontData;
        locationsData['norfolk'] = norfolkData;
        locationsData['blair'] = blairData;
        locationsData['beatrice'] = beatriceData;

        allDataFromLocations['omaha'] = allOmahaData;
        allDataFromLocations['lincoln'] = allLincolnData;
        allDataFromLocations['fremont'] = allFremontData;
        allDataFromLocations['norfolk'] = allNorfolkData;
        allDataFromLocations['blair'] = allBlairData;
        allDataFromLocations['beatrice'] = allBeatriceData

        // Counting each instance of picked numbers at each location and storing them in counts object
        Object.keys(locationsData).forEach(location => {
            locationsData[location + 'Counts'] = getNumberCounts(location); // Store counts as 'locationCounts'
        });
        initializeChart();
        // Display data for Omaha on start
        displayData(locationsData['omaha'], 'omaha');
    } catch (error) {
        console.error("Error loading data: ", error);
    }
}

loadData().then(r => {});

function displayData(data, location) {
    const gameNumbers = Object.keys(data);
    const gameData = Object.values(data);
    const table = document.getElementById(location + '-keno-table');
    table.style.display = 'grid';

    // Clear any existing content
    table.innerHTML = '';

    // Create div for game numbers
    const gameNumbersDiv = document.createElement('div');
    gameNumbers.forEach((number) => {
        const p = document.createElement('p');
        p.textContent = `Game ${number}`;
        gameNumbersDiv.appendChild(p);
    });

    // Create div for game data
    const gameDataDiv = document.createElement('div');
    gameData.forEach((info) => {
        const p = document.createElement('p');
        p.textContent = Array.isArray(info) ? info.join(', ') : info;
        gameDataDiv.appendChild(p);
    });

    const locationCounts = document.createElement('div');
    const hotNumbers = locationsData[location + 'Counts'].slice(0, 5); // Get the hot numbers dynamically
    const hotNumbersTitle = document.createElement('h3');
    hotNumbersTitle.textContent = 'Hot Numbers';
    locationCounts.appendChild(hotNumbersTitle);

    hotNumbers.forEach((countInfo) => {
        const countElement = document.createElement('p');
        countElement.textContent = `Number ${countInfo.number}: ${countInfo.count} occurrences`;
        locationCounts.appendChild(countElement);
    });

    const ballFrequency = document.createElement('h3');
    ballFrequency.textContent = 'Ball Frequency';
    locationCounts.appendChild(ballFrequency);

    locationsData[location + 'Counts'].forEach((countInfo) => {
        const countElement = document.createElement('p');
        countElement.textContent = `Number ${countInfo.number}: ${countInfo.count} occurrences`;
        locationCounts.appendChild(countElement);
    });

    // Append the columns to the main container
    table.appendChild(gameNumbersDiv);
    table.appendChild(gameDataDiv);
    table.appendChild(locationCounts);
}

function hideAllGameDataTables() {
    // Select all game data tables (replace '.game-data-table' with your actual class or ID)
    const tables = document.querySelectorAll('.keno-table');

    // Loop through each table and set its display to 'none'
    tables.forEach((table) => {
        table.style.display = 'none';
    });
}

function getNumberCounts(location) {
    let locationData = locationsData[location];

    if (!locationData) {
        console.error(`Data for location ${location} not loaded.`);
        return null;
    }

    const numberCounts = new Map();

    // Process each game's data
    Object.values(locationData).forEach(gameData => {
        if (Array.isArray(gameData)) {
            gameData.forEach(number => {
                numberCounts.set(number, (numberCounts.get(number) || 0) + 1);
            });
        }
    });

    // Convert Map to an array and sort by count in descending order
    const sortedCounts = Array.from(numberCounts.entries()).sort((a, b) => b[1] - a[1]);

    // Convert back to an array of objects for better usability
    return sortedCounts.map(([number, count]) => ({ number, count }));
}



// Data processing function to format data for chart
function prepareChartData(location) {
    const counts = locationsData[location + 'Counts'];
    if (!counts) return null;

    return {
        labels: counts.map(item => `${item.number}`), // Simplified labels to just the number
        datasets: [{
            label: `Number Frequency`,
            data: counts.map(item => item.count),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
}

// Chart configuration
const chartConfig = {
    type: 'bar',
    data: null,
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        barThickness: 12, // Controls the thickness of each bar
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Keno Number Frequency',
                font: {
                    size: 16
                },
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 20,
                top: 10,
                bottom: 10
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Frequency',
                    font: {
                        size: 14
                    }
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Keno Numbers',
                    font: {
                        size: 14
                    }
                },
                ticks: {
                    padding: 5,
                    font: {
                        size: 12
                    }
                }
            }
        }
    },
};


let kenoChart = null;

// Initialize the chart
function initializeChart() {
    const ctx = document.getElementById('omaha-kenoChart').getContext('2d');
    kenoChart = new Chart(ctx, chartConfig);
    updateChart('omaha'); // Initialize with Omaha data
}

// Update the chart with new data
function updateChart(location) {
    const newData = prepareChartData(location);
    if (!newData) return;

    if (kenoChart) {
        kenoChart.data = newData;
        kenoChart.options.plugins.title.text = `${location.charAt(0).toUpperCase() + location.slice(1)} Keno Number Frequency`;
        kenoChart.update();
    }
}

// Different algorithms to analyze number combinations

function analyzeNumberCombinations(location) {
    const locationData = locationsData[location];
    if (!locationData) {
        console.error(`Data for location ${location} not found`);
        return null;
    }

    // Create a map to store combinations and their frequencies
    const combinationCounts = new Map();

    // Process each game's data
    Object.values(locationData).forEach(gameNumbers => {
        if (!Array.isArray(gameNumbers)) return;

        // Generate all possible combinations of 3 numbers from this game
        for (let i = 0; i < gameNumbers.length - 2; i++) {
            for (let j = i + 1; j < gameNumbers.length - 1; j++) {
                for (let k = j + 1; k < gameNumbers.length; k++) {
                    // Sort numbers to ensure consistent combination keys
                    const combo = [gameNumbers[i], gameNumbers[j], gameNumbers[k]].sort((a, b) => a - b);
                    const comboKey = combo.join('-');

                    combinationCounts.set(comboKey, (combinationCounts.get(comboKey) || 0) + 1);
                }
            }
        }
    });

    // Convert the map to an array and sort by frequency
    const sortedCombinations = Array.from(combinationCounts.entries())
        .map(([combo, count]) => ({
            numbers: combo.split('-').map(Number),
            count: count,
            // Calculate the individual frequency score of each number
            individualScore: combo.split('-')
                .map(Number)
                .reduce((sum, num) => {
                    const individualCount = locationsData[location + 'Counts']
                        .find(item => item.number === num)?.count || 0;
                    return sum + individualCount;
                }, 0)
        }))
        .sort((a, b) => {
            // Primary sort by combination frequency
            if (b.count !== a.count) return b.count - a.count;
            // Secondary sort by individual number frequencies
            return b.individualScore - a.individualScore;
        });

    // Calculate confidence score for each combination
    const totalGames = Object.keys(locationData).length;
    const topCombinations = sortedCombinations.slice(0, 10).map(combo => ({
        numbers: combo.numbers,
        occurrences: combo.count,
        confidence: (combo.count / totalGames * 100).toFixed(2),
        avgIndividualFrequency: (combo.individualScore / 3).toFixed(2)
    }));

    return topCombinations;
}

// Function to display the results
function displayCombinationAnalysis(location) {
    const combinations = analyzeNumberCombinations(location);
    if (!combinations) return;

    console.log(`Top number combinations for ${location}:`);
    combinations.forEach((combo, index) => {
        console.log(`
            Combination ${index + 1}:
            Numbers: ${combo.numbers.join(', ')}
            Occurrences: ${combo.occurrences}
            Confidence: ${combo.confidence}%
            Avg Individual Frequency: ${combo.avgIndividualFrequency}
        `);
    });

    return combinations;
}



// Time series analysis to detect patterns in recent games
function analyzeRecentTrends(location, windowSize = 10) {
    const locationData = locationsData[location];
    if (!locationData) return null;

    const games = Object.entries(locationData)
        .sort((a, b) => Number(b[0]) - Number(a[0])) // Sort by game number descending
        .slice(0, windowSize) // Get most recent games
        .flatMap(([_, numbers]) => numbers);

    // Count frequencies in recent window
    const recentCounts = new Map();
    games.forEach(num => {
        recentCounts.set(num, (recentCounts.get(num) || 0) + 1);
    });

    return Array.from(recentCounts.entries())
        .map(([number, count]) => ({
            number: Number(number),
            recentFrequency: count,
            momentum: count / windowSize
        }))
        .sort((a, b) => b.momentum - a.momentum);
}

// Gap analysis to find "due" numbers
function analyzeNumberGaps(location) {
    const locationData = locationsData[location];
    if (!locationData) return null;

    const games = Object.entries(locationData)
        .sort((a, b) => Number(b[0]) - Number(a[0])); // Sort by game number descending

    const gapAnalysis = new Map();
    const currentGaps = new Map();

    // Initialize gaps for all possible keno numbers (1-80)
    for (let i = 1; i <= 80; i++) {
        currentGaps.set(i, 0);
    }

    // Calculate gaps between appearances
    games.forEach(([_, numbers]) => {
        // Increment gaps for all numbers
        currentGaps.forEach((gap, number) => {
            currentGaps.set(number, gap + 1);
        });

        // Reset gap for numbers that appeared
        numbers.forEach(num => {
            const gap = currentGaps.get(num);
            gapAnalysis.set(num, (gapAnalysis.get(num) || []).concat(gap));
            currentGaps.set(num, 0);
        });
    });

    // Calculate average gaps and current gaps
    return Array.from(gapAnalysis.entries())
        .map(([number, gaps]) => {
            const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
            return {
                number: Number(number),
                currentGap: currentGaps.get(Number(number)),
                averageGap: avgGap,
                gapRatio: currentGaps.get(Number(number)) / avgGap
            };
        })
        .sort((a, b) => b.gapRatio - a.gapRatio);
}

// Hot/Cold analysis with weighted recent performance
function analyzeHotColdPatterns(location, recentWeight = 2) {
    const locationData = locationsData[location];
    if (!locationData) return null;

    const games = Object.entries(locationData)
        .sort((a, b) => Number(b[0]) - Number(a[0]));

    const recentGames = games.slice(0, 20);  // Last 20 games
    const olderGames = games.slice(20);      // Older games

    // Calculate weighted frequencies
    const numberAnalysis = new Map();

    // Process recent games with higher weight
    recentGames.forEach(([_, numbers]) => {
        numbers.forEach(num => {
            numberAnalysis.set(num, (numberAnalysis.get(num) || 0) + recentWeight);
        });
    });

    // Process older games with normal weight
    olderGames.forEach(([_, numbers]) => {
        numbers.forEach(num => {
            numberAnalysis.set(num, (numberAnalysis.get(num) || 0) + 1);
        });
    });

    return Array.from(numberAnalysis.entries())
        .map(([number, score]) => ({
            number: Number(number),
            weightedScore: score,
            recentPerformance: recentGames.filter(([_, nums]) =>
                nums.includes(Number(number))).length / 20
        }))
        .sort((a, b) => b.weightedScore - a.weightedScore);
}

// Combine all analyses to generate final predictions
function generatePredictions(location) {
    const recentTrends = analyzeRecentTrends(location);
    const gapAnalysis = analyzeNumberGaps(location);
    const hotCold = analyzeHotColdPatterns(location);

    // Normalize and combine scores
    const combinedScores = new Map();

    // Helper function to normalize scores
    const normalizeScores = (array, scoreKey) => {
        const max = Math.max(...array.map(item => item[scoreKey]));
        return array.map(item => ({
            number: item.number,
            score: item[scoreKey] / max
        }));
    };

    // Combine normalized scores
    const normalizedTrends = normalizeScores(recentTrends, 'momentum');
    const normalizedGaps = normalizeScores(gapAnalysis, 'gapRatio');
    const normalizedHotCold = normalizeScores(hotCold, 'weightedScore');

    // Calculate combined scores with weights
    [
        { data: normalizedTrends, weight: 0.4 },
        { data: normalizedGaps, weight: 0.3 },
        { data: normalizedHotCold, weight: 0.3 }
    ].forEach(({ data, weight }) => {
        data.forEach(({ number, score }) => {
            combinedScores.set(
                number,
                (combinedScores.get(number) || 0) + score * weight
            );
        });
    });

    // Return final predictions
    return Array.from(combinedScores.entries())
        .map(([number, score]) => ({
            number: Number(number),
            score: score.toFixed(3),
            confidence: (score * 100).toFixed(1) + '%',
            recentTrend: recentTrends.find(t => t.number === Number(number))?.momentum || 0,
            gapAnalysis: gapAnalysis.find(g => g.number === Number(number))?.gapRatio || 0,
            hotColdScore: hotCold.find(h => h.number === Number(number))?.weightedScore || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

// Function to display predictions
function displayPredictions(location) {
    const predictions = generatePredictions(location);

    console.log(`\nTop predicted numbers for ${location}:`);
    predictions.forEach((pred, index) => {
        console.log(`
            Number ${index + 1}: ${pred.number}
            Confidence: ${pred.confidence}
            Recent Trend Score: ${pred.recentTrend.toFixed(2)}
            Gap Analysis Score: ${pred.gapAnalysis.toFixed(2)}
            Hot/Cold Score: ${pred.hotColdScore.toFixed(2)}
        `);
    });

    return predictions;
}

function analyzeStreaks(location) {
    const locationData = locationsData[location];
    if (!locationData) return null;

    const streaks = new Map();
    const games = Object.values(locationData);

    games.forEach(numbers => {
        numbers.forEach(num => {
            if (!streaks.has(num)) streaks.set(num, { current: 0, max: 0 });
            streaks.get(num).current += 1;
            streaks.get(num).max = Math.max(streaks.get(num).current, streaks.get(num).max);
        });

        // Reset streaks for missing numbers
        streaks.forEach((streak, num) => {
            if (!numbers.includes(num)) streak.current = 0;
        });
    });

    return Array.from(streaks.entries())
        .map(([number, { max }]) => ({ number, maxStreak: max }))
        .sort((a, b) => b.maxStreak - a.maxStreak);
}

// Function to display streaks
function displayStreaks(location) {
    const predictions = analyzeStreaks(location);

    console.log(`\nNumber Streaks for: ${location}:`);
    predictions.forEach((pred, index) => {
        console.log(pred);
    });

    return predictions;
}

function analyzeNumberCoOccurrence(location) {
    const locationData = locationsData[location];
    if (!locationData) return null;

    const coOccurrenceMap = new Map();
    const games = Object.values(locationData);

    games.forEach(numbers => {
        numbers.forEach((num1, i) => {
            for (let j = i + 1; j < numbers.length; j++) {
                const num2 = numbers[j];
                const key = [num1, num2].sort((a, b) => a - b).join('-');

                coOccurrenceMap.set(key, (coOccurrenceMap.get(key) || 0) + 1);
            }
        });
    });

    return Array.from(coOccurrenceMap.entries())
        .map(([pair, count]) => ({
            pair: pair.split('-').map(Number),
            frequency: count
        }))
        .sort((a, b) => b.frequency - a.frequency);
}

// Function to display co-occurrence results
function displayCoOccurrence(location) {
    const predictions = analyzeNumberCoOccurrence(location);

    console.log(`\nNumber Co-Occurrences for: ${location}:`);
    const trimmedPreds = predictions.slice(0, 10);
    trimmedPreds.forEach((pred, index) => {
        console.log(pred);
    });

    return predictions;
}


function analyzeNumberCoOccurrenceOfAllData(location) {
    const locationData = allDataFromLocations[location];
    if (!locationData) return null;

    const coOccurrenceMap = new Map();
    const games = Object.values(locationData);

    games.forEach(numbers => {
        numbers.forEach((num1, i) => {
            for (let j = i + 1; j < numbers.length; j++) {
                const num2 = numbers[j];
                const key = [num1, num2].sort((a, b) => a - b).join('-');

                coOccurrenceMap.set(key, (coOccurrenceMap.get(key) || 0) + 1);
            }
        });
    });

    return Array.from(coOccurrenceMap.entries())
        .map(([pair, count]) => ({
            pair: pair.split('-').map(Number),
            frequency: count
        }))
        .sort((a, b) => b.frequency - a.frequency);
}

// Function to display co-occurrence results for ALL data
function displayAllDataCoOccurences(location) {
    const predictions = analyzeNumberCoOccurrenceOfAllData(location);

    console.log(`\nNumber Co-Occurrences of the last 5 days for: ${location}:`);
    const trimmedPreds = predictions.slice(0, 10);
    trimmedPreds.forEach((pred, index) => {
        console.log(pred);
    });

    return predictions;
}

