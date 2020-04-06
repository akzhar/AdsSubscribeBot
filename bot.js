const https = require('https');
const telegramBot = require(`node-telegram-bot-api`);
const fs = require(`fs`);
const utils = require(`./utils.js`);
const log = require(`./log.js`);
const config = require(`./config.js`);
// const avito = require(`./avito.js`);
const cian = require(`./cian.js`);
const youla = require(`./youla.js`);
const domofond = require(`./domofond.js`);
const domclick = require(`./domclick.js`);

const DEBUG_CHAT_ID = 758963387;
const AVAILABLE_SITES = `Youla, Cian, Domofond, Domclick`;
const REGEXP_ADD_REQUEST = /^\/add\s\S+$/;
const REGEXP_NUMBER = /^\d+$/;
const REGEXP_STOP_REQUEST = /^\/stop\s(cian|youla|domofond|domclick)\s\S+$/;
const REGEXP_URL = /^(https?:\/\/)?(.+\.)?(cian|youla|domofond|domclick)\.ru\/.+$/;
const USERS = {};
const PAGE_COUNT = 3;
const MIN = 60000; // ms
const TEXT_START = fs.readFileSync(`textStart.txt`, `utf8`).trim();
const TEXT_HELP = fs.readFileSync(`textHelp.txt`, `utf8`).trim();

const token = fs.readFileSync(`token.txt`, `utf8`).trim();
const botOptions = config.botOptions;
const bot = new telegramBot(token, botOptions);

if (config.isDeploy) {
  bot.setWebHook(config.botHook);
}

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
    // avito : {},
    cian: {},
    youla: {},
    domofond: {},
    domclick: {}
  }
}

function defineSite(requestUrl) {
  // if (requestUrl.includes(`avito.ru`)) return `avito`;
  if (requestUrl.includes(`cian.ru`)) return `cian`;
  if (requestUrl.includes(`youla.ru`)) return `youla`;
  if (requestUrl.includes(`domofond.ru`)) return `domofond`;
  if (requestUrl.includes(`domclick.ru`)) return `domclick`;
  return `unknown`;
}

function getSiteUrl(siteName, url, page) {
  // if (siteName === `avito`) return avito.getAvitoUrl(url, page);
  if (siteName === `cian`) return cian.getCianUrl(url, page);
  if (siteName === `youla`) return youla.getYoulaUrl(url, page);
  if (siteName === `domofond`) return domofond.getDomofondUrl(url, page);
  if (siteName === `domclick`) return domclick.getDomclickUrl(url, page);
}

function getSiteNewItems(siteName, html, knownAds) {
  // if (siteName === `avito`) return avito.getAvitoNewItems(html, knownAds);
  if (siteName === `cian`) return cian.getCianNewItems(html, knownAds);
  if (siteName === `youla`) return youla.getYoulaNewItems(html, knownAds);
  if (siteName === `domofond`) return domofond.getDomofondNewItems(html, knownAds);
  if (siteName === `domclick`) return domclick.getDomclickNewItems(html, knownAds);
}

bot.on(`polling_error`, (error) => console.log(`Polling error: ${error}`));

bot.on(`message`, (msg) => {
  const chatID = msg.chat.id;
  const userName = msg.from.first_name;
  log.msg(msg);

  if (!USERS.hasOwnProperty(chatID)) {
    USERS[chatID] = new User(userName);
    log.users(USERS);
  }

  newRequestName = USERS[chatID].newRequest.name;
  newRequestSite = USERS[chatID].newRequest.site;

  const userText = msg.text.trim();
  if (userText === `/start`) { // ввод команды /start
    bot.sendMessage(chatID, TEXT_START, { parse_mode: `HTML` });
  } else if (userText === `/show`) { // ввод команды /show - просмотр запросов пользователя
    let msg = ``;
    const requests = USERS[chatID].requests;
    for(let site in requests) {
      if (requests.hasOwnProperty(site) && utils.getObjSize(requests[site])) {
        msg += `<b>Запросы на ${site}:</b>\n`;
        for(let request in requests[site]) {
          if (requests[site].hasOwnProperty(request)) {
            msg += `► <b>${request}</b> --> <a href="${site[request].url}">ссылка</a> (раз в ${site[request].frequency} мин., просканировано ${site[request].iterations} раз)\n`;
          }
        }
      }
    }
    bot.sendMessage(chatID, msg, { parse_mode: `HTML` });
  } else if (REGEXP_ADD_REQUEST.test(userText)) { // ввод команды /add имя_запроса - добавление нового запроса
    const requestName = userText.slice(`/add `.length);
    USERS[chatID].newRequest.name = requestName;
    bot.sendMessage(chatID, `ОК. Пришли мне ссылку для запроса <b>${requestName}</b>...\n${AVAILABLE_SITES}`, { parse_mode: `HTML` });
  } else if (REGEXP_URL.test(userText)) { // ввод адреса запроса
    const requestUrl = userText;
    const siteName = defineSite(requestUrl);
    if (siteName === `unknown`) {
      bot.sendMessage(chatID, `Неверная ссылка. Пришли для запроса <b>${newRequestName}</b> ссылку на один из поддерживаемых ботом сайтов...`, { parse_mode: `HTML` });
    } else if (USERS[chatID].requests[siteName].hasOwnProperty(newRequestName)) { // если по сайту уже есть запрос с таким же именем
      bot.sendMessage(chatID, `Запрос с именем <b>${newRequestName}</b> на сайт <b>${siteName}</b> уже существует.`, { parse_mode: `HTML` });
    } else if (newRequestName) {
      USERS[chatID].newRequest.site = siteName;
      USERS[chatID].requests[siteName][newRequestName] = new Request();
      USERS[chatID].requests[siteName][newRequestName].url = requestUrl;
      bot.sendMessage(chatID, `ОК, я буду следить за объявлениями на <b>${siteName}</b> по этой ссылке.\nУкажите интервал оповещения по запросу <b>${newRequestName}</b>.\nВведите количество минут...`, { parse_mode: `HTML` });
    } else {
      bot.sendMessage(chatID, `Сначала задай имя нового запроса c помощь команды <code>/add</code>\n/help - справка по доступным командам`, { parse_mode: `HTML` });
    }
  } else if (REGEXP_NUMBER.test(userText)) { // ввод интервала оповещения по запросу
    if (newRequestName && newRequestSite) {
      const frequency = +userText;
      USERS[chatID].requests[newRequestSite][newRequestName].frequency = frequency;
      bot.sendMessage(chatID, `Готово. Запрос <b>${newRequestName}</b> на сайт <b>${newRequestSite}</b> добавлен.\nЯ просканировал <b>3</b> первые страницы.\nОповещение раз в <b>${frequency}</b> мин.`, { parse_mode: `HTML` });
      doSiteRequest(newRequestSite, newRequestName, chatID);
    }
  } else if (REGEXP_STOP_REQUEST.test(userText)) { // ввод команды /stop имя_сайта имя_запроса - отписка от указанного запроса пользователя
    const [siteName, requestName] = userText.slice(`/stop `.length).split(` `);
    if (USERS[chatID].requests[siteName].hasOwnProperty(requestName)) { // если по сайту уже есть запрос с таким же именем
      delete USERS[chatID].requests[siteName][requestName];
      bot.sendMessage(chatID, `Подписка на <b>${siteName}</b> по запросу запросу <b>${requestName}</b> отключена.`, { parse_mode: `HTML` });
    } else {
      bot.sendMessage(chatID, `Запроса на <b>${siteName}</b> с именем <b>${requestName}</b> не существует.\n<code>/show + пробел + имя_сайта</code> - просмотр запросов по сайту`, { parse_mode: `HTML` });
    }
  } else if (userText === `/stopall`) { // ввод команды /stopall - отписка от всех запросов пользователя
    delete USERS[chatID];
    log.users(USERS);
    bot.sendMessage(chatID, `Подписка на все запросы отключена.`);
  } else {
    const msgText = (userText === `/help` || userText === `/add` || userText === `/stop`) ? TEXT_HELP : `Невалидный ввод!`;
    bot.sendMessage(chatID, msgText, { parse_mode: `HTML` });
  }
});

function doSiteRequest(siteName, requestName, chatID) {
  if (USERS.hasOwnProperty(chatID) && USERS[chatID].requests[siteName].hasOwnProperty(requestName)) {
    const request = USERS[chatID].requests[siteName][requestName];
    request.iterations++;
    const options = {
      siteName: siteName,
      requestName: requestName,
      chatID: chatID,
      frequency: request.frequency,
      url: request.url,
      iterations: request.iterations,
      knownAds: request.knownAds
    };
    setTimeout(() => {doSiteRequest(siteName, requestName, chatID)}, request.frequency * MIN);
    retrieveSiteData(options);
  }
}

function retrieveSiteData(options) {
  let results = [];
  let counter = 0;
  let lastPage = PAGE_COUNT;
  log.requests(USERS, options.chatID);
  for (let page = 1; page <= PAGE_COUNT; page++) {
    const url = getSiteUrl(options.siteName, options.url, page);
    const request = https.get(url);
    request.once('response', (response) => {
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
            if (!options.knownAds.size) bot.sendMessage(DEBUG_CHAT_ID, `ERROR: 0 results\nURL: ${options.url}`);
            printResults(results, options);
          }
          log.results(newItems, page, options);
        });
      } else {
        lastPage--;
      }
      log.status(url, page, response, USERS, options);
    });
    request.on('error', (error) => {
      console.error(error);
    });
    request.end();
  }
}

function printResults(results, options) {
  bot.sendMessage(options.chatID, `<b>${(results.length) ? results.length : 0}</b> новых объявлений с сайта <b>${options.siteName}</b> по запросу <b>${options.requestName}</b> \nВсего по запросу бот запомнил <b>${options.knownAds.size}</b> уникальных объявлений\nСледующая проверка через <b>${options.frequency}</b> мин.`, { parse_mode: `HTML` });
  log.next(options.requestName, options.frequency);
  if (results.length) {
    setTimeout(() => {
      results.forEach((item) => {
        bot.sendMessage(options.chatID, `► <b>${item.date}</b>, ${item.price} --> <a href='${item.link}'>ссылка</a>`, { parse_mode: `HTML` });
        log.item(item);
      })
    }, 3000);
  }
}

log.start();
