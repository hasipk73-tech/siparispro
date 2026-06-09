export const VARSAYILAN_OZELLIKLER = {
  trendyol:     false,
  getir:        false,
  yemeksepeti:  false,
  ivr:          false,
  odeme:        true,
  stokTakibi:   true,
  stokAlim:     true,
  satisAnalizi: true,
};

export function ozellikAcik(tenant, key) {
  if (!tenant) return false;
  const oz = tenant.ozellikler ?? {};
  return key in oz ? oz[key] === true : (VARSAYILAN_OZELLIKLER[key] ?? false);
}
