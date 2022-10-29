import LoggerService from '@services/logger';
import Site, { TSiteKnownAds, TSiteItem } from '@models/site';
import { UserSubscription } from '@models/user';

import https from 'https';

const PAGE_COUNT = 1;

class WebService {
  static _instance: WebService;
  sites!: { [siteName:string]: Site };
  logger!: LoggerService;

  constructor(sites: { [siteName:string]: Site }, logger: LoggerService) {
    if (!WebService._instance) {
      this.sites = sites;
      this.logger = logger;
      WebService._instance = this;
    }
    return WebService._instance;
  }

  getSiteUrl(siteName: string, url: string, page: number) {
    const site: Site = this.sites[siteName];
    if (site) {
      return site.getUrl({ url, page });
    }
    return '';
  }

  getSiteNewItems(siteName: string, html: string, knownAds: TSiteKnownAds) {
    const site: Site = this.sites[siteName];
    if (site) {
      return site.getNewItems(html, knownAds);
    }
    return [];
  }

  async getSitePage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let html = ''
      https.get(url, (res) => {
        // logger.reqStatus(url, page, response, users, options);
        res.on('error', err => reject(err));
        res.on('data', (chunk) => { html += chunk })
        res.on('end', () => resolve(html))
      })
    })
  }

  async doSiteRequest(subscription: UserSubscription): Promise<TSiteItem[]> {
    const siteName = Site.getSiteName(subscription.url);
    let newItems: TSiteItem[] = [];
    for (let page = 1; page <= PAGE_COUNT; page++) {
      const url = this.getSiteUrl(siteName, subscription.url, page);
      try {
        // eslint-disable-next-line no-await-in-loop
        const html = await this.getSitePage(url);
        const items = this.getSiteNewItems(siteName, html, subscription.knownAds);
        newItems = [...newItems, ...items];
      } catch (err) {
        this.logger.error(`Ошибка во время запроса к сайту ${siteName}`);
      }
    }
    return newItems;
  }

}

export default WebService;
