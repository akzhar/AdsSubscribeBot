import jsdom from 'jsdom'

import url from 'url';

const { JSDOM } = jsdom;

export type TSiteUrlComponents = { url: string; page: number; }
export type TSiteKnownAds = { [url: string]: true };
type TSiteCssSelector = { elem: string; link: string; date: string; price: string; }
interface ISiteUrlComponents { url: string; page: number; }
interface ISiteOptions { url: string; cssSelector: TSiteCssSelector; dateParam: string; }
export type TSiteItem = { date: string | undefined; price: string | undefined; link: string; };

class Site {
  url: string;
  cssSelector: TSiteCssSelector;
  dateParam: string;

  constructor({ url, cssSelector, dateParam }: ISiteOptions) {
    this.url = url;
    this.cssSelector = cssSelector;
    this.dateParam = dateParam;
  }

  static getSiteName(requestUrl: string): string {
    const hostname = url.parse(requestUrl).hostname;
    if(hostname) {
      return hostname.split('.').reverse()[1];
    }
    return 'unknown';
  }

  getUrlComponents({ url, page }: ISiteUrlComponents): TSiteUrlComponents {
    if (url.includes('?')) {
      url = `${url}&${this.dateParam}`;
    } else {
      if (url[url.length - 1] !== '/') url = `${url}/`;
      url = `${url}?${this.dateParam}`;
    }
    return { url, page };
  }

  getUrl({ url, page }: ISiteUrlComponents): string {
    const urlComponents = this.getUrlComponents({ url, page });
    return `${urlComponents.url}&p=${urlComponents.page}`;
  }

  getItemKey(item: Element): string {
    return this.getItemLink(item);
  }

  getNewItems(html: string, knownAds: TSiteKnownAds): TSiteItem[] {
    const dom = new JSDOM(html);
    const items: NodeListOf<Element> = dom.window.document.querySelectorAll(this.cssSelector.elem);
    const newItems: TSiteItem[] = [];
    items.forEach((item: Element) => {
      const key = this.getItemKey(item);
      if (!Object.prototype.hasOwnProperty.call(knownAds, key)) {
        knownAds[key] = true;
        const newItem = this.getNewItem(item);
        newItems.push(newItem)
      }
    });
    return newItems;
  }

  getNewItem(item: Element): TSiteItem {
    const date = this.getItemDate(item);
    const price = this.getItemPrice(item);
    const link = this.getItemLink(item);
    const newItem = { date, price, link };
    return newItem;
  }

  getItemLinkContent(item: Element): string {
    const link = item.querySelector(this.cssSelector.link) as HTMLAnchorElement
    return link.href;
  }

  getItemDateContent(item: Element): string | undefined {
    return item.querySelector(this.cssSelector.date)?.textContent?.trim();
  }

  getItemPriceContent(item: Element): string | undefined {
    return item.querySelector(this.cssSelector.price)?.textContent?.trim();
  }

  getItemLink(item: Element): string {
    const link = this.getItemLinkContent(item);
    const siteUrl = this.url;
    return link.slice(0, siteUrl.length) === siteUrl ? link : `${siteUrl}${link}`;
  }

  getItemDate(item: Element): string | undefined {
    return this.getItemDateContent(item);
  }

  getItemPrice(item: Element): string | undefined {
    return this.getItemPriceContent(item);
  }
}

export default Site;
