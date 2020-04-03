const utils = require(`./utils.js`);

start = () => {
  console.log(`\nБот запущен...`);
  console.log(`-----------------------------------------------------`);
}

item = (item) => {
  console.log(`► ${item.date}, ${item.price} --> ${item.link}`);
}

users = (usersObj) => {
  console.log(`Изменилось кол-во пользователей бота. Всего на бота подписано: ${utils.getObjSize(usersObj)}`);
  // console.log(`Все пользователи:\n${utils.debug(usersObj)}\n`);
  console.log(`-----------------------------------------------------`);
}

msg = (msg) => {
  console.log(`${utils.getTimestamp()} - Бот получил сообщение от пользователя ${msg.from.first_name} [${msg.from.id}]: '${msg.text.trim()}'`);
  console.log(`-----------------------------------------------------`);
}

next = (requestName, frequency) => {
  console.log(`Следующая проверка по запросу ${requestName} через ${frequency} мин.`);
  console.log(`-----------------------------------------------------`);
}

requests = (usersObj, siteName, userId) => {
  console.log(`Все запросы пользователя ${usersObj[userId].name} [id${userId}] по сайту ${siteName}:\n${utils.debug(usersObj[userId].requests[siteName])}`);
}

status = (url, response, usersObj, options) => {
  console.log(`${utils.getTimestamp()} - Запрос '${options.requestName}' пользователя ${usersObj[options.userId].name} [id${options.userId}]`);
  console.log(`Статус ответа на запрос: ${response.statusCode}, ${response.statusMessage}`);
  console.log(`Итерация запроса: ${options.iterations}`);
  console.log(`Адрес запроса: ${url}`);
  // console.log(`Заголовки ответа:\n${utils.debug(response.headers)}`);
  // console.log(`Контент: ${response.body}`);
  // console.log(`Редирект: ${response.headers.location}`);
  console.log(`-----------------------------------------------------`);
}

results = (newItems, page, options) => {
  console.log(`Стр. ${page} - новых объявлений по запросу: ${newItems.length}`);
  console.log(`Всего по запросу бот запомнил объявлений: ${options.knownAds.size}`);
  console.log(`-----------------------------------------------------`);
}

const log = {
  start: start,
  item: item,
  users: users,
  msg: msg,
  next: next,
  requests: requests,
  status: status,
  results: results
};

module.exports = log;
