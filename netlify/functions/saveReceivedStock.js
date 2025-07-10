const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const items = JSON.parse(event.body);

    // 1. 입고로그 테이블에 기록
    const logRecords = items.map(item => ({
      fields: {
        '입고일자': new Date().toISOString().slice(0, 10),
        '품목코드': item.itemCode,
        '제품명': item.itemName,
        '수량': item.quantity,
        'LOT': item.lot,
        '제조일자': item.mfgDate,
        '유통기한': item.expDate
      }
    }));
    await base('입고로그').create(logRecords);

    // 2. 재고조회 테이블에 기록
    const stockRecords = items.map(item => ({
      fields: {
        '품목코드': item.itemCode,
        '제품명': item.itemName,
        '수량': item.quantity,
        'LOT': item.lot,
        '제조일자': item.mfgDate,
        '유통기한': item.expDate,
        '파렛트수량': item.palletQty,
        '비고': item.remarks
      }
    }));
    await base('재고조회').create(stockRecords);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: `${items.length}건의 입고가 성공적으로 등록되었습니다.` }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '서버 오류: ' + error.message }),
    };
  }
};
