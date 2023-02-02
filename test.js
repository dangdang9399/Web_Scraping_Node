// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

const scraper = async () => {

    const url = "https://cafe.naver.com/nds07";
    const browser = await puppeteer.launch({
        headless : false,
        defaultViewport:{
            width:2000,
            height:1024,
        }
    });

    let page = await browser.newPage();

    // 사용 시 실제 아이디로 변경하기
    const naver_id = "testtest";
    const naver_pw = "testtesttesttest";

    await page.goto('https://nid.naver.com/nidlogin.login');

    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, naver_id, naver_pw);
    await page.waitForTimeout(1000);

    await page.click('.btn_login');
    await page.waitForNavigation();

    await page.goto(url);
    await page.click('#menuLink994');

    await page.waitForSelector('#main-area');

    const links = await page.evaluate(async () => {
        const links = []

        const elements = await document.querySelectorAll('.m-tcol-c');
        // const elements = await document.querySelectorAll('div.m-tcol-c a.article');

        for (let el of elements){
            const link = await el.href;

            links.push(link);
        }

        return links;
    });

    console.log({links});

    await page.close();
    await browser.close();

};

scraper();