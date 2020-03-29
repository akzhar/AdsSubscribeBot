const utils = require(`./utils.js`);
const avito = require(`./avito.js`);
const telegramBot = require(`node-telegram-bot-api`);
const fs = require(`fs`);
// const agent = require('socks5-https-client/lib/Agent');

const PORT = process.env.PORT || 443;
const HOST = `0.0.0.0`;
const EXTERNAL_URL = process.env.CUSTOM_ENV_VARIABLE || 'https://tranquil-ravine-43566.herokuapp.com'
// обход блокировки Telegram в России --> host & port
// https://50na50.net/ru/proxy/socks5list
// const BOT_REQUEST = {
//   agentClass: agent,
//   agentOptions: {
//     socksHost: `89.133.198.138`,
//     socksPort: 6881
//   }
// };
const BOT_WEBHOOKS = {
  port: PORT,
  host: HOST
};
const BOT_OPTIONS = {
  // polling: true, // off to deploy, on to local
  // request: BOT_REQUEST,
  webHook: BOT_WEBHOOKS // on to deploy, off to local
};
const TOKEN = fs.readFileSync(`token.txt`, `utf8`).trim();
const bot = new telegramBot(TOKEN, BOT_OPTIONS);
bot.setWebHook(`${EXTERNAL_URL}:443/bot${TOKEN}`); // on to deploy, off to local

const MIN = 60000; // ms
const NEW_URL_CONFIG = {
  city: ``,
  category: ``,
  obj: ``,
  type: ``,
  pmin: 0,
  pmax: 0
};
const NEW_USER = {
  unique: new Set(),
  name: ``,
  metro: [],
  frequency: 0,
  urlConfig: {},
  url: ``
};
const KEYBOARDS = {
  city: [
    [`СПБ`, `МСК`],
    [`Закрыть`]
  ],
  category: [
    [`Квартиры`, `Комнаты`],
    [`Закрыть`]
  ],
  rooms1: [
    [`Студии`],
    [`1 к`, `2 к`, `3 к`],
    [`4 к`, `5 к`, `6 к`],
    [`7 к`, `8 к`, `9 к`],
    [`> 9 к`],
    [`Закрыть`]
  ],
  rooms2: [
    [`в 1 к кв`, `в 2 к кв`, `в 3 к кв`],
    [`в 4 к кв`, `в 5 к кв`, `в 6 к кв`],
    [`в 7 к кв`, `в 8 к кв`, `в 9 к кв`],
    [`в > 9 к кв`],
    [`Закрыть`]
  ],
  type: [
    [`Вторичка`, `Новостройка`],
    [`Закрыть`]
  ]
};
const CLOSE_KEYBOARD = { remove_keyboard: true };
const BOT_MSGS = {
  city: `ОК, начинаем!\nВыбери город...`,
  category: `Выбери категорию объекта...`,
  rooms1: `Выбери кол-во комнат в квартире...`,
  rooms2: `Выбери кол-во комнат в комуналке...`,
  type: `Выбери тип объекта...`,
  metro: `Рядом с какими станциями метро искать?\nВведи через запятую названия станций внутри квадратных скобок...\n<u>Формат ввода:</u>\n[ <i>Купчино, Звездная</i> ] - Купчино или Звездная\n[ <i>Купчино</i> ] - только Купчино\n[ * ] - все станции`,
  empty: `Пустой ввод...`,
  price: `Введи диапазон цен в рублях через дефис...\n<u>Формат ввода:</u>\n<i>1500000 - 3600000</i> - от 1.5 млн. руб. до 3.6 млн. руб.\n<i>0 - 0</i> - любая стоимость`,
  frequency: `Как часто присылать новые объявления?\nВведи кол-во минут...\n<u>Формат ввода:</u>\n<i>5</i> - каждые 5 мин.\n<i>15</i> - каждые 15 мин.`,
  switchOn: `Подписка включена.\nЧтобы отключить нажми /stop.`,
  switchOff: `Подписка отключена.\nЧтобы подписаться снова нажми /start.`,
  close: `Закрываю клавиатуру...`
};

const users = {};

function createUser(id, name) {
  users[id] = Object.assign({}, NEW_USER);
  users[id].name = name;
  users[id].unique = new Set();
  users[id].urlConfig = Object.assign({}, NEW_URL_CONFIG);
}

function removeUser(id) {
  delete users[id];
  utils.logUsersCount(users);
}

bot.on(`polling_error`, (error) => console.log(`Polling error: ${error}`));

bot.on(`message`, (msg) => {
  const id = msg.from.id;
  if (!users.hasOwnProperty(id)) createUser(id, msg.from.first_name);
  utils.logUserMessage(id, users[id].name, msg.text);

  if (msg.text === `/start`) {
    bot.sendMessage(id, BOT_MSGS.city, { reply_markup: { keyboard: KEYBOARDS.city } });
  } else if (/СПБ|МСК/.test(msg.text)) {
    if (msg.text === `СПБ`) {
      users[id].urlConfig.city = `sankt-peterburg`;
    } else if (msg.text === `МСК`) {
      users[id].urlConfig.city = `moskva`;
    }
    bot.sendMessage(id, BOT_MSGS.category, { reply_markup: { keyboard: KEYBOARDS.category } });
  } else if (/Квартиры|Комнаты/.test(msg.text)) {
    if (msg.text === `Квартиры`) {
      users[id].urlConfig.category = `kvartiry`;
      bot.sendMessage(id, BOT_MSGS.rooms1, { reply_markup: { keyboard: KEYBOARDS.rooms1 } });
    } else if (msg.text === `Комнаты`) {
      users[id].urlConfig.category = `komnaty`;
      bot.sendMessage(id, BOT_MSGS.rooms2, { reply_markup: { keyboard: KEYBOARDS.rooms2 } });
    }
  } else if (/в [1-9] к кв|в > 9 к кв/.test(msg.text)) {
    if (msg.text === `в > 9 к кв`) {
      users[id].urlConfig.obj = `v_mnogokomnatnoy_kvartire`
    } else if (/в [1-9] к кв/.test(msg.text)) {
      const rooms = msg.text.slice(2, 3);
      users[id].urlConfig.obj = `v_${rooms}-komnatnoy_kvartire`
    }
    bot.sendMessage(id, BOT_MSGS.metro, { reply_markup: CLOSE_KEYBOARD, parse_mode: `HTML` });
  } else if (/Студии|[1-9] к|> 9 к/.test(msg.text)) {
    if (msg.text === `Студии`) {
      users[id].urlConfig.obj = `studii`
    } else if (msg.text === `> 9 к`) {
      users[id].urlConfig.obj = `mnogokomnatnye`
    } else if (/[1-9] к/.test(msg.text)) {
      const rooms = msg.text.slice(0, 1);
      users[id].urlConfig.obj = `${rooms}-komnatnye`
    }
    bot.sendMessage(id, BOT_MSGS.type, { reply_markup: { keyboard: KEYBOARDS.type } });
  } else if (/Вторичка|Новостройка/.test(msg.text)) {
    if (msg.text === `Вторичка`) {
      users[id].urlConfig.type = `vtorichka`;
    } else if (msg.text === `Новостройка`) {
      users[id].urlConfig.type = `novostroyka`;
    }
    bot.sendMessage(id, BOT_MSGS.metro, { reply_markup: CLOSE_KEYBOARD, parse_mode: `HTML` });
  } else if (/\[.*\]/.test(msg.text)) {
    if (/\[\s*?\]/.test(msg.text)) {
      bot.sendMessage(id, BOT_MSGS.empty);
    } else if (/\[.+\]/.test(msg.text)) {
      let subwayArr = msg.text.slice(1, msg.text.length - 1).split(`,`);
      subwayArr = subwayArr.map((station) => station.trim());
      if (subwayArr.length === 1 && subwayArr[0] === `*`)
        users[id].metro = `*`;
      else {
        users[id].metro = subwayArr;
      }
      bot.sendMessage(id, BOT_MSGS.price, { parse_mode: `HTML` });
    }
  } else if (/^\d+\s*-\s*?\d+$/.test(msg.text)) {
    const priceRange = msg.text.match(/(\d+\s*?)+-(\s*?\d+)+/)[0];
    const pmin = +priceRange.slice(0, priceRange.indexOf(`-`)).trim();
    const pmax = +priceRange.slice(priceRange.indexOf(`-`) + 1, priceRange.length).trim();
    users[id].urlConfig.pmin = pmin;
    users[id].urlConfig.pmax = pmax;
    bot.sendMessage(id, BOT_MSGS.frequency, { parse_mode: `HTML` });
  } else if (/^\d+$/.test(msg.text)) {
    users[id].frequency = +msg.text;
    bot.sendMessage(id, BOT_MSGS.switchOn);
    users[id].url = avito.getURL(users[id].urlConfig);
    runAvitoScan(id);
  } else if (msg.text === `/stop`) {
    bot.sendMessage(id, BOT_MSGS.switchOff);
    removeUser(id);
  } else if (msg.text === `Закрыть`) {
    bot.sendMessage(id, BOT_MSGS.close, { reply_markup: CLOSE_KEYBOARD });
  }
});

function runAvitoScan(id) {
  if (users.hasOwnProperty(id)) {
    utils.logUsersInfo(users, id);
    const options = {
      chatId: id,
      bot: bot,
      url: users[id].url,
      metro: users[id].metro,
      frequency: users[id].frequency,
      unique: users[id].unique
    };
    avito.retrieveData(options);
    setTimeout(() => { runAvitoScan(id) }, options.frequency * MIN);
  }
}

utils.logBotStart();
