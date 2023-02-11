// google에서 제공하는 웹스크래핑 api
const puppeteer =require('puppeteer');

// 제이쿼리 사용
const cheerio =require('cheerio');

// 계정 정보 가져오기
const account =require("../common/account/account");

const scraper = async () => {

    // 배달세상 url 정보
    const url = "https://cafe.naver.com/nds07?iframe_url=/ArticleSearchList.nhn%3Fsearch.clubid=" + account.baedal_sesang().clubID
        + "%26search.searchdate=" + account.baedal_sesang().searchDate
        + "%26search.defaultValue=1%26search.sortBy=date%26userDisplay=" + account.baedal_sesang().userDisplay
        + "%26search.media=0%26search.option=0";

    // 브라우저 설정
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1280,
            height: 800,
        }
    });

    // 탭이 2개 생기는 걸 방지
    const [page] = await browser.pages();

    // 로그인
    await page.goto('https://nid.naver.com/nidlogin.login');

    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, account.baedal_sesang().id, account.baedal_sesang().pw);
    await page.waitForTimeout(1000);

    await page.click('.btn_login');
    await page.waitForNavigation();

    // 로그인 후 카페 페이지 이동
    await page.goto(url);

    // 카페 정보 조회해오기
    await page.waitForSelector('iframe');
    const elementHandle = await page.$(
        'iframe[id="cafe_main"]',
    );
    const frame = await elementHandle.contentFrame();

    // 서치 데이터 값 입력
    await frame.type('#queryTop', '판매', {delay: 100});
    // 검색 버튼 클릭 -> 리스트 조회
    await frame.click('.input_search_area .btn-search-green');

    // 게시글 리스트 가져오기
    await frame.waitForSelector('.article-board.result-board.m-tcol-c');
    const linkList = await frame.evaluate(() => {
        let targetList = [];
        const list =document.querySelectorAll('.article-board.result-board.m-tcol-c > table > tbody > tr');
        list.forEach(async (data) => {
            targetList.push({
                date : data.querySelector('.td_date').innerText,
                url : data.querySelector('.td_article .board-list .inner_list a').href,
                boardNum : data.querySelector('.td_article .board-number .inner_number').innerText
            })
        })
        return targetList
    });

    await frame.waitForSelector('#main-area .prev-next');
    const pageList = await frame.evaluate(()=>{
        let pageCountList = [];
        const list =document.querySelectorAll('#main-area .prev-next');
        list.forEach(async (data) => {
            pageCountList.push({
                page : data.$x('//a[contains(@href, \'search.page\')]').innerText
            })
        })
        return pageCountList
    })
    // const pageList = await frame.$x('//*[@id="main-area"]/div[7]/a');


    console.log("pageList === ", pageList);
    // console.log("linkList === ", linkList);






    // 2페이지로 이동
    // await frame.click('.prev-next a');



    /// 여기까지 실행됨
    /*await frame.waitForNavigation();

    const content = await frame.executionContext();
    const res = await content.evaluate(() => {
        const el = document.querySelector('div.prev-next');
        if (el) {
            console.log(el.outerHTML);
        }
    });

    if (res){
        await elementHandle.evaluate((a, res) => {
            a.innerHTML = res;
        }, res);
    } else {
        console.log("content 값 없음");
    }

    const result =  await page.evaluate(() => new XMLSerializer().serializeToString(document));*/


    // console.log(result ? result : 'null');

    // let pageCnt = await frame.$$('div.prev-next');

    // await frame.select('#searchdate ul.select_list > li', "1d");
    // await frame.select('#divSearchDate ul.select_list > li"', "1일");

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