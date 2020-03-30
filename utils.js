getObjSize = (obj) => {
    let size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}

getTimestamp = () => {
  const now = new Date();
  return `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]`;
}

debug = (obj) => {
  return JSON.stringify(obj, null, 4);
}

logUsersCount = (users) => {
  console.log(`ВСЕГО НА БОТА ПОДПИСАНО ПОЛЬЗОВАТЕЛЕЙ:`, getObjSize(users));
  // console.log(`ВСЕ ПОЛЬЗОВАТЕЛИ:\n${debug(users)}\n`);
}

logUsersInfo = (users, id) => {
  logDashedline();
  console.log(getTimestamp());
  logUsersCount(users);
  console.log(`НАЧИНАЮ ОБРАБОТКУ ПОДПИСКИ ПОЛЬЗОВАТЕЛЯ: ${users[id].name} [${id}]`);
  console.log(`ОТПРАВЛЯЮ ЗАПРОС НА:`, users[id].url);
}

logServerResponse = (response) => {
  console.log(`СТАТУС:`, response.statusCode);
  console.log(`ЗАГОЛОВКИ ОТВЕТА:`, debug(response.headers));
  console.log(`КОНТЕНТ:`, response.body);
  console.log(`РЕДИРЕКТ:`, response.headers.location);
}

logFrequency = (frequency) => {
  console.log(`СЛЕДУЮЩАЯ ПРОВЕРКА AVITO ЧЕРЕЗ ${frequency} МИН.`);
}

logSearchResults = (count, unique) => {
  console.log(`СОБРАНО УНИКАЛЬНЫХ ОБЪЯВЛЕНИЙ:`, unique.size);
  console.log(`НОВЫХ ОБЪЯВЛЕНИЙ ПО ЗАПРОСУ:`, count);
  logDashedline();
}

sendSearchResults = (count, bot, chatId) => {
  if (bot) {
    bot.sendMessage(chatId, `<u>Новых объявлений по запросу:</u> <b>${count}</b>`, { parse_mode: `HTML` });
  }
}

sendFrequency = (frequency, bot, chatId) => {
  if (bot) {
    bot.sendMessage(chatId, `Следующая проверка Avito через ${frequency} мин.`);
  }
}

logNewItemInfo = (item) => {
  console.log(`► ${item.date} --> ${item.link}\nм. ${item.subway} [${item.distance}] ${item.price}`);
}

sendNewItemInfo = (item, bot, chatId) => {
  if (bot) {
    bot.sendMessage(chatId, `► <b>${item.date}</b> --> <a href='${item.link}'>ссылка</a>\nм. ${item.subway} [${item.distance}] <b>${item.price}</b>`, { parse_mode: `HTML` });
  }
}

logUserMessage = (id, name, text) => {
  console.log(`БОТ ПОЛУЧИЛ СООБЩЕНИЕ ОТ ПОЛЬЗОВАТЕЛЯ ${name} [${id}]: '${text}'`);
}

logBotStart = () => {
  console.log(`\nБОТ ЗАПУЩЕН...`);
}

logDashedline = () => {
  console.log(`-----------------------------------------------------`);
}

const utils = {
  debug: debug,
  logUsersCount: logUsersCount,
  logUsersInfo: logUsersInfo,
  logServerResponse: logServerResponse,
  logDashedline: logDashedline,
  logFrequency: logFrequency,
  logSearchResults: logSearchResults,
  logNewItemInfo: logNewItemInfo,
  logUserMessage: logUserMessage,
  logBotStart: logBotStart,
  sendNewItemInfo: sendNewItemInfo,
  sendSearchResults: sendSearchResults,
  sendFrequency: sendFrequency
};

module.exports = utils;
