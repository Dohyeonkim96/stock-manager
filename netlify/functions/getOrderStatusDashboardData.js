const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const parseNumber = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/,/g, ''));
};

exports.handler = async function(event, context) {
  // 'category' 파라미터 수신 부분 제거
  const { yuhanPartNo, businessUnit } = event.queryStringParameters;

  try {
    const filterParts = [];
    if (yuhanPartNo) {
      filterParts.push(`SEARCH('${yuhanPartNo}', {유한품번})`);
    }
    if (businessUnit) {
      filterParts.push(`{사업부} = '${businessUnit}'`);
    }
    // 'category' 필터 생성 로직 제거
    
    const filterByFormula = filterParts.length > 0 ? `AND(${filterParts.join(', ')})` : '';

    const records = await base('발주현황').select({ filterByFormula }).all();
    
    // '카테고리'를 가져오던 로직 제거
    const allRecordsForFilters = await base('발주현황').select({ fields: ['사업부'] }).all();
    const allBusinessUnits = [...new Set(allRecordsForFilters.map(r => r.fields['사업부']).filter(Boolean))];

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: Object.values(poByItem),
        businessUnits: allBusinessUnits // categories 키 제거
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
