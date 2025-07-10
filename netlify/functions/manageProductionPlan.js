const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'POST') { // 생성
      const items = JSON.parse(event.body);
      const recordsToCreate = items.map(item => ({
        fields: {
          '생산일': item.productionDate,
          '지에스켐 품번': item.gskemPartNo,
          '유한품번': item.yuhanPartNo,
          '품명': item.itemName,
          '수량': Number(item.quantity)
        }
      }));
      await base('생산계획').create(recordsToCreate);
      return { statusCode: 200, body: JSON.stringify({ success: true, message: '계획이 등록되었습니다.' }) };
    }
    
    if (event.httpMethod === 'PUT') { // 수정
        const { rowIndex, newData } = JSON.parse(event.body);
        await base('생산계획').update(rowIndex, {
            '생산일': newData.productionDate,
            '지에스켐 품번': newData.gskemPartNo,
            '유한품번': newData.yuhanPartNo,
            '품명': newData.itemName,
            '수량': Number(newData.quantity)
        });
        return { statusCode: 200, body: JSON.stringify({ success: true, message: '계획이 수정되었습니다.' }) };
    }

    if (event.httpMethod === 'DELETE') { // 삭제
        const { rowIndex } = JSON.parse(event.body);
        await base('생산계획').destroy(rowIndex);
        return { statusCode: 200, body: JSON.stringify({ success: true, message: '계획이 삭제되었습니다.' }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '서버 오류: ' + error.message }) };
  }
};
