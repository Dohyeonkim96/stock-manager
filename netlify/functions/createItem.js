const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    try {
        const table = base('기본정보');
        const fields = JSON.parse(event.body);
        const createdRecord = await table.create([{ fields }]);
        return { statusCode: 200, body: JSON.stringify(createdRecord) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '생성 실패: ' + error.message }) };
    }
};
