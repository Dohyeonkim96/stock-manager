const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('기본정보'); // '기본정보' 테이블 사용

exports.handler = async (event, context) => {
    try {
        const { query } = event.queryStringParameters;
        let options = {
            sort: [{ field: '품목코드', direction: 'asc' }]
        };

        // 검색 쿼리가 있는 경우 필터 추가
        if (query) {
            options.filterByFormula = `OR(
                SEARCH("${query}", {품목코드}),
                SEARCH("${query}", {품명})
            )`;
        }

        const records = await table.select(options).firstPage();

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
