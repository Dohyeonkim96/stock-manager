const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('생산계획');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const fields = JSON.parse(event.body);

        if (!fields || Object.keys(fields).length === 0) {
            return { statusCode: 400, body: JSON.stringify({ message: '생성할 데이터가 없습니다.' }) };
        }
        
        const createdRecord = await table.create([{ fields }]);

        return {
            statusCode: 200,
            body: JSON.stringify(createdRecord),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Airtable 레코드 생성 실패: ' + error.message }),
        };
    }
};
