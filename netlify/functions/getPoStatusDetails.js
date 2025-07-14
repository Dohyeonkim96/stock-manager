const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const table = base('발주현황'); // 1. 테이블 먼저 선택
        const records = await table.select({ // 2. 선택된 테이블에서 데이터 요청
            sort: [{ field: '발주일자', direction: 'desc' }]
        }).firstPage();

        const data = records.map(record => ({
            id: record.id,
            fields: record.fields
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Airtable 데이터 조회 실패: ' + error.message }),
        };
    }
};
