const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const orders = JSON.parse(event.body);
    const recordsToCreate = orders.map(order => ({
      fields: {
        '발주일': order.issueDate,
        '유한품번': order.yuhanPartNo,
        '지에스켐 품번': order.gskemPartNo,
        '품명': order.itemName,
        '수량': Number(order.quantity),
        '납기일': order.deliveryDate,
        '사업부': order.businessUnit,
      }
    }));

    // Airtable '발주현황' 테이블에 데이터를 생성합니다.
    await base('발주현황').create(recordsToCreate);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: `${orders.length}건의 발주가 성공적으로 등록되었습니다.` }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '서버 오류: ' + error.message }),
    };
  }
};
