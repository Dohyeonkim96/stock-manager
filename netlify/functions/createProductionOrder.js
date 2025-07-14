const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('생산계획'); // 실제 Airtable 테이블 이름

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const fields = JSON.parse(event.body);
        
        const createdRecord = await table.create([{ fields }]);

        return {
            statusCode: 200,
            body: JSON.stringify(createdRecord),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating record in Airtable' }),
        };
    }
};
