// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

const scraper = async () => {

    const url = "https://naver.com";
    const browser = await puppeteer.launch({
        headless : false,
        defaultViewport:{
            width:2000,
            height:1024,
        }
    });

    let page = await browser.newPage();

    await page.goto(url);

    await page.waitForSelector('#gnb');

    const links = await page.evaluate(async () => {
        const links = []

        const elements = await document.querySelectorAll('a.nav');

        for (let el of elements){
            const link = await el.href;

            links.push(link);
        }

        return links;
    });

    console.log({links});

    for (let link of links){
        await page.goto(link);
    }

    await page.close();
    await browser.close();

};

scraper();