const Airtable = require('airtable');

exports.handler = async () => {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    try {
        const records = await base('발주현황').select({
            sort: [{ field: '발주일자', direction: 'desc' }]
        }).all();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ records }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '발주 현황 조회 실패', error: error.message }) };
    }
};
