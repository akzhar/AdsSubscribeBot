import Site, { TSiteUrlComponents } from '@models/site';

const youlaSite = new Site({
  url: 'https://youla.ru',
  cssSelector: {
    elem: 'div[data-test-component="ProductOrAdCard"] a',
    link: 'div[data-test-component="ProductOrAdCard"] a',
    date: '',
    price: 'div[data-test-component="ProductOrAdCard"] span[data-test-component="Price"] span:first-child'
  },
  dateParam: 'attributes[sort_field]=date_published'
});

youlaSite.getUrl = function ({ url, page }: TSiteUrlComponents) {
  const urlComponents = this.getUrlComponents({ url, page });
  return `${urlComponents.url}&page=${urlComponents.page}`;
}

export default youlaSite;
