const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// URLs for different Big Red Keno locations
const urls = ['https://results.bigredkeno.com/?community=omaha', 'https://results.bigredkeno.com/?community=lincoln', 'https://results.bigredkeno.com/?community=fremont', 'https://results.bigredkeno.com/?community=norfolk', 'https://results.bigredkeno.com/?community=blair', 'https://results.bigredkeno.com/?community=beatrice'];

// Function to scrape data from all BRK locations
async function scrapeAllLocations() {
    for (let i = 0; i < urls.length; i++) {
        console.log('Scraping location:', urls[i]);
        const location = urls[i].split('community=')[1];
        await scrapeKenoTable(urls[i], location);
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
        fs.writeFileSync(`./data/${location}.json`, JSON.stringify(tableData, null, 2));
        console.log(`Successfully scraped keno results and saved to ${location}.json`);

        //Print a sample of the data
        console.log('Sample of data structure:');
        const sampleKeys = Object.keys(tableData).slice(0);
        console.log(sampleKeys);
        console.log('\n');

    } catch (error) {
        console.error('Error scraping keno results:', error);
    }
}

async function scrapeAllDates(url, location, browser) {
    const page = await browser.newPage();
    await page.goto(url);
    console.log(`Scraping ${location}...`);

    // Get all available dates from the dropdown
    const dates = await page.$$eval('#ddlDate option', options =>
        options.map(option => ({ date: option.value, selected: option.selected }))
    );

    const allData = {};

    for (let { date } of dates) {
        console.log(`Scraping data for ${date}...`);

        // Select a date in the dropdown and wait for the table to reload
        await page.select('#ddlDate', date);
        await page.waitForNetworkIdle(); // Wait for the page to load the new data

        // Scrape the table data
        const tableData = await page.$$eval('#resulttable table tbody tr', rows =>
            rows.map(row => {
                const columns = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
                const gameNumber = columns.shift(); // First column is game number
                return { gameNumber, numbers: columns };
            }).reduce((acc, { gameNumber, numbers }) => {
                acc[gameNumber] = numbers;
                return acc;
            }, {})
        );

        allData[date] = tableData;
    }

    // Save the collected data
    const outputDir = path.resolve(__dirname, './data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    fs.writeFileSync(path.join(outputDir, `${location}AllData.json`), JSON.stringify(allData, null, 2));
    console.log(`Data for ${location} saved.`);
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    await scrapeAllLocations();
    try {
        for (const url of urls) {
            const location = url.split('community=')[1];
            await scrapeAllDates(url, location, browser);
        }
        console.log("Finished scraping all data.");
    } catch (error) {
        console.error('Error scraping data:', error);
    } finally {
        await browser.close();
    }
})();