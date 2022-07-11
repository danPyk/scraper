const puppeteer = require('puppeteer');
const request = require('request-promise-native');
const poll = require('promise-poller').default;
const fs = require('fs');

const siteDetails = {
    sitekey: '6LdMY0YUAAAAAO_ctUhtILG_I2Ml3OBonlkZPsa7',
    pageurl: 'https://stats.pancernik.info/log/2021-09-24/3'
}

const getUsername = function () {
    return 'testUser34234234';
}

const getPassword = function () {
    return 'password12345';
}

const apiKey = 'fd6ac9eeea6897ae06478b86bbe22ee8';

const chromeOptions = {
    headless: false,
    slowMo: 10,
    defaultViewport: null
};

(async function main() {
    const browser = await puppeteer.launch(chromeOptions);

    const page = await browser.newPage();


    await page.goto('https://stats.pancernik.info/log/2021-09-24/3', { waitUntil: 'networkidle0' });
    const requestId = await initiateCaptchaRequest(apiKey);


    const response = await pollForRequestResults(apiKey, requestId);
   // console.log('response  ' + response);

    //enter response
    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);


    //await getDOM(page);
    let bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);

    //console.log(bodyHTML);

    fs.writeFile("data.txt", bodyHTML, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The data has been scraped and saved successfully! View it at './data.json'");
    });



})()

async function getDOM(page) {
    // Wait for the required DOM to be rendered
    let dom = await page.waitForSelector('.table table-striped table-bordered');
    // Get the link to all the required books
/*    let urls = await page.$$eval('section ol > li', links => {
        // Make sure the book to be scraped is in stock
        //links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
        // Extract the links from the data
        //links = links.map(el => el.querySelector('h3 > a').href)
        return links;
    });*/
    console.log(dom);
}
async function initiateCaptchaRequest(apiKey) {
    const formData = {
        method: 'userrecaptcha',
        googlekey: siteDetails.sitekey,
        key: apiKey,
        pageurl: siteDetails.pageurl,
        json: 1
    };
    //console.log( config.pageurl );
    const response = await request.post('http://2captcha.com/in.php', { form: formData });
    return JSON.parse(response).request;
}

async function pollForRequestResults(key, id, retries = 30, interval = 1500, delay = 15000) {
    await timeout(delay);
    return poll({
        taskFn: requestCaptchaResults(key, id),
        interval,
        retries
    });
}

function requestCaptchaResults(apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
    return async function () {
        return new Promise(async function (resolve, reject) {apiKey
            const rawResponse = await request.get(url);
            const resp = JSON.parse(rawResponse);
            if (resp.status === 0) return reject(resp.request);
            resolve(resp.request);
        });
    }
}

const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))