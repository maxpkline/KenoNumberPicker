const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// URLs for different Big Red Keno locations
const urls = ['https://results.bigredkeno.com/?community=omaha', 'https://results.bigredkeno.com/?community=lincoln', 'https://results.bigredkeno.com/?community=fremont', 'https://results.bigredkeno.com/?community=norfolk', 'https://results.bigredkeno.com/?community=blair', 'https://results.bigredkeno.com/?community=beatrice'];

// Function to scrape data from all BRK locations
async function scrapeAllLocations() {
    for (let i = 0; i < urls.length; i++) {
        const location = urls[i].split('community=')[1];
        await scrapeKenoTable(urls[i], location);
        console.log('Scraped location:', urls[i]);
    }
}

// Function which scrapes the BRK results table
async function scrapeKenoTable(url, location) {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        // Create an object instead of an array to store the data
        const tableData = {};

        $('#resulttable table tbody tr').each((index, row) => {
            const rowData = [];
            $(row).find('td').each((i, cell) => {
                rowData.push($(cell).text().trim());
            });

            if (rowData.length > 0) {
                // Use the first element (game number) as the key and remove it from the numbers array
                const gameNumber = rowData.shift();
                // Store remaining numbers under that game number
                tableData[gameNumber] = rowData;
            }
        });

        // Save to JSON file
        fs.writeFileSync(`${location}.json`, JSON.stringify(tableData, null, 2));
        console.log('Successfully scraped keno results and saved to keno_results.json');

        // Optional: Print a sample of the data
        console.log('Sample of data structure:');
        const sampleKeys = Object.keys(tableData).slice(0, 2);
        const sample = {};
        sampleKeys.forEach(key => {
            sample[key] = tableData[key];
        });
        console.log(sample);

    } catch (error) {
        console.error('Error scraping keno results:', error);
    }
}

scrapeAllLocations();