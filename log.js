const utils = require(`./utils.js`);

start = () => {
  console.log(`\nБот запущен...`);
  console.log(`-----------------------------------------------------`);
}

item = (item) => {
  console.log(`► ${item.date}, ${item.price} --> ${item.link}`);
}

created = () => {
  console.log(`Пользователь в БД создан`);
  console.log(`-----------------------------------------------------`);
}

updated = () => {
  console.log(`Пользователь в БД обновлен`);
  console.log(`-----------------------------------------------------`);
}

deleted = () => {
  console.log(`Пользователь в БД удален`);
  console.log(`-----------------------------------------------------`);
}

allUsers = (usersObj) => {
  console.log(`Всего на бота подписано: ${utils.getObjSize(usersObj)}`);
  console.log(`Все пользователи:\n${utils.debug(usersObj)}\n`);
  console.log(`-----------------------------------------------------`);
}

users = (usersObj) => {
  console.log(`Изменилось кол-во пользователей бота. Всего на бота подписано: ${utils.getObjSize(usersObj)}`);
  console.log(`-----------------------------------------------------`);
}

msg = (msg) => {
  console.log(`${utils.getTimestamp()} - бот получил сообщение от пользователя ${msg.from.first_name} [${msg.from.id}]: '${msg.text.trim()}'`);
  console.log(`-----------------------------------------------------`);
}

next = (requestName, frequency) => {
  console.log(`${utils.getTimestamp()} - cледующая проверка по запросу '${requestName}' через ${frequency} мин.`);
  console.log(`-----------------------------------------------------`);
}

status = (url, page, response, usersObj, options) => {
  console.log(`${utils.getTimestamp()} - Запрос '${options.requestName}' пользователя ${usersObj[options.chatID].name} [id${options.chatID}] - итерация No ${options.iterations} - статус ${response.statusCode}, ${response.statusMessage}`);
  console.log(`Стр. ${page} - адрес: ${url}`);
  // console.log(`Заголовки ответа:\n${utils.debug(response.headers)}`);
  // console.log(`Контент: ${response.body}`);
  // console.log(`Редирект: ${response.headers.location}`);
  console.log(`-----------------------------------------------------`);
}

results = (newItems, page, options) => {
  console.log(`Стр. ${page} - новых объявлений по запросу: ${newItems.length}`);
  console.log(`Всего по запросу бот запомнил объявлений: ${utils.getObjSize(options.knownAds)}`);
  console.log(`-----------------------------------------------------`);
}

rerun = () => {
  console.log(`Перезапуск пользовательских запросов...`);
  console.log(`-----------------------------------------------------`);
}

request = (requestName, siteName, chatID, usersObj) => {
  console.log(`${utils.getTimestamp()} - перезапуск запроса '${requestName}' на ${siteName} пользователя ${usersObj[chatID].name} [id${chatID}]`);
  console.log(`-----------------------------------------------------`);
}

const log = {
  created: created,
  updated: updated,
  deleted: deleted,
  start: start,
  item: item,
  allUsers: allUsers,
  users: users,
  msg: msg,
  next: next,
  status: status,
  results: results,
  rerun: rerun,
  request: request
};

module.exports = log;
