// ajax 요청을 더 쉽게 해주는 api
const rp = require('request-promise');

// jQuery와 유사하게 사용할 수 있게 해주는 api
const cheerio = require('cheerio');

// google에서 제공하는 웹스크래핑 api
const puppeteer = require('puppeteer');

// 값을 테이블 형식으로 볼 수 있게 해줌
const Table = require("cli-table");

// 파일 시스템 사용하기
const fs = require("fs");

const account = require("./account");

let users = [];

const options = {
    url : `https://cafe.naver.com/ArticleList.nhn?search.clubid=12928625&search.menuid=994&search.boardtype=L`,
    json : true
}

rp(options)
    .then((data) => {
        let userData = [];
        for (let user of data) {
            userData.push({ user: user, // 값 들어오는 거 보고 여기에 변수 추가해서 값 넣어주기
                href: user,
                // href: user.href
            });
        }
        console.log(userData);
        process.stdout.write('loading');
        getChallengesCompletedAndPushToUserArray(userData);
    })
    .catch((err) => {
        console.log(err);
    });
function getChallengesCompletedAndPushToUserArray(userData){
    var i =0;
    function next(){
        if (i < userData.length){
            var options = {
                url : 'https://cafe.naver.com/nds07?iframe_url_utf8=%2F' + userData[i].href,
                transfrom: body => cheerio.load(body)
            }
            /*rp(options)
                .then(function ($) {
                    process.stdout.write(`.`);
                    const hrefLink = $('h1.')
                })*/
        }
    }
}

const crawler = async () => {
    const browser = await puppeteer.launch({
        headless : false,
        defaultViewport:{
            width:2000,
            height:1024,
        }
    });
    const page = await browser.newPage();
    // const page2 = await browser.newPage();
    // await page.waitForTimeout(3000);

    // 사용 시 실제 아이디로 변경하기
    const naver_id = account.naver_id;
    const naver_pw = account.naver_pw;

    console.log("naver_id", naver_id);
    console.log("naver_pw", naver_pw);

    await page.goto('https://nid.naver.com/nidlogin.login');

    await page.evaluate((id, pw) => {
        // document.querySelector('#id').value = id;
        // document.querySelector('#pw').value = pw;
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, naver_id, naver_pw);
    await page.waitForTimeout(1000);

    await page.click('.btn_login');
    await page.waitForNavigation();

    await page.goto('https://cafe.naver.com/nds07');
    await page.click('#menuLink994');
    await page.waitForTimeout(6000);

    // const html = await page.content();
    // fs.writeFileSync("example.html", html);

    // let eh = await page.$("div.m-tcol-c a.article");
    // let eh = await page.$("a.article");
    // let eh = await page.$("td.td_date");
    /*let title = eh.$eval('a.article', function (el){
        return el.innerText
    })
    console.log(title);*/

    // 어제 날짜 검색
    /*let todayDate = new Date();
    // 2023.01.21.
    let year = todayDate.getFullYear();
    let month = todayDate.getMonth()+1;
    let date = todayDate.getDate();
    let searchDate = (year + "." + month + "." + (date - 1) + ".").toString();*/

    // await page.waitForTimeout(10000);

    // await page.close();
    // await browser.close();
};

const test = async () => {

    /*
    어제 날짜 검색
    */
    let todayDate = new Date();
    // let todayDate = new Date();
    // 2023.01.21.
    let year = todayDate.getFullYear();
    let month = todayDate.getMonth()+1;
    let date = todayDate.getDate();
    let searchDate = (year + "." + month + "." + (date - 1) + ".").toString();
    console.log(todayDate);
    console.log(month);
    console.log(searchDate);

};

crawler();
// test();