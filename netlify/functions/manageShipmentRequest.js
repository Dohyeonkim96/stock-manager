const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      const records = await base('출고요청').select({ filterByFormula: "{상태} = '요청'" }).all();
      const results = records.map(r => ({ ...r.fields, rowId: r.id }));
      return { statusCode: 200, body: JSON.stringify(results) };
    }

    if (event.httpMethod === 'POST') {
      const { rowId } = JSON.parse(event.body);
      const req = await base('출고요청').find(rowId);
      // --- START: 수정된 부분 ---
      const { 품목코드, LOT, 수량, 품명, 제조일자, 유통기한 } = req.fields; // '제품명'을 '품명'으로 수정
      // --- END: 수정된 부분 ---

      const stocks = await base('재고조회').select({ filterByFormula: `AND({품목코드} = '${품목코드}', {LOT} = '${LOT}')` }).firstPage();
      if (!stocks || stocks.length === 0) throw new Error('차감할 재고 LOT를 찾을 수 없습니다.');
      
      const stock = stocks[0];
      const currentStock = parseNumber(stock.fields['수량']);
      const requestQty = parseNumber(수량);
      if (currentStock < requestQty) throw new Error(`재고 부족: 현재고(${currentStock}) < 요청수량(${requestQty})`);
      
      await Promise.all([
        base('재고조회').update(stock.id, { '수량': currentStock - requestQty }),
        // --- START: 수정된 부분 ---
        base('납품이력').create([{'fields': { '출하일자': new Date().toISOString().slice(0, 10), '품목코드': 품목코드, '품명': 품명, 'LOT': LOT, '수량': requestQty, '제조일자': 제조일자, '유효일자': 유통기한 }}]),
        // --- END: 수정된 부분 ---
        base('출고요청').update(rowId, { '상태': '완료' })
      ]);
      return { statusCode: 200, body: JSON.stringify({ success: true, message: '출고 처리가 완료되었습니다.' }) };
    }
    
    if (event.httpMethod === 'PUT') {
        const { rowId, newDate, newQuantity } = JSON.parse(event.body);
        await base('출고요청').update(rowId, { '요청일': newDate, '수량': newQuantity });
        return { statusCode: 200, body: JSON.stringify({ success: true, message: '요청이 수정되었습니다.'}) };
    }

    if (event.httpMethod === 'DELETE') {
        const { rowId } = JSON.parse(event.body);
        await base('출고요청').destroy(rowId);
        return { statusCode: 200, body: JSON.stringify({ success: true, message: '요청이 삭제되었습니다.'}) };
    }
    
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: error.message }) };
  }
};
