const Airtable = require('airtable');

exports.handler = async function (event, context) {
    try {
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

        const records = await base('발주현황').select({
            sort: [{field: "발주일자", direction: "desc"}]
        }).all();

        const purchaseOrders = records.map(record => ({
            id: record.id,
            ...record.fields
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(purchaseOrders),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch purchase orders' }),
        };
    }
};
