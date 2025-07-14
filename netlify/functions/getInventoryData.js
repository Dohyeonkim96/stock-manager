exports.handler = async (event) => {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = '기본정보';
    
    // URL에 정렬 옵션 추가 (Airtable API 형식)
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?sort%5B0%5D%5Bfield%5D=품목코드&sort%5B0%5D%5Bdirection%5D=asc`;

    // 검색 쿼리가 있는 경우 필터 추가
    if (event.queryStringParameters.query) {
        const query = event.queryStringParameters.query;
        const filterFormula = `OR(SEARCH("${query}", {품목코드}), SEARCH("${query}", {품명}))`;
        url += `&filterByFormula=${encodeURIComponent(filterFormula)}`;
    }

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
