import Site from '@models/site';

const youlaSite = new Site({
  url: 'https://youla.ru',
  cssSelector: {
    elem: '.product_item > a',
    link: '.product_item > a',
    date: '.product_item__date > span',
    price: '.product_item__description > div'
  },
  dateParam: 'attributes[sort_field]=date_published'
});

youlaSite.getUrl = function ({ url, page }) {
  const urlComponents = this.getUrlComponents({ url, page });
  return `${urlComponents.url}&page=${urlComponents.page}`;
}

export default youlaSite;
