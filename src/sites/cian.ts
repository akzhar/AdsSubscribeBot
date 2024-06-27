import Site from '@models/site';

const cianSite = new Site({
  url: 'https://www.cian.ru',
  cssSelector: {
    elem: 'article[data-name="CardComponent"]',
    link: 'div[class*=--general--] div[data-name="LinkArea"] > a',
    date: 'div[class*=--aside--] div[data-name="TimeLabel"] div[class*=--absolute--] > span',
    price: 'div[class*=--general--] span[data-mark="MainPrice"]'
  },
  dateParam: ''
});

export default cianSite;
