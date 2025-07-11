const Airtable = require('airtable');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { requestId, productCode, productName, requestNumber, quantity } = JSON.parse(event.body);
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    try {
        // 재고 확인
        const inventoryRecords = await base('재고조회').select({
            filterByFormula: `{품번} = '${productCode}'`
        }).firstPage();
        
        const currentStock = inventoryRecords[0]?.fields['현재고'] || 0;
        if (inventoryRecords.length === 0 || currentStock < quantity) {
            return { statusCode: 400, body: JSON.stringify({ message: '재고가 부족하여 출고할 수 없습니다.' }) };
        }

        // 1. 출고요청 업데이트
        await base('출고요청').update(requestId, { '출고여부': true });

        // 2. 재고조회 업데이트
        await base('재고조회').update(inventoryRecords[0].id, { '현재고': currentStock - quantity });

        // 3. 납품이력 생성
        await base('납품이력').create([{
            fields: {
                '납품일자': new Date().toISOString().slice(0, 10),
                '출하요청번호': requestNumber,
                '품번': productCode,
                '품명': productName,
                '납품수량': quantity
            }
        }]);

        return { statusCode: 200, body: JSON.stringify({ message: '출고 확정이 완료되었습니다.' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '서버 오류', error: error.message }) };
    }
};
