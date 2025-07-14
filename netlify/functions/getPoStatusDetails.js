const Airtable = require('airtable');

// .env 파일이나 Netlify 환경 변수에서 설정값을 가져옵니다.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('발주현황'); // '발주현황'은 테이블 이름입니다.

exports.handler = async (event, context) => {
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
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching from Airtable: ' + error.message }),
        };
    }
};
