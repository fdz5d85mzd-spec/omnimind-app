export const GB = 1024 ** 3;

export const PLANS = {
  plus: { name: 'Atlas Plus', price: 690, maxTransfer: 100 * GB, monthlyQuota: 250 * GB },
  pro: { name: 'Atlas Pro', price: 1490, maxTransfer: 250 * GB, monthlyQuota: 1024 * GB },
  studio: { name: 'Atlas Studio', price: 3990, maxTransfer: 500 * GB, monthlyQuota: 5 * 1024 * GB },
  business: { name: 'Atlas Business', price: 7990, maxTransfer: 1024 * GB, monthlyQuota: 15 * 1024 * GB },
};

export const FREE_LIMIT = 50 * GB;
export const oneTimePrice = (gb) => Math.max(149, Math.round(gb * 9));
