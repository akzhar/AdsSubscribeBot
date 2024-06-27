import https from 'https';
import http from 'http';

// const options = { path: 'http://www.google.com', headers: { Host: 'www.google.com' } };
const options = { path: 'http://www.avito.ru/sankt-peterburg/avtomobili/hyundai/solaris-ASgBAgICAkTgtg2imzHitg3kmzE?cd=1&f=ASgBAgICA0TyCrCKAeC2DaKbMeK2DeSbMQ&radius=0&searchRadius=0', headers: { Host: 'www.avito.ru' } };

// function tableToArray(tableSelector) {
//   const table = document.querySelector(tableSelector);
//   const headers = Array.from(table.querySelectorAll('thead tr th')).map(th => th.textContent.trim());
//   const rows = Array.from(table.querySelectorAll('tbody tr'));

//   const data = rows.map(row => {
//     const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
//     const obj = {};
//     headers.forEach((header, index) => {
//       obj[header] = rowData[index];
//     });
//     return obj;
//   });

//   return data;
// }

// const tableData = tableToArray('#proxy_list');
// console.log(tableData);


process.on('uncaughtException', (err) => {
  console.error(`uncaughtException: ${err}`);
});
