const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  const { gskemPartNo } = event.queryStringParameters;
  if (!gskemPartNo) {
    return { statusCode: 400, body: JSON.stringify({ error: '지에스켐 품번이 필요합니다.' }) };
  }

  try {
    const records = await base('기본정보').select({
      filterByFormula: `{지에스켐 품번} = '${gskemPartNo}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: '일치하는 품번 정보가 없습니다.' }) };
    }
    
    return { statusCode: 200, body: JSON.stringify(records[0].fields) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
