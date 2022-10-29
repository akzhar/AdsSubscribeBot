import { TSiteKnownAds, TSiteItem } from '@models/site';

import { TAvailableSites } from '../../sites'

export class UserSubscription {
  name: string;
  url: string;
  frequency: number;
  iterationCounter: number;
  knownAds: TSiteKnownAds

  constructor(name: string, url: string) {
    this.name = name,
    this.url = url,
    this.frequency = 60 * 24, // 1 day
    this.iterationCounter = 0,
    this.knownAds = {}
  }

  increaseIterationCounter() {
    this.iterationCounter++;
  }

  saveNewAds(newItems: TSiteItem[]) {
    newItems.forEach((item) => {
      if(item) this.knownAds[item.link] = true;
    });
  }

}

class User {
  chatId: number;
  name: string;
  subscriptions: {
    [site in TAvailableSites]: { [name: string]: UserSubscription }
  };

  constructor(chatId: number, name: string) {
    this.chatId = chatId;
    this.name = name;
    this.subscriptions = {
      avito: {},
      cian: {},
      youla: {},
      domofond: {},
      domclick: {}
    };
  }

  hasSubscription(siteName: TAvailableSites, subscriptionName: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.subscriptions[siteName], subscriptionName);
  }

  getSubscription(siteName: TAvailableSites, subscriptionName: string) {
    return this.subscriptions[siteName][subscriptionName];
  }

  addSubscription(siteName: TAvailableSites, subscriptionName: string, subscriptionUrl: string) {
    this.subscriptions[siteName][subscriptionName] = new UserSubscription(subscriptionName, subscriptionUrl);
  }

  removeSubscription(siteName: TAvailableSites, subscriptionName: string) {
    delete this.subscriptions[siteName][subscriptionName];
  }

}

export default User;
