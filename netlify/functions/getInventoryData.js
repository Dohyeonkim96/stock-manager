const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { query } = event.queryStringParameters;
        const table = base('기본정보'); // 1. 테이블 먼저 선택
        
        let options = {
            sort: [{ field: '품목코드', direction: 'asc' }]
        };

        if (query) {
            options.filterByFormula = `OR(
                SEARCH("${query}", {품목코드}),
                SEARCH("${query}", {품명})
            )`;
        }

        const records = await table.select(options).firstPage(); // 2. 선택된 테이블에서 데이터 요청

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
