import Site from '@models/site';

const domofondSite = new Site({
  url: 'https://www.domofond.ru',
  cssSelector: {
    elem: 'a[class^=long-item-card__item]',
    link: 'a[class^=long-item-card__item]',
    date: 'span[class^=long-item-card__listDate]',
    price: 'span[class^=long-item-card__price]'
  },
  dateParam: 'SortOrder=Newest'
});

domofondSite.getUrl = function ({ url, page }) {
  const urlComponents = this.getUrlComponents({ url, page });
  return `${urlComponents.url}&Page=${urlComponents.page}`;
}

domofondSite.getItemDate = function (item) {
  const date = this.getItemDateContent(item);
  return date?.replace('<!-- -->', '')
}

export default domofondSite;
