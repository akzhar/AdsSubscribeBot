import avitoSite from './avito';
import cianSite from './cian';
import youlaSite from './youla';
import domofondSite from './domofond';
import domclickSite from './domclick';

export const SITES = {
  avito: avitoSite,
  cian: cianSite,
  youla: youlaSite,
  domofond: domofondSite,
  domclick: domclickSite
};

export const AVAILABLE_SITES = Object.keys(SITES);

export type TAvailableSites = keyof typeof SITES | string;
