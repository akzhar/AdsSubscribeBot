/* eslint-disable max-len */
import TelegramBot, { ConstructorOptions } from 'node-telegram-bot-api';
import getObjSize from '@utils/get-obj-size';
import capitalize from '@utils/capitalize';
import Site, { TSiteItem } from '@models/site';
import User, { UserSubscription } from '@models/user/User';
import Database from '@services/database';
import LoggerService from '@services/logger';
import WebService from '@services/web';

import fs from 'fs';

import { AVAILABLE_SITES } from './sites'

const MINUTE = 60000; // 60 sec

const COMMAND = {
  start: 'start',
  show: 'show',
  add: 'add',
  stop: 'stop',
  stopall: 'stopall'
}

const COMMAND_REGEXP = {
  // eslint-disable-next-line no-useless-escape
  add: new RegExp(`^\/${COMMAND.add}\s\S+\s(https?:\/\/)?(.+\.)?(${AVAILABLE_SITES.join('|')})\.ru\/.+$`),
  // eslint-disable-next-line no-useless-escape
  stop: new RegExp(`^\/${COMMAND.stop}\s(${AVAILABLE_SITES.join('|')})\s\S+$`)
};

type TBotConfig = {
  token: string,
  host: string,
  port: string
};

class Bot {
  static _instance: Bot;
  api!: TelegramBot;
  db!: Database;
  logger!: LoggerService;
  web!: WebService;
  users!: { [chatId: string]: User };
  hint!: { start: string; help: string };
  srvcChatId!: number;

  constructor(mode: string, db: Database, logger: LoggerService, web: WebService, config: TBotConfig, srvcChatId: number) {
    if (!Bot._instance) {
      const botOptions: ConstructorOptions = {};
      if (mode === 'production') {
        botOptions.webHook = {
          host: '0.0.0.0',
          port: +config.port
        };
      } else {
        botOptions.polling = true;
      }
      this.api = new TelegramBot(config.token, botOptions);
      if (mode === 'production') {
        this.api.setWebHook(`${config.host}:${config.port}/bot${config.token}`);
      }
      this.db = db;
      this.logger = logger;
      this.web = web;
      this.users = {};
      const availableSites = AVAILABLE_SITES.map(name => capitalize(name)).join(', ');
      this.hint = {
        start: fs.readFileSync('./hints/textStart.txt', 'utf8').trim(),
        help: `${fs.readFileSync('./hints/textHelp.txt', 'utf8').trim()}\n\nПоддерживаемые сайты:\n${availableSites}`
      };
      this.srvcChatId = srvcChatId;
      Bot._instance = this;
    }
    return Bot._instance;
  }

  sendMessage(chatId: number, text: string) {
    this.api.sendMessage(chatId, text, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  sendServiceMessage(text: string) {
    this.sendMessage(this.srvcChatId, text);
  }

  parseMessage(msg: TelegramBot.Message) {
    const userName = msg.from?.first_name || `unknown_user_${Date.now()}`;
    const chatId = msg.chat.id;
    const userText = msg.text?.trim() || '';
    return { userName, chatId, userText }
  }

  showStartHint(chatId: number) {
    this.sendMessage(chatId, this.hint.start);
  }

  showHelpHint(chatId: number) {
    this.sendMessage(chatId, this.hint.help);
  }

  createUser(chatId: number, userName: string) {
    const user = new User(chatId, userName);
    this.db.createUser(chatId, user)
      .then(() => this.users[chatId] = user);
  }

  deleteUser(chatId: number) {
    this.db.deleteUser(chatId)
      .then(() => delete this.users[chatId]);
  }

  getCashedUser(chatId: number): User {
    return this.users[chatId];
  }

  showSubscriptions(chatId: number) {
    let text = '';
    const user = this.getCashedUser(chatId);
    const subscriptions = user.subscriptions;
    for(const siteName in user.subscriptions) {
      const siteSubscriptions = subscriptions[siteName];
      if (Object.prototype.hasOwnProperty.call(subscriptions, siteName) && getObjSize(siteSubscriptions)) {
        text += `<b>Подписки на сайт ${siteName}:</b>\n`;
        for(const subscriptionName in siteSubscriptions) {
          if (Object.prototype.hasOwnProperty.call(siteSubscriptions, subscriptionName)) {
            const { url, frequency, iterationCounter }  = siteSubscriptions[subscriptionName];
            text += `► <a href="${url}">${subscriptionName}</a> (раз в <b>${frequency}</b> мин., просканировано <b>${iterationCounter}</b> раз)\n`;
          }
        }
      }
    }
    if (!text) text = 'У вас нет активных подписок.';
    this.sendMessage(chatId, text);
  }

  sendNewItems(chatId: number, newItems: TSiteItem[], subscription: UserSubscription) {
    const siteName = Site.getSiteName(subscription.url);
    this.sendMessage(chatId, `<b>${newItems.length}</b> новых объявлений с сайта <b>${siteName}</b> по подписке <b>${subscription.name}</b> \nВсего по данной подписке бот запомнил <b>${getObjSize(subscription.knownAds)}</b> уникальных объявлений\nСледующая проверка через <b>${subscription.frequency}</b> мин.`);
    if (newItems.length) {
      let text = '';
      newItems.forEach((item: TSiteItem) => {
        text += `► <b>${item.date}</b>, ${item.price} --> <a href='${item.link}'>ссылка</a>\n`;
      })
      this.sendMessage(chatId, text);
    }
  }

  async runSubscription(user: User, subscription: UserSubscription) {
    subscription.increaseIterationCounter();
    const newItems: TSiteItem[] = await this.web.doSiteRequest(subscription);
    if (newItems.length) {
      subscription.saveNewAds(newItems)
      this.db.updateUser(user.chatId, user)
        .then(() => this.sendNewItems(user.chatId, newItems, subscription));
    } else {
      this.sendServiceMessage(`0 уникальных объявлений по URL:\n${subscription.url}`);
    }
  }

  addSubscription(chatId: number, subscriptionName: string, subscriptionUrl: string) {
    const siteName = Site.getSiteName(subscriptionUrl);
    const user = this.getCashedUser(chatId);

    switch(true) {
      case siteName === 'unknown':
        this.sendMessage(chatId, `Неверная ссылка.\nПришлите для подписки <b>${subscriptionName}</b> ссылку на один из поддерживаемых ботом сайтов...`);
        break;
      case user.hasSubscription(siteName, subscriptionName):
        this.sendMessage(chatId, `Подписка с именем <b>${subscriptionName}</b> на сайт <b>${siteName}</b> уже существует.`);
        break;
      case subscriptionName !== '':
        user.addSubscription(siteName, subscriptionName, subscriptionUrl);
        this.db.updateUser(chatId, user);
        this.sendMessage(chatId, `Подписка <b>${subscriptionName}</b> на сайт <b>${siteName}</b> добавлена.`);
        if (user.hasSubscription(siteName, subscriptionName)) {
          const subscription = user.getSubscription(siteName, subscriptionName);
          this.runSubscription(user, subscription);
          this.sendMessage(chatId, `Подписка активирована.\nОповещение раз в <b>${subscription.frequency}</b> мин.`)
          setTimeout(() => this.runSubscription(user, subscription), subscription.frequency * MINUTE);
        }
        break;
      default:
        this.sendMessage(chatId, 'Задайте имя и ссылку для новой подписки c помощь команды <code>/add</code>\n<code>/help</code> - справка по доступным командам');
        break;
    }

  }

  removeSubscription(chatId: number, siteName: string, subscriptionName: string) {
    const wrongSiteName = Boolean(!Object.prototype.hasOwnProperty.call(AVAILABLE_SITES, siteName));
    const user = this.getCashedUser(chatId);

    switch(true) {
      case wrongSiteName:
        this.sendMessage(chatId, 'Указано неверное имя сайта.\nПришлите команду в корректном формате.\n<code>/help</code> - справка по доступным командам');
        break;
      case user.hasSubscription(siteName, subscriptionName):
        user.removeSubscription(siteName, subscriptionName);
        this.db.updateUser(chatId, user);
        this.sendMessage(chatId, `Подписка на <b>${siteName}</b> с именем <b>${subscriptionName}</b> остановлена.`);
        break;
      default:
        this.sendMessage(chatId, `Подписки на <b>${siteName}</b> с именем <b>${subscriptionName}</b> не существует.\n<code>/show</code> - просмотр активных подписок`);
        break;
    }

  }

  stopAllSubscriptions(chatId: number) {
    this.deleteUser(chatId);
    this.sendMessage(chatId, 'Все активные подписки остановлены.');
  }

  run() {

    this.api.on('polling_error', (error: Error) => {
      this.logger.error(`Polling error: ${error}`);
    });

    this.api.on('message', (msg: TelegramBot.Message) => {

      const { userName, chatId, userText } = this.parseMessage(msg);
      this.logger.debug(`Бот получил сообщение от пользователя ${userName} [${chatId}]: '${userText}'`);

      let paramsArr = [];
      let siteName, subscriptionName, subscriptionUrl;

      switch(true) {
        case userText === `/${COMMAND.start}`:
          this.showStartHint(chatId);
          if (!Object.prototype.hasOwnProperty.call(this.users, chatId)) {
            this.createUser(chatId, userName);
          }
          break;
        case userText === `/${COMMAND.show}`: // просмотр активных подписок
          this.showSubscriptions(chatId);
          break;
        case COMMAND_REGEXP.add.test(userText): // добавление новой подписки
          paramsArr = userText.trim().split(' ');
          subscriptionName = paramsArr[1];
          subscriptionUrl = paramsArr[2];
          this.addSubscription(chatId, subscriptionName, subscriptionUrl);
          break;
        case COMMAND_REGEXP.stop.test(userText): // остановка указанной подписки
          paramsArr = userText.trim().split(' ');
          siteName = paramsArr[1];
          subscriptionName = paramsArr[2];
          this.removeSubscription(chatId, siteName, subscriptionName);
          break;
        case userText === `/${COMMAND.stopall}`: // остановка всех активных подписок
          this.stopAllSubscriptions(chatId);
          break;
        default:
          this.showHelpHint(chatId);
          break;
      }

    });
  }

}

export default Bot;
