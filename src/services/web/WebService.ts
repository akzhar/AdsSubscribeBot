import LoggerService from '@services/logger';
import Site, { TSiteKnownAds, TSiteItem } from '@models/site';
import { UserSubscription } from '@models/user';

import https from 'https';
import http from 'http';

const PAGE_COUNT = 1;

type TProxyKeys = {
  'type': string | undefined,
  'ip': string | undefined,
  'port': string | undefined
};

type TProxy = {
  'host': string | null | undefined,
  'port': string | null | undefined
};

class WebService {
  static _instance: WebService;
  sites!: { [siteName:string]: Site };
  logger!: LoggerService;
  reqOptions!: { 'path': string, 'headers': { 'host': string }; };

  constructor(sites: { [siteName:string]: Site }, logger: LoggerService) {
    if (!WebService._instance) {
      this.sites = sites;
      this.logger = logger;
      this.reqOptions = { path: '', headers: { host: ''} };
      WebService._instance = this;
    }
    return WebService._instance;
  }

  _getSiteUrl(siteName: string, url: string, page: number) {
    const site: Site = this.sites[siteName];
    if (site) {
      return site.getUrl({ url, page });
    }
    return '';
  }

  _getSiteNewItems(siteName: string, html: string, knownAds: TSiteKnownAds) {
    const site: Site = this.sites[siteName];
    if (site) {
      return site.getNewItems(html, knownAds);
    }
    return [];
  }

  async _doWebRequest(options: string | https.RequestOptions | http.RequestOptions, isHttps = false): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = ''
      const client = isHttps ? https : http;
      const req = client.request(options, (res) => {
        if (res.statusCode !== 200) { reject(new Error(`Response code is: ${res.statusCode}`)); }
        res.on('error', err => reject(err));
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => resolve(data))
      });
      req.on('error', (err) => { reject(err); });
      req.end();
    });
  }

  // async _doHttpsRequest(options: string | https.RequestOptions | URL): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     let data = ''
  //     const req = https.request(options, (res) => {
  //       if (res.statusCode !== 200) { reject(new Error(`Response code is: ${res.statusCode}`)); }
  //       res.on('error', err => reject(err));
  //       res.on('data', (chunk) => { data += chunk })
  //       res.on('end', () => resolve(data))
  //     });
  //     req.on('error', (err) => { reject(err); });
  //     req.end();
  //   });
  // }

  // Get proxies list
  async _fetchProxyList() {
    // Fetch proxy list
    // const url = 'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.json';
    // const jsonProxyList = await doWebRequest(url, true);
    const jsonProxyList = '[{"Country":"China","IP Address":"123.57.1.78","Port":"8081","Type":"SOCKS4","Last Checked":"now","Ping":"3868 ms"},{"Country":"South Africa","IP Address":"102.132.42.66","Port":"8080","Type":"HTTP","Last Checked":"now","Ping":"1230 ms"},{"Country":"Germany","IP Address":"159.69.153.169","Port":"5566","Type":"SOCKS4","Last Checked":"1 second ago","Ping":"3276 ms"},{"Country":"Uzbekistan","IP Address":"185.74.6.249","Port":"8080","Type":"HTTP","Last Checked":"1 second ago","Ping":"2080 ms"},{"Country":"Peru","IP Address":"190.43.232.83","Port":"999","Type":"HTTP","Last Checked":"1 second ago","Ping":"5872 ms"},{"Country":"China","IP Address":"121.37.201.60","Port":"9002","Type":"HTTP","Last Checked":"1 second ago","Ping":"2457 ms"},{"Country":"Mongolia","IP Address":"49.0.246.130","Port":"45554","Type":"HTTP","Last Checked":"1 second ago","Ping":"2449 ms"},{"Country":"United States","IP Address":"192.111.137.35","Port":"4145","Type":"SOCKS5","Last Checked":"1 second ago","Ping":"528 ms"},{"Country":"Egypt","IP Address":"154.236.179.226","Port":"1981","Type":"HTTP","Last Checked":"2 seconds ago","Ping":"2883 ms"},{"Country":"Mongolia","IP Address":"49.0.252.39","Port":"9002","Type":"SOCKS5","Last Checked":"2 seconds ago","Ping":"6405 ms"},{"Country":"Russia","IP Address":"194.186.35.70","Port":"3128","Type":"HTTP","Last Checked":"2 seconds ago","Ping":"3715 ms"},{"Country":"Serbia","IP Address":"91.148.127.56","Port":"8080","Type":"HTTP","Last Checked":"2 seconds ago","Ping":"551 ms"},{"Country":"China","IP Address":"47.92.239.69","Port":"45554","Type":"SOCKS5","Last Checked":"3 seconds ago","Ping":"6444 ms"},{"Country":"Poland","IP Address":"91.150.189.122","Port":"30389","Type":"HTTP","Last Checked":"3 seconds ago","Ping":"6047 ms"},{"Country":"Unknown","IP Address":"103.157.63.54","Port":"8080","Type":"HTTP","Last Checked":"3 seconds ago","Ping":"3945 ms"}]';
    return JSON.parse(jsonProxyList);
  }

  // Test GET request to proxy
  async _checkProxy(options: https.RequestOptions | http.RequestOptions): Promise<TProxy> {
    return new Promise((resolve, reject) => {
      const {host, port} = options;
      options.method = 'GET';
      const req = http.request(options, (res) => {
        if (res.statusCode !== 200) { reject(new Error(`Response code is: ${res.statusCode}`)); }
        resolve({host, port: String(port)});
      });
      req.on('error', (err) => { reject(err); });
      req.end();
    });
  }

  // Check that all keys were found
  _checkProxyKeys(proxyKeys: TProxyKeys) {
    return (Object.values(proxyKeys).some(e => e === undefined)) ? false : true;
  }

  // Find appropriate keys in proxy list
  _getProxyKeys(proxyList: {[key: string]: any}[]): TProxyKeys {
    const proxyKeys: TProxyKeys = {'type': undefined, 'ip': undefined, 'port': undefined};
    const proxyList2 = [...proxyList];
    let isSuccess = false;
    while (isSuccess === false && proxyList2.length) {
      const proxy = proxyList2.pop();
      for (let key in proxy) {
        if (/https?|socks/.test(String(proxy[key]).toLowerCase())) { proxyKeys.type = key; }
        if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(proxy[key])) { proxyKeys.ip = key; }
        if (/^[0-9]{2,4}$/.test(proxy[key]) && /port/.test(key.toLowerCase())) { proxyKeys.port = key; }
        isSuccess = this._checkProxyKeys(proxyKeys);
      }
    }
    console.log('Proxy keys: ', proxyKeys);
    return proxyKeys;
  }

  // Filter not accessible proxies
  async _getAvailableProxyList(proxyList: {[key: string]: any}[]) {
    console.log(`${proxyList.length} x proxy in the list`);
    // Get keys
    const proxyKeys: TProxyKeys = this._getProxyKeys(proxyList);
    // Check what proxy is available
    const availableProxyList: {[key: string]: any}[] = [];
    if (this._checkProxyKeys(proxyKeys)) {
      const promises: Promise<TProxy>[] = [];
      proxyList.forEach((proxy) => {
        const proxyType = proxy[String(proxyKeys.type)];
        const proxyHost = proxy[String(proxyKeys.ip)];
        const proxyPort = proxy[String(proxyKeys.port)];
        if (proxyType.toLowerCase() === 'http') {
          const proxyCheckPromise = this._checkProxy({host: proxyHost, port: proxyPort, timeout: 2000, ...this.reqOptions});
          proxyCheckPromise
            .then((proxy) => availableProxyList.push(proxy))
            .catch((err) => console.error(`Error checking proxy: ${err.name}: ${err.message}`));
          promises.push(proxyCheckPromise);
        }
      });
      console.log(`Checking ${promises.length} x proxies...`);
      // TODO stop if it takes more than X seconds to check all proxies
      // https://stackoverflow.com/a/65123935
      const res = await Promise.allSettled(promises);
    }
    console.log(`Available proxies: ${availableProxyList.length} x`);
    return availableProxyList;
  }

  async _doProxyWebRequest(): Promise<string> {
    let proxyList = await this._fetchProxyList();
    proxyList = await this._getAvailableProxyList(proxyList);
    // Do actual request through one of the available proxy
    let res = '';
    let isSuccess = false;
    while (isSuccess === false && proxyList.length) {
      const proxy = proxyList.pop();
      try {
        this.logger.info('Trying to request resource...');
        const isHttps = Boolean(proxy.port == 443);
        res = await this._doWebRequest({method: 'GET', host: proxy.host, port: proxy.port, timeout: 2000, ...this.reqOptions}, isHttps);
        this.logger.info(`OK: ${res.length}`);
        isSuccess = true;
      } catch(err: unknown) {
        if (typeof err === "string") {
          this.logger.error(`Failed to use available proxy ${proxy.host}:${proxy.port}: ${err}`);
        } else if (err instanceof Error) {
          this.logger.error(`Failed to use available proxy ${proxy.host}:${proxy.port}: ${err.name}: ${err.message}`);
        }
      }
    }
    return res;
  }

  async doSiteRequest(subscription: UserSubscription): Promise<TSiteItem[]> {
    const siteName = Site.getSiteName(subscription.url);
    let newItems: TSiteItem[] = [];
    for (let page = 1; page <= PAGE_COUNT; page++) {
      const url = this._getSiteUrl(siteName, subscription.url, page);
      this.reqOptions.path = url;
      this.reqOptions.headers.host = new URL(url).host;
      try {
        // eslint-disable-next-line no-await-in-loop
        const html = await this._doProxyWebRequest();
        // TODO: if no proxy available?

        console.log('html length: ', html.length);
        console.log(html);

        if (html.length) {
          const items = this._getSiteNewItems(siteName, html, subscription.knownAds);
          newItems = [...newItems, ...items];
        }
      } catch (err) {
        this.logger.error(`Error during query ${siteName}: ${err}`);
      }
    }
    return newItems;
  }

}

export default WebService;
