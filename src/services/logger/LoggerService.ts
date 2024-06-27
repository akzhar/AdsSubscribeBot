import pino, { BaseLogger } from 'pino';

class LoggerService {
  static _instance: LoggerService;
  loggerAgent!: BaseLogger;

  constructor(mode: string) {
    if (!LoggerService._instance) {
      let stream;
      if(mode === 'production') {
        stream = pino.destination({ dest: '/log', sync: false });
      }
      this.loggerAgent = pino(stream);
      if(mode !== 'production') {
        this.loggerAgent.level = 'trace';
      }
      LoggerService._instance = this;
    }
    return LoggerService._instance;
  }

  fatal(text: string) {
    this.loggerAgent.fatal(text);
  }

  error(text: string) {
    this.loggerAgent.error(text);
  }

  warn(text: string) {
    this.loggerAgent.warn(text);
  }

  info(text: string) {
    this.loggerAgent.info(text);
  }

  debug(text: string) {
    this.loggerAgent.debug(text);
  }

  trace(text: string) {
    this.loggerAgent.trace(text);
  }

}

// const start = () => logger.info('Бот запущен...')

// const item = (item: TSiteItem) => logger.info(`► ${item?.date}, ${item?.price} --> ${item?.link}`);

// const allUsers = (usersObj) => {
//   logger.info(`Всего на бота подписано: ${getObjSize(usersObj)}`);
//   logger.info(`Все пользователи:\n${stringify(usersObj)}`);
// }

// const users = (usersObj) => {
//   logger.info(`Изменилось кол-во пользователей бота. Всего на бота подписано: ${getObjSize(usersObj)}`);
// }

// const next = (requestName: string, frequency: number) => {
//   logger.info(`Следующая проверка по подписке '${requestName}' через ${frequency} мин.`);
// }

// const reqStatus = (url: string, page: number, response, usersObj, options) => {
// eslint-disable-next-line max-len
//   logger.info(`Запрос '${options.requestName}' пользователя ${usersObj[options.chatID].name} [id${options.chatID}] - итерация No ${options.iterations} - статус ${response.statusCode}, ${response.statusMessage}`);
//   logger.info(`Стр. ${page} - адрес: ${url}`);
//   // logger.info(`Заголовки ответа:\n${stringify(response.headers)}`);
//   // logger.info(`Контент: ${response.body}`);
//   // logger.info(`Редирект: ${response.headers.location}`);
//   logger.info(`-----------------------------------------------------`);
// }

// const results = (newItems: TSiteItem[], page: number, options) => {
//   logger.info(`Стр. ${page} - новых объявлений по подписке: ${newItems.length}`);
//   logger.info(`Всего по данной подписке бот запомнил объявлений: ${getObjSize(options.knownAds)}`);
//   logger.info(`-----------------------------------------------------`);
// }

// const rerun = () => logger.info(`Перезапуск пользовательских подписок...`);

// const request = (requestName: string, siteName: string, chatID: string, usersObj) => {
// eslint-disable-next-line max-len
//   logger.info(`Перезапуск подписки '${requestName}' на ${siteName} пользователя ${usersObj[chatID].name} [id${chatID}]`);
// }

// export const logFunc = {
//   start,
//   item,
//   allUsers,
//   users,
//   next,
//   reqStatus,
//   results,
//   rerun,
//   request
// };

export default LoggerService;
