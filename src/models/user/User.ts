import { TSiteKnownAds, TSiteItem } from '@models/site';

import { TAvailableSites } from '../../sites'

type TSubscriptions = {
  [site in TAvailableSites]: { [name: string]: UserSubscription }
};

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
  subscriptions: TSubscriptions;

  constructor(chatId: number, name: string, subscriptions: TSubscriptions = {avito: {}, cian: {}, youla: {}, domofond: {}, domclick: {}}) {
    this.chatId = chatId;
    this.name = name;
    this.subscriptions = subscriptions;
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
