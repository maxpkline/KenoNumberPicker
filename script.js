let omahaData;
let lincolnData;
let fremontData;
let norfolkData;
let blairData;
let beatriceData;

// Function to show the selected screen
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
    if(screenId === 'omaha') {
        displayData(omahaData, 'omaha');
    } else if (screenId === 'lincoln') {
        displayData(lincolnData, 'lincoln');
    } else if (screenId === 'fremont') {
        displayData(fremontData, 'fremont');
    } else if (screenId === 'norfolk') {
        displayData(norfolkData, 'norfolk');
    } else if (screenId === 'blair') {
        displayData(blairData, 'blair');
    } else if (screenId === 'beatrice') {
        displayData(beatriceData, 'beatrice');
    } else {
        displayData(omahaData, 'omaha');
    }
}

// Function to read JSON data of keno games from data folder
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

// Function to load in all the data on start
async function loadData() {
    omahaData = await readData('omaha');
    lincolnData = await readData('lincoln');
    fremontData = await readData('fremont');
    norfolkData = await readData('norfolk');
    blairData = await readData('blair');
    beatriceData = await readData('beatrice');
    displayData(omahaData, 'omaha');
}

loadData().then(r => {});

// Function to display the data on the screen
function displayData(data, location) {
    const gameNumbers = Object.keys(data);
    const gameData = Object.values(data);
    const table = document.getElementById(location +'-keno-table');
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
        p.textContent = info;
        if (Array.isArray(info)) {
            p.textContent = info.join(', ');
        } else {
            p.textContent = info; // Default case if info is not an array
        }
        gameDataDiv.appendChild(p);
    });

    // Append the columns to the main container
    table.appendChild(gameNumbersDiv);
    table.appendChild(gameDataDiv);
}

function hideAllGameDataTables() {
    // Select all game data tables (replace '.game-data-table' with your actual class or ID)
    const tables = document.querySelectorAll('.keno-table');

    // Loop through each table and set its display to 'none'
    tables.forEach((table) => {
        table.style.display = 'none';
    });
}