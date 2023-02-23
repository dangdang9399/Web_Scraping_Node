// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

const setting = require('./common/setting/setting');

// 네이버의 nav 정보 가져와서 link 열기
const scraper = async () => {

    const url = "https://naver.com";
    const browser = await puppeteer.launch({
        // headless : true 했을 시에는 백그라운드 실행됨
        headless : false,
        defaultViewport:{
            width:2000,
            height:1024,
        }
    });

    // 탭이 2개 생기는 걸 방지
    const pages = await browser.pages();
    const page = pages[0];

    // 실제 사용자처럼 보이게 설정
    await page.setUserAgent(setting.naver().userAgent);

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