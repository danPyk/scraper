const puppeteer = require('puppeteer');
const request = require('request-promise-native');
const poll = require('promise-poller').default;
const fs = require('fs');

const siteDetails = {
    sitekey: '',
    pageurl: ''
}

const chromeOptions = {
    headless: false,
    slowMo: 10,
    defaultViewport: null
};

(async function main() {
    const browser = await puppeteer.launch(chromeOptions);

    const page = await browser.newPage();


    await page.goto('', { waitUntil: 'networkidle0' });
    const requestId = await initiateCaptchaRequest(apiKey);


    const response = await pollForRequestResults(apiKey, requestId);

    //enter response
    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);

    let bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);

    //console.log(bodyHTML);

    fs.writeFile("data.txt", bodyHTML, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The data has been scraped and saved successfully! View it at './data.json'");
    });


})()


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
