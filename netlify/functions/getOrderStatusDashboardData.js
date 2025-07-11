const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const parseNumber = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/,/g, ''));
};

exports.handler = async function(event, context) {
  const { yuhanPartNo, category, businessUnit } = event.queryStringParameters;

  try {
    // --- START: 수정된 부분 ---
    // 필터 조건을 담을 배열
    const filterParts = [];
    if (yuhanPartNo) {
      // 품번은 부분 검색이 가능하도록 SEARCH 사용
      filterParts.push(`SEARCH('${yuhanPartNo}', {유한품번})`);
    }
    if (category) {
      filterParts.push(`{카테고리} = '${category}'`);
    }
    if (businessUnit) {
      filterParts.push(`{사업부} = '${businessUnit}'`);
    }

    // 필터 조건이 하나 이상 있을 경우 Airtable 공식(formula)으로 조합
    const filterByFormula = filterParts.length > 0 ? `AND(${filterParts.join(', ')})` : '';

    // Airtable 조회 시 생성된 필터 공식 적용
    const records = await base('발주현황').select({ filterByFormula }).all();
    // --- END: 수정된 부분 ---
    
    // 전체 카테고리와 사업부 목록 추출 (필터 채우기용 - 이 로직은 별도 함수로 분리하는 것이 더 효율적일 수 있습니다)
    const allRecordsForFilters = await base('발주현황').select({ fields: ['카테고리', '사업부'] }).all();
    const allCategories = [...new Set(allRecordsForFilters.map(r => r.fields['카테고리']).filter(Boolean))];
    const allBusinessUnits = [...new Set(allRecordsForFilters.map(r => r.fields['사업부']).filter(Boolean))];

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: Object.values(poByItem),
        categories: allCategories,
        businessUnits: allBusinessUnits
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
