const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const requests = JSON.parse(event.body);
    const recordsToCreate = requests.map(req => ({
      fields: {
        '요청일': req.shippingDate,
        '품목코드': req.itemCode,
        '품명': req.itemName,
        'LOT': req.lotNumber,
        '수량': req.quantity,
        'BOX수량': req.boxQty,
        '파렛트수량': req.palletQty,
        '입수': req.packSize,
        '제조일자': req.mfgDate,
        '유통기한': req.expDate,
        '상태': '요청' // 초기 상태
      }
    }));
    await base('출고요청').create(recordsToCreate);
    return { statusCode: 200, body: JSON.stringify({ success: true, message: '출고 요청이 등록되었습니다.' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '서버 오류: ' + error.message }) };
  }
};
