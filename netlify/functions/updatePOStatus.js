const Airtable = require('airtable');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { poId } = JSON.parse(event.body);
        if (!poId) {
            return { statusCode: 400, body: 'Bad Request: poId is required' };
        }

        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

        // 1. Get Purchase Order details
        const poRecord = await base('발주현황').find(poId);
        if (!poRecord) {
            return { statusCode: 404, body: 'Purchase Order not found' };
        }
        const productName = poRecord.get('품명');
        const orderQuantity = poRecord.get('발주수량');

        // 2. Update Purchase Order status to '입고완료'
        await base('발주현황').update(poId, {
            '상태': '입고완료',
            '입고일': new Date().toISOString().slice(0, 10) // Set received date to today
        });

        // 3. Find the corresponding stock record
        const stockRecords = await base('재고조회').select({
            filterByFormula: `{제품명} = '${productName}'`,
            maxRecords: 1
        }).firstPage();

        if (stockRecords.length > 0) {
            const stockRecord = stockRecords[0];
            const currentStock = stockRecord.get('현재고') || 0;
            const newStock = currentStock + orderQuantity;

            // 4. Update the stock quantity
            await base('재고조회').update(stockRecord.id, {
                '현재고': newStock
            });
        } else {
           // Optional: Create a new stock item if it doesn't exist
           await base('재고조회').create([
               {
                   "fields": {
                       "제품명": productName,
                       "현재고": orderQuantity,
                       "안전재고": 10 // Default safety stock, adjust as needed
                   }
               }
           ]);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Stock updated successfully' }),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update status' }),
        };
    }
};
