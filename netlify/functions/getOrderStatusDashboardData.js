const Airtable = require('airtable');

// Helper to get product codes based on filters
const getFilteredProductCodes = async (base, businessUnit, category) => {
    let formulaParts = [];
    if (businessUnit && businessUnit !== 'all') {
        formulaParts.push(`{사업부} = '${businessUnit}'`);
    }
    if (category && category !== 'all') {
        formulaParts.push(`{카테고리} = '${category}'`);
    }

    if (formulaParts.length === 0) {
        return null; // No filter, no need to pre-fetch
    }

    const formula = `AND(${formulaParts.join(', ')})`;
    const records = await base('기본정보').select({ filterByFormula: formula, fields: ['품번'] }).all();
    return records.map(record => record.get('품번'));
};


exports.handler = async (event) => {
    const { businessUnit, category } = event.queryStringParameters;
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    try {
        const filteredProductCodes = await getFilteredProductCodes(base, businessUnit, category);

        const poPromise = base('발주현황').select({ filterByFormula: 'NOT({입고여부})' }).all();
        const shippingPromise = base('출고요청').select({ filterByFormula: 'NOT({출고여부})' }).all();
        const inventoryPromise = base('재고조회').select({ filterByFormula: '{현재고} < {안전재고}' }).all();

        const [poRecords, shippingRecords, inventoryRecords] = await Promise.all([poPromise, shippingPromise, inventoryPromise]);
        
        let poPendingCount = poRecords.length;
        let shippingPendingCount = shippingRecords.length;
        let lowStockCount = inventoryRecords.length;

        // If filters are active, count only filtered items
        if (filteredProductCodes) {
            poPendingCount = poRecords.filter(r => filteredProductCodes.includes(r.get('품번'))).length;
            shippingPendingCount = shippingRecords.filter(r => filteredProductCodes.includes(r.get('품번'))).length;
            lowStockCount = inventoryRecords.filter(r => filteredProductCodes.includes(r.get('품번'))).length;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ poPendingCount, shippingPendingCount, lowStockCount }),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '대시보드 데이터 조회 실패', error: error.message }) };
    }
};
