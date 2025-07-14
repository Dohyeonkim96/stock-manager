exports.handler = async (event) => {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = '발주현황';

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable responded with status: ${response.status}`);
        }

        const airtableData = await response.json();
        const data = airtableData.records.map(record => ({
            id: record.id,
            fields: record.fields
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: '조회 실패: ' + error.message })
        };
    }
};
