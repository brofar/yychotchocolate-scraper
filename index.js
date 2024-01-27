const cheerio = require('cheerio');
const fs = require("fs");

const base = 'https://yychotchocolate.com';

(async () => {
    // Get raw page data
    let body;

    const filename = "coco.html";
    if (!fs.existsSync(filename)) {
        // Get webpage if we don't have it cached
        console.log("Making a live call.")
        const url = base + '/contestants';
        const response = await fetch(url);
        body = await response.text();
        fs.writeFileSync(filename, body);
    }
    body = fs.readFileSync(filename, 'utf8');

    let drinks = await getDrinkMetadata(body);

    //let test = getDrinkDetails(drinks[0].url);

    fs.writeFileSync("drinks.json", JSON.stringify(drinks));

    console.log(drinks);
    await new Promise(r => setTimeout(r, 20000000));
})();

function getDrinkMetadata(body) {
    return new Promise(async (resolve) => {
        let i = 0;

        const $ = cheerio.load(body);
        let contestants = [];
        // Iterate through the drinks and get details
        for (const el of $('.summary-item', body)) {
            i++;
            if (i > 1) continue;
            console.log(`Scraping drink # ${i}`);

            const name = $(el)
                .find('.summary-excerpt')
                .children('p')
                .children('strong');

            const store = $(el)
                .find('.summary-title')
                .children('a');

            const modifiers = $(el)
                .find('.summary-metadata-item')
                .children('a');

            const image = $(el)
                .find('.summary-thumbnail')
                .children('img');

            let mods = [];
            for (const modifier of modifiers) {
                mods.push($(modifier).text());
            }

            // Keep only unique modifiers
            mods = [...new Set(mods)].join("\n");

            let details = await getDrinkDetails(store.attr('href'));

            let drink = {
                'Drink Name': details.name || name.text() || "No Name",
                'Image': image.attr('data-src'),
                'Store Name': store.text(),
                'URL': store.attr('href'),
                'Tags': mods,
                'Ingredients': details.description,
                'Description': details.blurb,
                'Price': details.price,
                'Address': details.address
            }
            contestants.push(drink);
        };
        resolve(contestants);
    })
}

async function getDrinkDetails(endpoint) {
    return new Promise(async (resolve) => {
        //const url = 'https://yychotchocolate.com/contestants-details3/2024higherground';
        const url = 'https://yychotchocolate.com/contestant-info-1/2024bulletcoffee';
        //const url = base + endpoint;
        const response = await fetch(url);
        body = await response.text();
        const $ = cheerio.load(body);

        let name = $('.html-block').first().find('.sqs-html-content').children('h2');
        let blurb = $('.html-block').first().find('.sqs-html-content').find('p:nth-child(2)');
        let description = $('.html-block').first().find('.sqs-html-content').find('p:nth-last-child(2)');
        let price = $('.html-block').first().find('.sqs-html-content p:nth-last-child(1)');
        let addresses = []
        let addressColumns = $('.row.sqs-row:nth-last-child(2) .col');
        for (const col of addressColumns) addresses.push($(col).find('p').text())

        let hours = $('.html-block:nth-child(3) p:nth-child(3)');

        //console.log('url: ' + url);
        //console.log('name: ' + name.text());
        //console.log('blurb: ' + blurb.text());
        //console.log('description: ' + description.text());
        //console.log('price: ' + price.text().replace('Price: ', ''));

        let obj = {
            "name": name.text(),
            "blurb": blurb.text(),
            "description": description.text(),
            "price": price.text().replace('Price: ', ''),
            "address": addresses.join("\n"),
            "hours": hours.text()
        }

        resolve(obj);
        //console.log('address: ' + address.text());
        //console.log('hours: ' + hours.text());
    })

}