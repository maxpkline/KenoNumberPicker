document.addEventListener('DOMContentLoaded', function () {
    const divs = [
        'omaha-keno-title',
        'omaha-keno-table',
        'omaha-kenoChart',
        'omaha-combination-table',
        'omaha-predictions-table',
        'omaha-cooccurrence-table',
        'omaha-cooccurrence-table-all-data',
        'omaha-streaks-table',
        'omaha-model-training',
        'omaha-model-prediction'
    ];

    divs.forEach(divId => {
        const element = document.getElementById(divId);
        if (element) {
            // Create a wrapper for the toggle state
            const wrapper = document.createElement('div');
            wrapper.className = 'toggle-wrapper';
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);

            // Add a toggle indicator
            const indicator = document.createElement('div');
            indicator.className = 'toggle-indicator';
            wrapper.appendChild(indicator);

            // Add a data attribute for the dynamic message
            wrapper.dataset.toggleMessage = `Click to expand the: ${divId.replace(/-/g, ' ')}`;

            // Add click event listener to the wrapper
            wrapper.addEventListener('click', function (e) {
                e.stopPropagation();
                if (this.classList.contains('collapsed')) {
                    this.classList.remove('collapsed');
                } else {
                    this.classList.add('collapsed');
                }
            });
        }
    });
});

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

    if(screenId === 'payouts') {
        await showPayouts();
        return;
    }

    // Call displayData based on the selected screen dynamically
    displayData(locationsData[screenId], screenId);
    console.log(locationsData[screenId + 'Counts']);
    displayCombinationAnalysis(screenId);
    displayPredictions(screenId);
    displayStreaks(screenId);
    displayCoOccurrence(screenId);

    // Display all data statistics
    displayAllDataCoOccurences(screenId);

    // Update the chart with the new location data
    updateChart(screenId);
}

const kenoGameNames = {
    "topBottom": "Top/Bottom & Left/Right",
    "highRollers": "High Rollers",
    "winnerTakeAll": "Winner Take All",
    "20Spot": "20 Spot",
    "pennyKeno": "Penny Keno",
    "70sKeno": "70's Keno",
    "hogWild": "Hog Wild",
    "quarterMania": "Quarter Mania",
    "regularKeno": "Regular Keno"
};

let currentGame = '';
let currentPayoutData = null;

function calculatePayouts(kenoGameType) {
    currentGame = kenoGameType;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const payoutCalculator = document.getElementById('payout-calculator');
    const picksGenerator = document.getElementById('picks-generator');

    modalTitle.textContent = `Calculate Payouts - ${kenoGameNames[kenoGameType]}`;
    payoutCalculator.style.display = 'block';
    picksGenerator.style.display = 'none';

    // Populate spot count dropdown based on game type
    const spotSelect = document.getElementById('spot-count');
    spotSelect.innerHTML = '';

    readData('payoutData').then(data => {
        currentPayoutData = data[kenoGameType];
        Object.keys(data[kenoGameType].payouts).forEach(spot => {
            const option = document.createElement('option');
            option.value = spot;
            option.textContent = `${spot} Spot`;
            spotSelect.appendChild(option);
        });
    });

    modal.style.display = 'block';
}

function calculatePotentialPayouts() {
    const spotCount = document.getElementById('spot-count').value;
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    const numGames = parseInt(document.getElementById('game-amount').value);
    const resultsDiv = document.getElementById('payout-results');

    if (!betAmount || betAmount < currentPayoutData.denominations.minimumBet && betAmount*numGames < currentPayoutData.denominations.minimumBet) {
        resultsDiv.innerHTML = `Minimum bet amount is $${currentPayoutData.denominations.minimumBet}`;
        return;
    }

    const payouts = currentPayoutData.payouts[spotCount];
    let resultsHTML = '<div>Potential Payouts: \n\n</div>';
    resultsHTML.className = 'payout-results';
    // resultsHTML.style.whiteSpace = 'pre';

    Object.entries(payouts).reverse().forEach(([matches, basePayout]) => {
        const payout = basePayout * betAmount / currentPayoutData.denominations.dollar;
        const actualPayout = Number.isInteger(payout) ? payout : payout.toFixed(2);
        console.log('matches:', matches);
        console.log('spotCount:', spotCount);

        const singleGameProb = probabilityOfHitting(parseInt(matches), parseInt(spotCount));
        let probOfHitting = 0;
        if (numGames > 1) {
            const probAtLeastOnce = probabilityAcrossGames(parseInt(matches), parseInt(spotCount), numGames);
            probOfHitting = probAtLeastOnce < 1e-3 ?
                probAtLeastOnce.toExponential(2) + "%" :
                (probAtLeastOnce * 100).toFixed(2) + "%";
        } else {
            probOfHitting = singleGameProb < 1e-3 ?
                singleGameProb.toExponential(2) + "%" :
                (singleGameProb * 100).toFixed(2) + "%";
        }

        console.log(probOfHitting);
        resultsHTML += `<div>Hit ${matches}: $${actualPayout} \tProbability: ${probOfHitting}</div>`;
    });

    resultsDiv.innerHTML = resultsHTML;
}

// function to calculate probability of hitting single game
function probabilityOfHitting(matches, spotCount) {
    // Function to calculate combinations (n choose k)
    function combinations(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;

        let result = 1;
        for (let i = 1; i <= k; i++) {
            result *= (n - i + 1) / i;
        }
        return result;
    }

    // Total numbers in keno game
    const totalNumbers = 80;
    // Numbers drawn each round
    const numbersDrawn = 20;

    // Calculate probability using hypergeometric distribution
    // P(X = matches) = [C(numbersDrawn, matches) * C(totalNumbers - numbersDrawn, spotCount - matches)] / C(totalNumbers, spotCount)

    const numerator = combinations(numbersDrawn, matches) *
        combinations(totalNumbers - numbersDrawn, spotCount - matches);
    const denominator = combinations(totalNumbers, spotCount);

    // Handle edge cases
    if (denominator === 0) return 0;
    if (matches > spotCount) return 0;
    if (matches > numbersDrawn) return 0;
    if (spotCount > totalNumbers) return 0;

    return numerator / denominator;
}

function probabilityAcrossGames(matches, spotCount, numGames) {
    const singleGameProb = probabilityOfHitting(matches, spotCount);

    // Calculate probability of NOT hitting in any game
    const probNone = Math.pow(1 - singleGameProb, numGames);

    // Return probability of hitting at least once
    return 1 - probNone;
}

function generatePicks(kenoGameType) {
    currentGame = kenoGameType;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const payoutCalculator = document.getElementById('payout-calculator');
    const picksGenerator = document.getElementById('picks-generator');

    modalTitle.textContent = `Generate Picks - ${kenoGameNames[kenoGameType]}`;
    payoutCalculator.style.display = 'none';
    picksGenerator.style.display = 'block';

    modal.style.display = 'block';
}

function generateNumberPicks() {
    const numberOfPicks = parseInt(document.getElementById('number-of-picks').value);
    const resultsDiv = document.getElementById('picks-results');

    // Example implementation - you'll want to modify this based on your game rules
    let resultsHTML = '<h3>Generated Picks:</h3>';

    for (let i = 0; i < numberOfPicks; i++) {
        const numbers = new Set();
        while (numbers.size < 20) { // Assuming 20 numbers per pick
            numbers.add(Math.floor(Math.random() * 80) + 1);
        }
        resultsHTML += `<div>Pick ${i + 1}: ${Array.from(numbers).sort((a, b) => a - b).join(', ')}</div>`;
    }

    resultsDiv.innerHTML = resultsHTML;
}


document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementsByClassName('close')[0];

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
});



 async function showPayouts() {
    const data = await readData('payoutData');
    const container = document.getElementById('payouts-table');

    Object.keys(data).forEach((game, index) => {
        // Create a section for each game type
        const gameSection = document.createElement('section');
        gameSection.className = 'game-type';

        // Add game type header
        const gameHeader = document.createElement('div');
        gameHeader.className = 'game-header';
        let gameName = kenoGameNames[game];
        gameHeader.textContent = gameName || game;
        gameSection.appendChild(gameHeader);

        // Add denomination info
        const denomInfo = document.createElement('div');
        denomInfo.className = 'denomination-info';
        denomInfo.textContent = `Minimum denomination: $${data[game].denominations.dollar}`;
        const minimumTicketInfo = document.createElement('div');
        minimumTicketInfo.className = 'minimum-ticket-info';
        minimumTicketInfo.textContent = `Minimum Ticket: $${data[game].denominations.minimumBet}`;
        denomInfo.appendChild(minimumTicketInfo);
        gameSection.appendChild(denomInfo);

        // add buttons for each game type
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'payout-buttons-div';

        const calculatePayoutButton = document.createElement('button');
        calculatePayoutButton.className = 'button';
        calculatePayoutButton.onclick = () => calculatePayouts(game);
        calculatePayoutButton.textContent = 'Calculate Payout';

        const generatePicksButton = document.createElement('button');
        generatePicksButton.className = 'button';
        generatePicksButton.onclick = () => generatePicks(game);
        generatePicksButton.textContent = 'Generate Picks';

        buttonsDiv.appendChild(calculatePayoutButton);
        buttonsDiv.appendChild(generatePicksButton);

        gameSection.appendChild(buttonsDiv);

        const payoutTable = document.createElement('div');
        payoutTable.className = 'payout-table';

        Object.keys(data[game].payouts).forEach(spot => {
            const spotSection = document.createElement('div');
            spotSection.className = 'spot-section';
            const spotHeader = document.createElement('div');
            spotHeader.className = 'spot-header';
            spotHeader.textContent = `Pick ${spot}`;
            spotSection.appendChild(spotHeader);

            let checkedOnce = false;

            Object.entries(data[game].payouts[spot]).reverse().forEach(([matches, payout]) => {
                const payoutDiv = document.createElement('div');
                payoutDiv.className = 'payout-entry';
                if(!checkedOnce) {
                    checkedOnce = true;
                    payoutDiv.textContent = `Hit \t ${matches}: \t $ ${payout || payout.toFixed(2)}`;
                    spotSection.appendChild(payoutDiv);
                } else {
                    payoutDiv.textContent = `\t ${matches}: \t $ ${payout || payout.toFixed(2)}`;
                    spotSection.appendChild(payoutDiv);
                }

            });
            payoutTable.appendChild(spotSection);
        });
        gameSection.appendChild(payoutTable);
        container.appendChild(gameSection);
    });
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
        displayCombinationAnalysis('omaha');
        displayPredictions('omaha');
        displayStreaks('omaha');
        displayCoOccurrence('omaha');

        // Display all data statistics
        displayAllDataCoOccurences('omaha');
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
        indexAxis: 'x',
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


// Function to display the results and update the screen
function displayCombinationAnalysis(location) {
    const combinations = analyzeNumberCombinations(location);
    if (!combinations) return;

    const table = document.getElementById(location + '-combination-table');
    table.style.display = 'grid';

    // Clear any existing content
    table.innerHTML = '';

    // Create and append a header
    const header = document.createElement('div');
    header.className = 'combination-header header-span';
    header.textContent = `Top Number Combinations for ${location}`;
    table.appendChild(header);

    // Append combination data
    combinations.forEach((combo, index) => {
        const combinationDiv = document.createElement('div');
        combinationDiv.className = 'combination-entry';

        const title = document.createElement('h4');
        title.textContent = `Combination ${index + 1}`;
        combinationDiv.appendChild(title);

        const numbers = document.createElement('p');
        numbers.textContent = `Numbers: ${combo.numbers.join(', ')}`;
        combinationDiv.appendChild(numbers);

        const occurrences = document.createElement('p');
        occurrences.textContent = `Occurrences: ${combo.occurrences}`;
        combinationDiv.appendChild(occurrences);

        const confidence = document.createElement('p');
        confidence.textContent = `Confidence: ${combo.confidence}%`;
        combinationDiv.appendChild(confidence);

        // const avgFreq = document.createElement('p');
        // avgFreq.textContent = `Avg Individual Frequency: ${combo.avgIndividualFrequency}`;
        // combinationDiv.appendChild(avgFreq);

        table.appendChild(combinationDiv);
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

// Function to display predictions and update the screen
function displayPredictions(location) {
    const predictions = generatePredictions(location);
    if (!predictions) return;

    const table = document.getElementById(location + '-predictions-table');
    table.style.display = 'grid';

    // Clear any existing content
    table.innerHTML = '';

    // Create and append a header
    const header = document.createElement('div');
    header.className = 'predictions-header header-span';
    header.textContent = `Top Predicted Numbers for ${location}`;
    table.appendChild(header);

    // Append prediction data
    predictions.forEach((pred, index) => {
        const predictionDiv = document.createElement('div');
        predictionDiv.className = 'prediction-entry';

        const title = document.createElement('h4');
        title.textContent = `Prediction ${index + 1}`;
        predictionDiv.appendChild(title);

        const number = document.createElement('p');
        number.textContent = `Number: ${pred.number}`;
        predictionDiv.appendChild(number);

        const confidence = document.createElement('p');
        confidence.textContent = `Confidence: ${pred.confidence}`;
        predictionDiv.appendChild(confidence);

        const trend = document.createElement('p');
        trend.textContent = `Recent Trend Score: ${pred.recentTrend.toFixed(2)}`;
        predictionDiv.appendChild(trend);

        const gapAnalysis = document.createElement('p');
        gapAnalysis.textContent = `Gap Analysis Score: ${pred.gapAnalysis.toFixed(2)}`;
        predictionDiv.appendChild(gapAnalysis);

        const hotCold = document.createElement('p');
        hotCold.textContent = `Hot/Cold Score: ${pred.hotColdScore.toFixed(2)}`;
        predictionDiv.appendChild(hotCold);

        table.appendChild(predictionDiv);
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
    const trimmedPreds = predictions.slice(0, 10);
    const table = document.getElementById(location + '-streaks-table');
    table.style.display = 'grid';

    // Clear any existing content
    table.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'streak-header header-span';
    header.textContent = `Number Streaks for ${location}`;
    table.appendChild(header);

    console.log(`\nNumber Streaks for: ${location}:`);
    trimmedPreds.forEach((pred, index) => {
        const streakDiv = document.createElement('div');
        streakDiv.className = 'streak-entry';
        streakDiv.textContent = pred.number + ': ' + pred.maxStreak;
        table.appendChild(streakDiv);
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

// Function to display number co-occurrences and update the screen
function displayCoOccurrence(location) {
    const predictions = analyzeNumberCoOccurrence(location);
    if (!predictions || predictions.length === 0) {
        console.error(`No predictions available for location: ${location}`);
        return;
    }

    const table = document.getElementById(location + '-cooccurrence-table');
    table.style.display = 'grid';

    // Clear any existing content
    table.innerHTML = '';

    // Create and append a header
    const header = document.createElement('div');
    header.className = 'cooccurrence-header header-span';
    header.textContent = `Top Number Co-Occurrences for ${location}`;
    table.appendChild(header);

    // Trim predictions to the top 10 for display
    const trimmedPreds = predictions.slice(0, 10);

    // Append co-occurrence data with validation
    trimmedPreds.forEach((pred, index) => {
        if (!pred) {
            console.warn(`Invalid prediction entry at index ${index}`, pred);
            return;
        }

        const coOccurrenceDiv = document.createElement('div');
        coOccurrenceDiv.className = 'cooccurrence-entry';

        const title = document.createElement('h4');
        title.textContent = `Co-Occurrence ${index + 1}`;
        coOccurrenceDiv.appendChild(title);

        const numbers = document.createElement('p');
        numbers.textContent = `Numbers: ${pred.pair.join(', ')}`;
        coOccurrenceDiv.appendChild(numbers);

        const frequency = document.createElement('p');
        frequency.textContent = 'Frequency: ' + pred.frequency;
        coOccurrenceDiv.appendChild(frequency);

        table.appendChild(coOccurrenceDiv);
    });

    return predictions;
}



// functions to analyze number combinations of ALL data

function analyzeNumberCombinationsOfAllData(location) {
    const locationData = allDataFromLocations[location];
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
function displayCombinationAnalysisOfAllData(location) {
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
function analyzeRecentTrendsOfAllData(location, windowSize = 10) {
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
function analyzeNumberGapsOfAllData(location) {
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
function analyzeHotColdPatternsOfAllData(location, recentWeight = 2) {
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
function generatePredictionsofAllData(location) {
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
function displayPredictionsOfAllData(location) {
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

function analyzeStreaksOfAllData(location) {
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
function displayStreaksOfAllData(location) {
    const predictions = analyzeStreaks(location);

    console.log(`\nNumber Streaks for: ${location}:`);
    predictions.forEach((pred, index) => {
        console.log(pred);
    });

    return predictions;
}


// works now
function analyzeNumberCoOccurrenceOfAllData(location) {
    const locationData = allDataFromLocations[location];
    if (!locationData) return null;

    const coOccurrenceMap = new Map();
    const games = Object.values(locationData);

    // Add debugging
    console.log('Games:', games);

    games.forEach((game, index) => {
        // Add type checking
        if (!game || !Array.isArray(game.numbers)) {
            console.log(`Warning: Element at index ${index} is invalid:`, game);
            return; // Skip this iteration
        }

        const numbers = game.numbers;
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


// Function to display number co-occurrences and update the screen
function displayAllDataCoOccurences(location) {
    const predictions = analyzeNumberCoOccurrenceOfAllData(location);
    if (!predictions || predictions.length === 0) {
        console.error(`No predictions available for location: ${location}`);
        return;
    }

    const table = document.getElementById(location + '-cooccurrence-table-all-data');
    table.style.display = 'grid';

    // Clear any existing content
    table.innerHTML = '';

    // Create and append a header
    const header = document.createElement('div');
    header.className = 'cooccurrence-header header-span';
    header.textContent = `Top Number Co-Occurrences for ${location}`;
    table.appendChild(header);

    // Trim predictions to the top 10 for display
    const trimmedPreds = predictions.slice(0, 10);

    // Append co-occurrence data with validation
    trimmedPreds.forEach((pred, index) => {
        if (!pred) {
            console.warn(`Invalid prediction entry at index ${index}`, pred);
            return;
        }

        const coOccurrenceDiv = document.createElement('div');
        coOccurrenceDiv.className = 'cooccurrence-entry';

        const title = document.createElement('h4');
        title.textContent = `Co-Occurrence ${index + 1}`;
        coOccurrenceDiv.appendChild(title);

        const numbers = document.createElement('p');
        numbers.textContent = `Numbers: ${pred.pair.join(', ')}`;
        coOccurrenceDiv.appendChild(numbers);

        const frequency = document.createElement('p');
        frequency.textContent = 'Frequency: ' + pred.frequency;
        coOccurrenceDiv.appendChild(frequency);

        table.appendChild(coOccurrenceDiv);
    });

    return predictions;
}
