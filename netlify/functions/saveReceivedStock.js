const Airtable = require('airtable');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { poId, productCode, quantity } = JSON.parse(event.body);
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    try {
        // 1. 발주현황 업데이트
        await base('발주현황').update(poId, { '입고여부': true });

        // 2. 재고조회 업데이트
        const inventoryRecords = await base('재고조회').select({
            filterByFormula: `{품번} = '${productCode}'`
        }).firstPage();

        if (inventoryRecords.length > 0) {
            const inventory = inventoryRecords[0];
            const newStock = (inventory.fields['현재고'] || 0) + quantity;
            await base('재고조회').update(inventory.id, {
                '현재고': newStock,
                '최근 입고일': new Date().toISOString().slice(0, 10)
            });
        } else {
            // 필요시 새 재고 레코드 생성 로직
        }

        return { statusCode: 200, body: JSON.stringify({ message: '입고 처리가 완료되었습니다.' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '서버 오류', error: error.message }) };
    }
};
