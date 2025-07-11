const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async (event) => {
  const { yuhanCode } = event.queryStringParameters;
  if (!yuhanCode) {
    return { statusCode: 400, body: JSON.stringify({ error: '유한코드가 필요합니다.' }) };
  }

  try {
    // 1. 품목의 기본 정보 조회
    const itemRecords = await base('기본정보').select({
      filterByFormula: `{유한 품번} = '${yuhanCode}'`,
      maxRecords: 1
    }).firstPage();

    if (!itemRecords || itemRecords.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: '해당 품목코드를 찾을 수 없습니다.' }) };
    }
    const staticInfo = {
        itemName: itemRecords[0].fields['품명'],
        packSize: itemRecords[0].fields['입수량'],
        itemsPerPallet: itemRecords[0].fields['1PLT']
    };

    // 2. 해당 품목의 LOT별 재고 조회
    const stockRecords = await base('재고조회').select({
      filterByFormula: `AND({품목코드} = '${yuhanCode}', {수량} > 0)`
    }).all();

    const lots = stockRecords.map(r => ({
      lotNumber: r.fields.LOT,
      quantity: parseNumber(r.fields['수량']),
      mfgDate: r.fields['제조일자'],
      expDate: r.fields['유통기한'],
    }));

    return { statusCode: 200, body: JSON.stringify({ staticInfo, lots }) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: `재고 조회 오류: ${error.message}` }) };
  }
};
