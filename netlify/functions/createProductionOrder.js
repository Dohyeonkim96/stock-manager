exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
    const TABLE_NAME = '생산계획';
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

    try {
        const fields = JSON.parse(event.body);
        const airtableRequest = { records: [{ fields }] };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(airtableRequest)
        });

        const responseText = await response.text();
        if (!response.ok) throw new Error(`Airtable 응답 실패: ${response.status} ${responseText}`);

        const data = JSON.parse(responseText);
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};
