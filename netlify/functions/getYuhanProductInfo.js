const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  const { yuhanPartNo } = event.queryStringParameters;
  if (!yuhanPartNo) {
    return { statusCode: 400, body: JSON.stringify({ error: '유한품번이 필요합니다.' }) };
  }

  try {
    const records = await base('기본정보').select({
      filterByFormula: `{유한 품번} = '${yuhanPartNo}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: '일치하는 품번 정보가 없습니다.' }) };
    }
    
    const productInfo = {
      '지에스켐품번': records[0].fields['지에스켐 품번'],
      '품명': records[0].fields['품명'],
      '사업부': records[0].fields['사업부'],
      '카테고리': records[0].fields['분류'],
    };

    return { statusCode: 200, body: JSON.stringify(productInfo) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
