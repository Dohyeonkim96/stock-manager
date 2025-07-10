const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
  try {
    // GET 요청: '요청' 상태인 출고 목록 조회
    if (event.httpMethod === 'GET') {
      const records = await base('출고요청').select({
        filterByFormula: "{상태} = '요청'"
      }).all();
      const requests = records.map(r => ({ ...r.fields, rowId: r.id }));
      return { statusCode: 200, body: JSON.stringify(requests) };
    }

    // POST 요청: 출고 '확인' 처리
    if (event.httpMethod === 'POST') {
      const { rowId } = JSON.parse(event.body);
      const requestRecord = await base('출고요청').find(rowId);
      
      const { 품목코드, LOT, 수량, 제품명, 제조일자, 유통기한 } = requestRecord.fields;
      
      // 1. 재고조회 테이블에서 해당 LOT 재고 찾기
      const stockRecords = await base('재고조회').select({
        filterByFormula: `AND({품목코드} = '${품목코드}', {LOT} = '${LOT}')`
      }).firstPage();

      if (!stockRecords || stockRecords.length === 0) {
        throw new Error('차감할 재고 정보를 찾을 수 없습니다.');
      }
      
      const stockRecord = stockRecords[0];
      const currentStock = parseNumber(stockRecord.fields['수량']);
      const requestQty = parseNumber(수량);

      if (currentStock < requestQty) {
        throw new Error(`재고 부족: 현재고(${currentStock})가 요청수량(${requestQty})보다 적습니다.`);
      }

      // 2. 재고 차감 후 업데이트
      await base('재고조회').update(stockRecord.id, {
        '수량': currentStock - requestQty
      });
      
      // 3. 납품이력 테이블에 기록
      await base('납품이력(25년)').create([{
        fields: {
          '납품일자': new Date().toISOString().slice(0, 10),
          '품목코드': 품목코드,
          '제품명': 제품명,
          'LOT': LOT,
          '수량': requestQty,
          '제조일자': 제조일자,
          '유효일자': 유통기한, // 필드 이름 확인 필요
        }
      }]);

      // 4. 출고요청 상태를 '완료'로 변경
      await base('출고요청').update(rowId, { '상태': '완료' });

      return { statusCode: 200, body: JSON.stringify({ success: true, message: '출고 처리가 완료되었습니다.' }) };
    }
    
    // DELETE 요청: 출고 요청 삭제
    if (event.httpMethod === 'DELETE') {
        const { rowId } = JSON.parse(event.body);
        await base('출고요청').destroy(rowId);
        return { statusCode: 200, body: JSON.stringify({ success: true, message: '요청이 삭제되었습니다.' }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '서버 오류: ' + error.message }) };
  }
};
