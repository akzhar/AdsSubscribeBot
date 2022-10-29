import Site from '@models/site';

const cianSite = new Site({
  url: 'https://www.cian.ru',
  cssSelector: {
    elem: 'div[class*=--main--]',
    link: 'a[class*=--header--]',
    date: 'div[class*=--relative--]',
    price: 'div[class*=--header--]'
  },
  dateParam: ''
});

export default cianSite;
