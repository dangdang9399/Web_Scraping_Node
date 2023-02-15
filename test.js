// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

// 계정정보
const account = require('./account');

const scraper = async () => {

    // 네이버 카페 검색 아이디
    const url = "https://cafe.naver.com/" + account.naver_cafe().cafePath
        + "?iframe_url=/ArticleSearchList.nhn%3Fsearch.clubid=" + account.naver_cafe().clubID
        + "%26search.searchdate=" + account.naver_cafe().searchDate
        + "%26search.defaultValue=1%26search.sortBy=date%26userDisplay=" + account.naver_cafe().userDisplay
        + "%26search.media=0%26search.option=0";
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 2000,
            height: 1024,
        }
    });

    // 탭이 2개 생기는 걸 방지
    const [page] = await browser.pages();

    // 사용 시 실제 아이디로 변경하기
    // 로그인
    await page.goto('https://nid.naver.com/nidlogin.login');

    // 로그인 정보 입력
    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, account.naver_cafe().id, account.naver_cafe().pw);
    await page.waitForTimeout(1000);

    await page.click('.btn_login');

    // 실제 로그인 되는 id, pw 적고 나서 주석 해제 해주기
    // await page.waitForNavigation();

    // 로그인 후 네이버 카페로 이동
    await page.goto(url);

    // 카페 정보 조회해오기
    await page.waitForSelector('iframe');

    // iframe 정보 사용처리 해주기
    const elementHandle = await page.$(
        'iframe[id="cafe_main"]',
    );
    const frame = await elementHandle.contentFrame();

    // 서치 데이터 값 입력
    await frame.type('#queryTop', '판매', {delay: 100});
    // 검색 버튼 클릭 -> 리스트 조회
    await frame.click('.input_search_area .btn-search-green');

    // 게시글 리스트 가져오기
    await frame.waitForSelector('.article-board.m-tcol-c');
    // await frame.waitForSelector('.article-board.result-board.m-tcol-c');

    // 게시글 페이징 정보 가져오기
    await frame.waitForSelector('#main-area .prev-next');
    const pageList = await frame.evaluate(() => {
        let pageCountList = [];
        const list = document.querySelectorAll('#main-area .prev-next > a');
        list.forEach(async (data) => {
            pageCountList.push({
                pageCountNumber: data.textContent,
                page: data.href
            })
        })
        return pageCountList
    });

    console.log("pageList === ", pageList);

    // let boardListPage = await browser.newPage();
    let boardListPageLinkList = [];

    // await page.close();

    for (let pageListKey in pageList) {
        console.log("pageListKey == ", pageListKey);
        console.log(pageList[pageListKey].page);
        await page.goto(pageList[pageListKey].page);

        await page.waitForSelector('iframe');
        const boardListPageElementHandle = await page.$(
            'iframe[id="cafe_main"]',
        );
        const boardListPageFrame = await boardListPageElementHandle.contentFrame();

        // 게시글 리스트 정보 가져오기
        boardListPageLinkList.push (await boardListPageFrame.evaluate(() => {
            let targetListIndex = 0;
            let targetList = [];
            const list =document.querySelectorAll('.article-board.result-board.m-tcol-c > table > tbody > tr');
            list.forEach(async (data) => {
                if (data.querySelector('.td_article .board-list .inner_list .list-i-selling .blind').textContent == '판매'){
                    targetList.push({
                        // 테스트용 정보//
                        index: ++targetListIndex,
                        title: data.querySelector('.td_article .board-list .inner_list a').textContent,
                        tag: data.querySelector('.td_article .board-list .inner_list .list-i-selling .blind').textContent,
                        // 테스트용 정보//
                        date: data.querySelector('.td_date').innerText,
                        url: data.querySelector('.td_article .board-list .inner_list a').href,
                        boardNum: data.querySelector('.td_article .board-number .inner_number').innerText
                    })
                }
                /*else {
                    if (data.querySelector('.td_article .board-list .inner_list .list-i-selling-safe .blind')){
                        if (data.querySelector('.td_article .board-list .inner_list .list-i-selling-safe .blind').textContent == '판매 안전'){
                            console.log("판매 안전 data === ", data);
                            targetList.push({
                                // 테스트용 정보//
                                index: ++targetListIndex,
                                title: data.querySelector('.td_article .board-list .inner_list a').textContent,
                                tag: data.querySelector('.td_article .board-list .inner_list .list-i-selling-safe .blind').textContent,
                                // 테스트용 정보//
                                date: data.querySelector('.td_date').innerText,
                                url: data.querySelector('.td_article .board-list .inner_list a').href,
                                boardNum: data.querySelector('.td_article .board-number .inner_number').innerText
                            })
                        }
                    }
                }*/
            })
            return targetList;
        }))
    }
    console.log("boardListPageLinkList === ", boardListPageLinkList);

    await page.waitForTimeout(2000);
    await page.close();
    await browser.close();

};

scraper();