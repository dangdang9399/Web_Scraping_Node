// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

// 계정정보
const account = require('./account');

const scraper = async () => {

    const url = "https://cafe.naver.com/"+ account.baedal_sesang().cafePath +"?iframe_url=/ArticleList.nhn%3Fsearch.clubid="+ account.baedal_sesang().clubID +"%26search.boardtype=L";
    const browser = await puppeteer.launch({
        headless : false,
        defaultViewport:{
            width:2000,
            height:1024,
        }
    });

    let page = await browser.newPage();

    // 사용 시 실제 아이디로 변경하기
    const naver_id = account.baedal_sesang().id;
    const naver_pw = account.baedal_sesang().pw;
    // dotenv 라이브러리 사용해서 변경해주기

    await page.goto('https://nid.naver.com/nidlogin.login');

    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, naver_id, naver_pw);
    await page.waitForTimeout(1000);

    await page.click('.btn_login');
    await page.waitForNavigation();

    await page.goto(url);
    await page.waitForSelector('iframe');


    const elementHandle = await page.$(
        'iframe[id="cafe_main"]',
    );
    const frame = await elementHandle.contentFrame();

    await frame.type('#query', '판매', { delay: 100 });
    await frame.type('.select_list ul > li', '판매', { delay: 100 });

    console.log(frame)

    /*const links = await page.evaluate(async () => {
        const links = []

        const elements = await document.querySelector('iframe[id="cafe_main"]');
        elements.content
        console.log("elements === ", elements);
        // const elements = await document.querySelectorAll('.m-tcol-c');
        // const elements = await document.querySelectorAll('div.m-tcol-c a.article');

        for (let el of elements){
            const link = await el;
            console.log("실행3");
            console.log("link == ", link);

            links.push(link);
        }

        return links;
    });

    console.log({links});*/

    await page.waitForTimeout(2000);
    await page.close();
    await browser.close();

};

scraper();