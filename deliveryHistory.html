const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
  const { year, month, itemCode } = event.queryStringParameters;

  // 필터 공식 생성
  let filterParts = [];
  if (year) filterParts.push(`YEAR({납품일자}) = ${year}`);
  if (month) filterParts.push(`MONTH({납품일자}) = ${month}`);
  if (itemCode) filterParts.push(`SEARCH('${itemCode}', {품목코드})`);
  const filterByFormula = filterParts.length > 0 ? `AND(${filterParts.join(', ')})` : '';

  try {
    const records = await base('납품이력(25년)').select({ filterByFormula }).all();
    
    const history = {};
    records.forEach(r => {
      const code = r.fields['품목코드'];
      if (!code) return;

      if (!history[code]) {
        history[code] = {
          itemCode: code,
          itemName: r.fields['제품명'],
          grandTotalQuantity: 0,
          transactions: []
        };
      }
      const qty = parseNumber(r.fields['수량']);
      history[code].grandTotalQuantity += qty;
      history[code].transactions.push({
        date: r.fields['납품일자'],
        lot: r.fields.LOT,
        quantity: qty,
        mfgDate: r.fields['제조일자'],
        expDate: r.fields['유효일자']
      });
    });

    return { statusCode: 200, body: JSON.stringify(Object.values(history)) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
