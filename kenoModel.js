import * as tf from '@tensorflow/tfjs';

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

const kenoData = processKenoData('omahaallData'); // whatever location

const preprocessData = (data) => {
    const games = Object.values(data);
    const inputs = [];
    const labels = [];

    for (let i = 0; i < games.length - 1; i++) {
        // Input: current game numbers
        inputs.push(games[i]);
        // Label: next game's numbers (what to predict)
        labels.push(games[i + 1]);
    }

    return {
        inputs: tf.tensor2d(inputs, [inputs.length, games[0].length]),
        labels: tf.tensor2d(labels, [labels.length, games[0].length]),
    };
};

// preprocess data and define model
const { inputs, labels } = preprocessData(kenoData);

const model = tf.sequential();

// Input layer
model.add(tf.layers.dense({ units: 128, inputShape: [20], activation: 'relu' }));

// Hidden layers
model.add(tf.layers.dense({ units: 64, activation: 'relu' }));

// Output layer
model.add(tf.layers.dense({ units: 20, activation: 'softmax' })); // Predict next game numbers

// Compile the model
model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
});

// Train the model
async function trainModel(model, inputs, labels) {
    await model.fit(inputs, labels, {
        epochs: 50,           // Number of training iterations
        batchSize: 32,        // Training batch size
        validationSplit: 0.2, // Use 20% of data for validation
        callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 })
    });
}

trainModel(model, inputs, labels).then(() => {
    console.log('Model trained!');
});

const predictNextGame = (model, inputData) => {
    const inputTensor = tf.tensor2d([inputData]);
    const prediction = model.predict(inputTensor);
    prediction.print();  // Probabilities of next numbers
};

predictNextGame(model, kenoData);