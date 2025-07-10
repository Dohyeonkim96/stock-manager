const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const parseNumber = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/,/g, ''));
};

exports.handler = async function(event, context) {
  const { yuhanPartNo, category, businessUnit } = event.queryStringParameters;

  try {
    const records = await base('발주현황').select().all();

    // 전체 카테고리와 사업부 목록 추출 (필터용)
    const allCategories = [...new Set(records.map(r => r.fields['카테고리']).filter(Boolean))];
    const allBusinessUnits = [...new Set(records.map(r => r.fields['사업부']).filter(Boolean))];

    // 데이터 집계
    const poByItem = {};
    records.forEach(r => {
      const itemCode = r.fields['유한품번'];
      if (!itemCode) return;

      if (!poByItem[itemCode]) {
        poByItem[itemCode] = {
          itemCode: itemCode,
          gskemPN: r.fields['지에스켐 품번'],
          itemName: r.fields['품명'],
          balance: 0,
          transactions: []
        };
      }
      const qty = parseNumber(r.fields['수량']);
      poByItem[itemCode].balance += qty;
      poByItem[itemCode].transactions.push({
        date: r.fields['발주일'],
        qty: qty
      });
    });

    // 필터링 적용 (아직은 간단한 집계만 구현, 향후 필터 로직 추가 가능)
    let results = Object.values(poByItem);
    if (yuhanPartNo) {
        results = results.filter(item => item.itemCode.includes(yuhanPartNo));
    }
    // businessUnit, category 필터는 향후 추가

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: results,
        categories: allCategories,
        businessUnits: allBusinessUnits
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
