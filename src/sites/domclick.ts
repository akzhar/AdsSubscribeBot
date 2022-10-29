import Site, { TSiteUrlComponents } from '@models/site';

const domclickSite = new Site({
  url: 'https://www.domclick.ru',
  cssSelector: {
    elem: 'a[class=_1X0Y9]',
    link: 'a[class=_1X0Y9]',
    date: 'div[class^=date-]',
    price: 'p[class^=price-]'
  },
  dateParam: 'sort=published'
});

domclickSite.getUrl = function ({ url, page }: TSiteUrlComponents) {
  const urlComponents = this.getUrlComponents({ url, page });
  return `${urlComponents.url}&offset=${urlComponents.page * 30}&limit=${30}`;
}

export default domclickSite;
