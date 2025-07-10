const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
  const { year, month } = event.queryStringParameters;

  try {
    const records = await base('생산계획').select({
      filterByFormula: `AND(YEAR({생산일}) = ${year}, MONTH({생산일}) = ${month})`
    }).all();

    const plans = records.map(r => ({
      originalSheetRowIndex: r.id, // 레코드 ID를 사용
      date: r.fields['생산일'],
      gskemPartNo: r.fields['지에스켐 품번'],
      yuhanPartNo: r.fields['유한품번'],
      itemName: r.fields['품명'],
      quantity: parseNumber(r.fields['수량'])
    }));

    return { statusCode: 200, body: JSON.stringify(plans) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
