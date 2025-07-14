exports.handler = async () => {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
    const TABLE_NAME = '발주현황';
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?sort%5B0%5D%5Bfield%5D=발주일자&sort%5B0%5D%5Bdirection%5D=desc`;

    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
        if (!response.ok) throw new Error(`Airtable 응답 실패: ${response.status}`);
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data.records)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};
