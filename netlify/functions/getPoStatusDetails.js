const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async (event) => {
    try {
        const table = base('발주현황');
        const records = await table.select({ sort: [{ field: '발주일자', direction: 'desc' }] }).firstPage();
        const data = records.map(record => ({ id: record.id, fields: record.fields }));
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '조회 실패: ' + error.message }) };
    }
};
