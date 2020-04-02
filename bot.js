// process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

const utils = require(`./utils.js`);
const log = require(`./log.js`);
const https = require('https');
const avito = require(`./avito.js`);
const cian = require(`./cian.js`);
const telegramBot = require(`node-telegram-bot-api`);
const fs = require(`fs`);
// off to deploy, on to local
const agent = require('socks5-https-client/lib/Agent');

const PROXY_TO_TLGR = `185.62.58.208:10234`; // запрос через иностранный прокси на Telegram
// российсике прокси выдают 502 и 301 статус, другие блокируются avito
// const PROXY_TO_SITE = `193.38.51.75:33281`; // запрос через Российский прокси на авито и циан

// on to deploy, off to local
// const PORT = process.env.PORT || 443;
// const HOST = `0.0.0.0`;
// const EXTERNAL_URL = process.env.CUSTOM_ENV_VARIABLE || 'https://tranquil-ravine-43566.herokuapp.com'
// const BOT_WEBHOOKS = {
//   port: PORT,
//   host: HOST
// };

// off to deploy, on to local
const BOT_REQUEST = {
  agentClass: agent,
  agentOptions: {
    socksHost: PROXY_TO_TLGR.slice(0, PROXY_TO_TLGR.indexOf(`:`)),
    socksPort: +PROXY_TO_TLGR.slice(PROXY_TO_TLGR.indexOf(`:`) + 1)
  }
};

const USERS = {};
const PAGE_COUNT = 3;
const MIN = 60000; // ms
const REGEXP_URL_AVITO = /^(https?:\/\/)?(www\.)?avito\.ru\/.+$/;
const REGEXP_URL_CIAN = /^(https?:\/\/)?(.+\.)?cian\.ru\/.+$/;
const REGEXP_SHOW_REQUESTS = /^\/show\s(avito|cian)$/;
const REGEXP_ADD_REQUEST = /^\/add\s\S+$/;
const REGEXP_STOP_REQUEST = /^\/stop\s(avito|cian)\s\S+$/;
const REGEXP_NUMBER = /^\d+$/;
const TEXT_START = fs.readFileSync(`textStart.txt`, `utf8`).trim();
const TEXT_HELP = fs.readFileSync(`textHelp.txt`, `utf8`).trim();
const BOT_OPTIONS = {
  request: BOT_REQUEST, // off to deploy, on to local
  polling: true // off to deploy, on to local
  // webHook: BOT_WEBHOOKS // on to deploy, off to local
};
const TOKEN = fs.readFileSync(`token.txt`, `utf8`).trim();
const bot = new telegramBot(TOKEN, BOT_OPTIONS);
// bot.setWebHook(`${EXTERNAL_URL}:443/bot${TOKEN}`); // on to deploy, off to local

function Request() {
  this.url = ``,
  this.frequency = 0,
  this.iterations = 0,
  this.knownAds = new Set()
}

function User(name) {
  this.name = name,
  this.newRequest = {
    site: ``,
    name: ``
  },
  this.requests = {
    avito : {},
    cian: {}
  }
}

function defineSite(requestUrl) {
  // youla.ru, domclick.ru, domofond.ru
  if (requestUrl.indexOf(`avito.ru`) !== -1) return `avito`;
  if (requestUrl.indexOf(`cian.ru`) !== -1) return `cian`;
  return `unknown`;
}

function getSiteUrl(siteName, url, page) {
  if (siteName === `avito`) return avito.getAvitoUrl(url, page);
  if (siteName === `cian`) return cian.getCianUrl(url, page);
}

function getSiteNewItems(siteName, html, knownAds) {
  if (siteName === `avito`) return avito.getAvitoNewItems(html, knownAds);
  if (siteName === `cian`) return cian.getCianNewItems(html, knownAds);
}

bot.on(`polling_error`, (error) => console.log(`Polling error: ${error}`));

bot.on(`message`, (msg) => {
  const userId = msg.from.id;
  const userName = msg.from.first_name;
  log.msg(msg);

  if (!USERS.hasOwnProperty(userId)) {
    USERS[userId] = new User(userName);
    log.users(USERS);
  }

  newRequestName = USERS[userId].newRequest.name;
  newRequestSite = USERS[userId].newRequest.site;

  const userText = msg.text.trim();
  if (userText === `/start`) { // ввод команды /start
    bot.sendMessage(userId, TEXT_START, { parse_mode: `HTML` });
  } else if (REGEXP_ADD_REQUEST.test(userText)) { // ввод команды /add имя_запроса - добавление нового запроса
    const requestName = userText.slice(`/add `.length);
    USERS[userId].newRequest.name = requestName;
    bot.sendMessage(userId, `ОК. Пришли мне ссылку для запроса <b>${requestName}</b>...`, { parse_mode: `HTML` });
  } else if (REGEXP_URL_AVITO.test(userText) || REGEXP_URL_CIAN.test(userText)) { // ввод адреса запроса
    const requestUrl = userText;
    const siteName = defineSite(requestUrl);
    if (siteName === `unknown`) {
      bot.sendMessage(userId, `Неверная ссылка. Пришли для запроса <b>${newRequestName}</b> ссылку на один из поддерживаемых ботом сайтов...`, { parse_mode: `HTML` });
    } else if (USERS[userId].requests[siteName].hasOwnProperty(newRequestName)) { // если по сайту уже есть запрос с таким же именем
      bot.sendMessage(userId, `Запрос с именем <b>${newRequestName}</b> на сайт <b>${siteName}</b> уже существует.`, { parse_mode: `HTML` });
    } else if (newRequestName) {
      USERS[userId].newRequest.site = siteName;
      USERS[userId].requests[siteName][newRequestName] = new Request();
      USERS[userId].requests[siteName][newRequestName].url = requestUrl;
      bot.sendMessage(userId, `ОК, я буду следить за объявлениями на <b>${siteName}</b> по этой ссылке.\nУкажите интервал оповещения по запросу <b>${newRequestName}</b>.\nВведите количество минут...`, { parse_mode: `HTML` });
    } else {
      bot.sendMessage(userId, `Сначала задай имя нового запроса c помощь команды <code>/add</code>\n/help - справка по доступным командам`, { parse_mode: `HTML` });
    }
  } else if (REGEXP_NUMBER.test(userText)) { // ввод интервала оповещения по запросу
    if (newRequestName && newRequestSite) {
      const frequency = +userText;
      USERS[userId].requests[newRequestSite][newRequestName].frequency = frequency;
      bot.sendMessage(userId, `Готово. Запрос <b>${newRequestName}</b> на сайт <b>${newRequestSite}</b> добавлен.\nОповещение раз в <b>${frequency}</b> мин.`, { parse_mode: `HTML` });
      log.requests(USERS, newRequestSite, userId);
      doSiteRequest(newRequestSite, newRequestName, userId);
    }
  } else if (REGEXP_SHOW_REQUESTS.test(userText)) { // ввод команды /show имя_сайта - просмотр запросов пользователя по сайту
    const siteName = userText.slice(`/show `.length);
    const siteRequests = USERS[userId].requests[siteName];
    if (utils.getObjSize(siteRequests)) {
      bot.sendMessage(userId, `Ваши запросы по сайту <b>${siteName}</b>:\n<b>${Object.keys(siteRequests).join(`\n`)}</b>`, { parse_mode: `HTML` });
    } else {
      bot.sendMessage(userId, `По сайту <b>${siteName}</b> еще не добавлено ни одного запроса.`, { parse_mode: `HTML` });
    }
  } else if (REGEXP_STOP_REQUEST.test(userText)) { // ввод команды /stop имя_сайта имя_запроса - отписка от указанного запроса пользователя
    const [siteName, requestName] = userText.slice(`/stop `.length).split(` `);
    if (USERS[userId].requests[siteName].hasOwnProperty(requestName)) { // если по сайту уже есть запрос с таким же именем
      delete USERS[userId].requests[siteName][requestName];
      bot.sendMessage(userId, `Подписка на <b>${siteName}</b> по запросу запросу <b>${requestName}</b> отключена.`, { parse_mode: `HTML` });
    } else {
      bot.sendMessage(userId, `Запроса на <b>${siteName}</b> с именем <b>${requestName}</b> не существует.\n<code>/show + пробел + имя_сайта</code> - просмотр запросов по сайту`, { parse_mode: `HTML` });
    }
  } else if (userText === `/stopall`) { // ввод команды /stopall - отписка от всех запросов пользователя
    delete USERS[userId];
    log.users(USERS);
    bot.sendMessage(userId, `Подписка на все запросы отключена.`);
  } else {
    const msgText = (userText === `/help` || userText === `/add` || userText === `/show` || userText === `/stop`) ? TEXT_HELP : `Невалидный ввод!`;
    bot.sendMessage(userId, msgText, { parse_mode: `HTML` });
  }
});

function doSiteRequest(siteName, requestName, userId) {
  if (USERS.hasOwnProperty(userId)) {
    const request = USERS[userId].requests[siteName][requestName];
    request.iterations++;
    const options = {
      siteName: siteName,
      requestName: requestName,
      userId: userId,
      frequency: request.frequency,
      url: request.url,
      iterations: request.iterations,
      knownAds: request.knownAds
    };
    retrieveSiteData(options);
    setTimeout(() => {doSiteRequest(siteName, requestName, userId)}, request.frequency * MIN);
  }
}

function retrieveSiteData(options) {
  // const requestOptions = {
  //   proxy: `http://${PROXY_TO_SITE}`
  // };
  let results = [];
  let counter = 0;
  let lastPage = PAGE_COUNT;
  for (let page = 1; page <= PAGE_COUNT; page++) {
    const url = getSiteUrl(options.siteName, options.url, page);
    const req = https.get(url);
    req.once('response', (response) => {
      if (response.statusCode === 200) {
        let html = ``;
        response.on('data', (data) => html += data);
        response.on('end', () => {
          counter++;
          const newItems = getSiteNewItems(options.siteName, html, options.knownAds);
          if (newItems.length) {
            results = [...results, ...newItems];
          }
          if (counter === lastPage && options.iterations > 1) {
            printResults(results, options);
          }
          log.results(newItems, page, options);
        });
      } else {
        lastPage--;
      }
      log.status(url, response, USERS, options);
    });
    req.on('error', (error) => {
      console.error(error);
    });
    req.end();
  }
}

function printResults(results, options) {
  bot.sendMessage(options.userId, `<b>${(results.length) ? results.length : 0}</b> новых объявлений с сайта <b>${options.siteName}</b> по запросу <b>${options.requestName}</b> \n<u>Всего по запросу бот запомнил объявлений:</u> <b>${options.knownAds.size}</b>\nСледующая проверка через <b>${options.frequency}</b> мин.`, { parse_mode: `HTML` });
  log.next(options.requestName, options.frequency);
  if (results.length) {
    setTimeout(() => {
      results.forEach((item) => {
        bot.sendMessage(options.userId, `► <b>${item.date}</b>, ${item.price} --> <a href='${item.link}'>ссылка</a>`, { parse_mode: `HTML` });
        log.item(item);
      })
    }, 3000);
  }
}

log.start();
