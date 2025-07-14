exports.handler = async (event) => {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
    const TABLE_NAME = '기본정보';
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

    if (event.queryStringParameters && event.queryStringParameters.query) {
        const query = event.queryStringParameters.query;
        // '기본정보' 테이블의 기본 필드인 '품목코드'에서 검색
        const filterFormula = `SEARCH("${query}", {품목코드})`;
        url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
    }

    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
        if (!response.ok) throw new Error(`Airtable 응답 실패: ${response.status}`);
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data.records) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};
