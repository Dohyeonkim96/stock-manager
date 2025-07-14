const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('발주현황');

exports.handler = async (event, context) => {
    // GET 요청만 처리하도록 명시
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const records = await table.select({
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
