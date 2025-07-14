const Airtable = require('airtable');

// .env 파일이나 Netlify 환경 변수에서 설정값을 가져옵니다.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('발주현황'); // 실제 Airtable 테이블 이름

exports.handler = async (event, context) => {
    try {
        const records = await table.select({
            // 필요하다면 정렬 순서나 필터 추가
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
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching data from Airtable' }),
        };
    }
};
