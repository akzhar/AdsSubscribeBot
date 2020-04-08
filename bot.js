const https = require('https');
const telegramBot = require(`node-telegram-bot-api`);
const fs = require(`fs`);
const db = require(`./db.js`);
const utils = require(`./utils.js`);
const log = require(`./log.js`);
const config = require(`./config.js`);
// const avito = require(`./avito.js`);
const cian = require(`./cian.js`);
const autoyoula = require(`./auto.youla.js`);
const youla = require(`./youla.js`);
const domofond = require(`./domofond.js`);
const domclick = require(`./domclick.js`);

const AVAILABLE_SITES = `Youla, Cian, Domofond, Domclick`;
const REGEXP_STOP_REQUEST = /^\/stop\s(cian|youla|domofond|domclick)\s\S+$/;
const REGEXP_URL = /^(https?:\/\/)?(.+\.)?(cian|youla|domofond|domclick)\.ru\/.+$/;
const REGEXP_ADD_REQUEST = /^\/add\s\S+$/;
const REGEXP_NUMBER = /^\d+$/;
const PAGE_COUNT = 3;
const MIN = 60000; // ms

const users = {};
const textStart = fs.readFileSync(`textStart.txt`, `utf8`).trim();
const textHelp = fs.readFileSync(`textHelp.txt`, `utf8`).trim();
const botOptions = config.botOptions;
const bot = new telegramBot(config.token, botOptions);

if (config.isDeploy) {
  bot.setWebHook(config.botHook);
}

function Request() {
  this.url = ``,
  this.frequency = 0,
  this.iterations = 0,
  this.knownAds = {}
}

function User(name) {
  this.name = name,
  this.newRequest = {
    site: ``,
    name: ``
  },
  this.requests = {
    // 'avito' : {},
    'cian': {},
    'auto.youla': {},
    'youla': {},
    'domofond': {},
    'domclick': {}
  }
}

function defineSite(requestUrl) {
  // if (requestUrl.includes(`avito.ru`)) return `avito`;
  if (requestUrl.includes(`cian.ru`)) return `cian`;
  if (requestUrl.includes(`auto.youla.ru`)) return `auto.youla`;
  if (requestUrl.includes(`youla.ru`)) return `youla`;
  if (requestUrl.includes(`domofond.ru`)) return `domofond`;
  if (requestUrl.includes(`domclick.ru`)) return `domclick`;
  return `unknown`;
}

function getSiteUrl(siteName, url, page) {
  // if (siteName === `avito`) return avito.getUrl(url, page);
  if (siteName === `cian`) return cian.getUrl(url, page);
  if (siteName === `auto.youla`) return autoyoula.getUrl(url, page);
  if (siteName === `youla`) return youla.getUrl(url, page);
  if (siteName === `domofond`) return domofond.getUrl(url, page);
  if (siteName === `domclick`) return domclick.getUrl(url, page);
}

function getSiteNewItems(siteName, html, knownAds) {
  // if (siteName === `avito`) return avito.getNewItems(html, knownAds);
  if (siteName === `cian`) return cian.getNewItems(html, knownAds);
  if (siteName === `auto.youla`) return autoyoula.getNewItems(html, knownAds);
  if (siteName === `youla`) return youla.getNewItems(html, knownAds);
  if (siteName === `domofond`) return domofond.getNewItems(html, knownAds);
  if (siteName === `domclick`) return domclick.getNewItems(html, knownAds);
}

function sendMessage(chatID, text) {
  bot.sendMessage(chatID, text, { parse_mode: `HTML`, disable_web_page_preview: true });
}

bot.on(`polling_error`, (error) => console.log(`Polling error: `, error));

bot.on(`message`, (msg) => {
  const chatID = msg.chat.id;
  const userName = msg.from.first_name;
  log.msg(msg);

  if (!users.hasOwnProperty(chatID)) {
    const userObj = new User(userName);
    users[chatID] = userObj;
    db.createUser(chatID, userObj);
    log.users(users);
  }

  newRequestName = users[chatID].newRequest.name;
  newRequestSite = users[chatID].newRequest.site;

  const userText = msg.text.trim();
  if (userText === `/start`) { // ввод команды /start
    sendMessage(chatID, textStart);
  } else if (userText === `/show`) { // ввод команды /show - просмотр активных подписок
    let text = ``;
    const requests = users[chatID].requests;
    for(let siteName in requests) {
      if (requests.hasOwnProperty(siteName) && utils.getObjSize(requests[siteName])) {
        text += `<b>Подписки на сайт ${siteName}:</b>\n`;
        for(let requestName in requests[siteName]) {
          if (requests[siteName].hasOwnProperty(requestName)) {
            const url = requests[siteName][requestName].url;
            const frequency = requests[siteName][requestName].frequency;
            const iterations = requests[siteName][requestName].iterations;
            text += `► <a href="${url}">${requestName}</a> (раз в <b>${frequency}</b> мин., просканировано <b>${iterations}</b> раз)\n`;
          }
        }
      }
    }
    if (!text) text = `У вас нет активных подписок.`;
    sendMessage(chatID, text);
  } else if (REGEXP_ADD_REQUEST.test(userText)) { // ввод команды /add имя_подписки - добавление новой подписки
    const requestName = userText.slice(`/add `.length);
    users[chatID].newRequest.name = requestName;
    sendMessage(chatID, `ОК. Пришлите мне ссылку для подписки <b>${requestName}</b>...\n${AVAILABLE_SITES}`);
  } else if (REGEXP_URL.test(userText)) { // ввод адреса подписки
    const requestUrl = userText;
    const siteName = defineSite(requestUrl);
    if (siteName === `unknown`) {
      sendMessage(chatID, `Неверная ссылка.\nПришлите для подписки <b>${newRequestName}</b> ссылку на один из поддерживаемых ботом сайтов...`);
    } else if (users[chatID].requests[siteName].hasOwnProperty(newRequestName)) { // если по сайту уже есть подписка с таким же именем
      sendMessage(chatID, `Подписка с именем <b>${newRequestName}</b> на сайт <b>${siteName}</b> уже существует.`);
    } else if (newRequestName) {
      users[chatID].newRequest.site = siteName;
      users[chatID].requests[siteName][newRequestName] = new Request();
      users[chatID].requests[siteName][newRequestName].url = requestUrl;
      sendMessage(chatID, `ОК, я буду следить за объявлениями на <b>${siteName}</b> по этой ссылке.\nПришлите интервал оповещения по подписке <b>${newRequestName}</b>.\nВведите количество минут...`);
    } else {
      sendMessage(chatID, `Сначала задайте имя для новой подписки c помощь команды <code>/add</code>\n/help - справка по доступным командам`);
    }
  } else if (REGEXP_NUMBER.test(userText)) { // ввод интервала оповещения по подписке
    if (newRequestName && newRequestSite) {
      const frequency = +userText;
      users[chatID].requests[newRequestSite][newRequestName].frequency = frequency;
      db.updateUser(chatID, users[chatID]);
      sendMessage(chatID, `Готово. Подписка <b>${newRequestName}</b> на сайт <b>${newRequestSite}</b> активирована.\nЯ просканировал <b>{PAGE_COUNT}</b> первые страницы выдачи.\nОповещение раз в <b>${frequency}</b> мин.`);
      doSiteRequest(newRequestSite, newRequestName, chatID);
    }
  } else if (REGEXP_STOP_REQUEST.test(userText)) { // ввод команды /stop имя_сайта имя_подписки - остановка указанной подписки
    const [siteName, requestName] = userText.slice(`/stop `.length).split(` `);
    if (users[chatID].requests[siteName].hasOwnProperty(requestName)) { // если по сайту уже есть подписка с таким же именем
      delete users[chatID].requests[siteName][requestName];
      db.updateUser(chatID, users[chatID]);
      sendMessage(chatID, `Подписка на <b>${siteName}</b> с именем <b>${requestName}</b> остановлена.`);
    } else {
      sendMessage(chatID, `Подписки на <b>${siteName}</b> с именем <b>${requestName}</b> не существует.\n/show - просмотр активных подписок`);
    }
  } else if (userText === `/stopall`) { // ввод команды /stopall - остановка всех активных подписок
    delete users[chatID];
    db.deleteUser(chatID);
    log.users(users);
    sendMessage(chatID, `Все активные подписки остановлены.`);
  } else {
    const msgText = (userText === `/help` || userText === `/add` || userText === `/stop`) ? textHelp : `Невалидный ввод!`;
    sendMessage(chatID, msgText);
  }
});

function doSiteRequest(siteName, requestName, chatID) {
  if (users.hasOwnProperty(chatID) && users[chatID].requests[siteName].hasOwnProperty(requestName)) {
    const request = users[chatID].requests[siteName][requestName];
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
  let newItemsAll = [];
  let counter = 0;
  let lastPage = PAGE_COUNT;
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
          log.results(newItems, page, options);
          newItemsAll = [...newItemsAll, ...newItems];
          if (counter === lastPage) {
            if (newItemsAll.length) {
              db.updateUser(options.chatID, users[options.chatID]);
            }
            if (options.iterations > 1) {
              printResults(newItemsAll, options);
            }
            if (!utils.getObjSize(options.knownAds)) {
              sendMessage(config.debugChatID, `Неправильный парсинг URL!\nВсего 0 уникальных объявлений по URL:\n${options.url}`);
            }
          }
        });
      } else {
        lastPage--;
      }
      log.status(url, page, response, users, options);
    });
    request.on('error', (error) => console.error(`Ошибка get запроса к сайту: `, error));
    request.end();
  }
}

function printResults(newItemsAll, options) {
  sendMessage(options.chatID, `<b>${newItemsAll.length}</b> новых объявлений с сайта <b>${options.siteName}</b> по подписке <b>${options.requestName}</b> \nВсего по данной подписке бот запомнил <b>${utils.getObjSize(options.knownAds)}</b> уникальных объявлений\nСледующая проверка через <b>${options.frequency}</b> мин.`);
  log.next(options.requestName, options.frequency);
  if (newItemsAll.length) {
    setTimeout(() => {
      newItemsAll.forEach((item) => {
        sendMessage(options.chatID, `► <b>${item.date}</b>, ${item.price} --> <a href='${item.link}'>ссылка</a>`);
        log.item(item);
      })
    }, 3000);
  }
}

async function runUsersQueriesFromDB() {
  let response = await db.getUsers();
  response.rows.forEach(user => {
    users[user.chatid] = JSON.parse(user.userobj);
  });
  log.allUsers(users);
  if (utils.getObjSize(users)) {
    log.rerun();
    for(let chatID in users) {
      const requests = users[chatID].requests;
      for(let siteName in requests) {
        if (requests.hasOwnProperty(siteName) && utils.getObjSize(requests[siteName])) {
          for(let requestName in requests[siteName]) {
            if (requests[siteName].hasOwnProperty(requestName)) {
              log.request(requestName, siteName, chatID, users);
              doSiteRequest(siteName, requestName, chatID);
            }
          }
        }
      }
    }
  }
}

runUsersQueriesFromDB();

log.start();
