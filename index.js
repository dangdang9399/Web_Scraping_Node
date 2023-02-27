// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

// 계정정보
const setting = require('./common/setting/setting');

// 스케쥴러 사용
const cron = require("node-cron");

// 비동기 통신(ajax) 사용
const axios = require('axios');

const {nowDate} = require("./common/lib/DateLib");

let scheduleStart = cron.schedule('5 0/59 * * *', function () {
    nowDate();
    scraping().then();
}, {
    scheduled: false
});

console.log("nowDate == ", nowDate())
scheduleStart.start();

const scraping = async () => {

    // 네이버 카페 검색 아이디
    const url = "https://cafe.naver.com/" + setting.naver_cafe().cafePath
        + "?iframe_url=/ArticleSearchList.nhn%3Fsearch.clubid=" + setting.naver_cafe().clubID
        + "%26search.searchdate=" + setting.naver_cafe().searchDate
        + "%26search.defaultValue=1%26search.sortBy=date%26userDisplay=" + setting.naver_cafe().userDisplay
        + "%26search.media=0%26search.option=0";

    // 브라우저 설정
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 2000,
            height: 1024,
        },
        args: ['--no-sandbox'],
    });

    // 탭이 2개 생기는 걸 방지
    const pages = await browser.pages();
    const page = pages[0];

    // 사용 시 실제 아이디로 변경하기
    // 로그인
    await page.goto('https://nid.naver.com/nidlogin.login', {waitUntil: 'networkidle0'});

    // 실제 사용자처럼 보이게 설정
    await page.setUserAgent(setting.naver_cafe().userAgent);

    // 로그인 정보 입력
    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, setting.naver_cafe().id, setting.naver_cafe().pw);
    await page.waitForTimeout(1000);

    await page.click('.btn_login');
    await page.waitForNavigation();

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
    await frame.waitForSelector('.article-board.result-board.m-tcol-c');

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


    let boardListPageLinkList = [];
    // 페이지 수 만큼 for 문 돌면서 게시글 리스트 정보(게시글 번호, url 등) list에 넣어주기
    for (let pageListKey in pageList) {
        // console.log("pageListKey == ", pageListKey);
        // console.log(pageList[pageListKey].page);
        await page.goto(pageList[pageListKey].page);

        await page.waitForSelector('iframe');
        const boardListPageElementHandle = await page.$(
            'iframe[id="cafe_main"]',
        );
        const boardListPageFrame = await boardListPageElementHandle.contentFrame();

        // 게시글 리스트 정보 가져와서 list에 push 해주기
        boardListPageLinkList.push(await boardListPageFrame.evaluate(() => {
            let targetListIndex = 0;
            let targetList = [];
            const list = document.querySelectorAll('.article-board.result-board.m-tcol-c > table > tbody > tr');
            list.forEach(async (data) => {
                targetList.push({
                    // 테스트용 정보 //
                    // index: ++targetListIndex,
                    // title: data.querySelector('.td_article .board-list .inner_list a').textContent,
                    // tag: data.querySelector('.td_article .board-list .inner_list .list-i-selling .blind').textContent,
                    // 테스트용 정보 //

                    date: data.querySelector('.td_date').innerText,
                    url: data.querySelector('.td_article .board-list .inner_list a').href,
                    boardNum: data.querySelector('.td_article .board-number .inner_number').innerText
                })
            })
            return targetList;
        }))
    }
    // console.log("boardListPageLinkList === ", boardListPageLinkList);


    // 게시글 상세페이지에서 정보 추출 후 db 저장
    for (let boardListPageLink of boardListPageLinkList) {
        const boardPage = await browser.newPage();
        await boardPage.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36");
        for (const link of boardListPageLink) {
            try {
                await boardPage.goto(link.url, {waitUntil: 'networkidle0'});
                const boardFrameHandle = await boardPage.$("iframe[id='cafe_main']");
                const boardFramePage = await boardFrameHandle.contentFrame();

                // 제목 + 본문에 '판매' 키워드만 들어간 판매가 아닌 글은 저장 X
                if (await boardFramePage.$('.ProductName') == null || await boardFramePage.$('.ProductName') == undefined) {
                    // console.log("판매 글이 아닙니다.")
                    continue;

                    // 판매 글만 저장
                } else if (await boardFramePage.$('.ProductName') !== null || await boardFramePage.$('.ProductName') !== undefined) {
                    // console.log("ProductName === ", await boardFramePage.$eval('.ProductName', el => el.innerText));
                    // 판매자명
                    const sellerName = await boardFramePage.$eval('.nickname', el => el.innerText);
                    // 등록일
                    const regDate = await boardFramePage.$eval('.article_info > .date', el => el.innerText);
                    // 글 제목
                    const title = await boardFramePage.$eval('.ProductName', el => el.innerText);
                    // 가격
                    const price = await boardFramePage.$eval('.ProductPrice', el => el.innerText);
                    // 게시글 링크
                    const boardUrl = "https://cafe.naver.com/" + account.baedal_sesang().cafePath + "/" + link.boardNum;

                    // 본문
                    let content;
                    try {
                        content = await boardFramePage.$eval('.se-main-container', el => el.innerText);
                    } catch (e) {
                        content = await boardFramePage.$eval('.ContentRenderer', el => el.innerText);
                    }

                    /**
                     * 판매자 정보 존재하지 않을 때는 본문의 휴대폰 정보만 넣어주기
                     * - ex) 판매 완료
                     * - ex) 판매자 연락처 정보 존재 X
                     */
                    // 판매 완료
                    if (await boardFramePage.$('.btn_text') == null || await boardFramePage.$('.btn_text') == undefined) {
                        const res = await reqPost(apiUrl, await setNaverCafeData(link.boardNum, sellerName, regDate, title, price, boardUrl, '', content));
                        console.log("res == ", res.data);
                    } else {
                        await boardFramePage.click('.btn_text');
                        // 판매자 정보 불러올 때까지 잠시 대기
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // 판매자 정보
                        let sellerInfoTell;
                        if (await boardFramePage.$('.tell') == null || await boardFramePage.$('.tell') == undefined) {
                            // 판매자 연락처 정보 존재 X
                            sellerInfoTell = '';
                        } else {
                            // 판매자 정보 존재
                            sellerInfoTell = await boardFramePage.$eval('.tell', el => el.innerText);
                        }
                        const res = await reqPost(apiUrl, setNaverCafeData(link.boardNum, sellerName, regDate, title, price, boardUrl, sellerInfoTell, content));
                        console.log("res == ", res.data);
                    }
                }
                await randomTimer();
            } catch (e) {
                console.log('e == ', link.url)
                console.log('e == ', e)
            }
        }
        await boardPage.close();
    }

    await page.close();
    await browser.close();
};

scraping().then();

//서버로 전송
const reqPost = async (url, data) => {
    try {
        return await axios.post(url, data);
    } catch (error) {
        console.error(error);
    }
};

//네이버 카페 데이터 형식
const setNaverCafeData = async (boardID, sellerName, contentDate, title, price, boardUrl, sellerPhone, content) => {
    // 최종 DB 저장 정보
    const dbSetData = {
        type: 'NAVERCAFE',
        boardID: boardID,
        sellerName: sellerName,
        contentDate: contentDate,
        title: title,
        price: price,
        boardUrl: boardUrl,
        sellerPhone: sellerPhone,
        content: content,
        phoneFilterYn: false
    };

    return dbSetData;
};

const randomTimer = async () => {
    const randomNum = (Math.floor(Math.random() * 50) * 100);
    await new Promise(resolve => setTimeout(resolve, randomNum));
};