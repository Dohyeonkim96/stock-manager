const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('생산계획'); // 실제 Airtable 테이블 이름

exports.handler = async (event, context) => {
    try {
        const records = await table.select({
            sort: [{ field: '생산예정일', direction: 'desc' }]
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
