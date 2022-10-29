import Site from '@models/site';

const avitoSite = new Site({
  url: 'https://www.avito.ru',
  cssSelector: {
    elem: '.item',
    link: '.snippet-link',
    date: '.snippet-date-info',
    price: '.snippet-price'
  },
  dateParam: 's=104'
});

export default avitoSite;
