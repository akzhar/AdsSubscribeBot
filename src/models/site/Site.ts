// import jsdom from 'jsdom'
import url from 'url';

// const { JSDOM } = jsdom;
import { parse, HTMLElement } from 'node-html-parser';

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

  getItemKey(item: HTMLElement): string {
    return this.getItemLink(item);
  }

  getNewItems(html: string, knownAds: TSiteKnownAds): TSiteItem[] {
    // const dom = new JSDOM(html); // TODO error is here (try another parsing library) TypeError: Cannot read properties of undefined (reading 'some')
    // const items: NodeListOf<Element> = dom.window.document.querySelectorAll(this.cssSelector.elem);
    const root = parse(html);
    const items: HTMLElement[] = root.querySelectorAll(this.cssSelector.elem);

    console.log('items ', items.length, ' found');

    const newItems: TSiteItem[] = [];
    items.forEach((item: HTMLElement) => {
      const key = this.getItemKey(item);
      if (!Object.prototype.hasOwnProperty.call(knownAds, key)) {
        knownAds[key] = true;
        const newItem = this.getNewItem(item);
        newItems.push(newItem);
      }
    });
    return newItems;
  }

  getNewItem(item: HTMLElement): TSiteItem {
    const date = this.getItemDate(item);
    const price = this.getItemPrice(item);
    const link = this.getItemLink(item);
    const newItem = { date, price, link };
    return newItem;
  }

  getItemLinkContent(item: HTMLElement): string {
    const link = item.querySelector(this.cssSelector.link);
    return link?.getAttribute('href') || '';
  }

  getItemDateContent(item: HTMLElement): string | undefined {
    return item.querySelector(this.cssSelector.date)?.textContent?.trim();
  }

  getItemPriceContent(item: HTMLElement): string | undefined {
    return item.querySelector(this.cssSelector.price)?.textContent?.trim();
  }

  getItemLink(item: HTMLElement): string {
    const link = this.getItemLinkContent(item);
    const siteUrl = this.url;
    return link.slice(0, siteUrl.length) === siteUrl ? link : `${siteUrl}${link}`;
  }

  getItemDate(item: HTMLElement): string | undefined {
    return this.getItemDateContent(item);
  }

  getItemPrice(item: HTMLElement): string | undefined {
    return this.getItemPriceContent(item);
  }
}

export default Site;
