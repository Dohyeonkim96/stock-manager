const Airtable = require('airtable');

const
    apiKey = 'patE1jSQ92OShRZ6y.610d9d1d8653f6e3671710eba078e7c1063d2e2ddd4f2cbd18a9311c2a49aa4f';
const baseId = 'appq4lQ9vpBiBdn93';

const base = new Airtable({ apiKey }).base(baseId);

exports.handler = async function(event, context) {
    const { httpMethod, queryStringParameters, body } = event;
    const { tableName, id, view } = queryStringParameters;

    if (!tableName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'tableName is required' }),
        };
    }

    const table = base(tableName);

    try {
        if (httpMethod === 'GET') {
            if (id) {
                const record = await table.find(id);
                return { statusCode: 200, body: JSON.stringify(record) };
            } else {
                const records = await table.select({ view: view || 'Grid view' }).all();
                return { statusCode: 200, body: JSON.stringify(records) };
            }
        } else if (httpMethod === 'POST') {
            const newRecord = await table.create(JSON.parse(body).fields);
            return { statusCode: 201, body: JSON.stringify(newRecord) };
        } else if (httpMethod === 'PATCH') {
            if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Record ID is required for PATCH' }) };
            const updatedRecord = await table.update(id, JSON.parse(body).fields);
            return { statusCode: 200, body: JSON.stringify(updatedRecord) };
        } else if (httpMethod === 'DELETE') {
            if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Record ID is required for DELETE' }) };
            const deletedRecord = await table.destroy(id);
            return { statusCode: 200, body: JSON.stringify(deletedRecord) };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    } catch (error) {
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
