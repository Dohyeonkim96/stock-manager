const AIRTABLE_BASE_ID = 'appq4lQ9vpBiBdn93';
const AIRTABLE_PERSONAL_ACCESS_TOKEN = 'patE1jSQ92OShRZ6y.610d9d1d8653f6e3671710eba078e7c1063d2e2ddd4f2cbd18a9311c2a49aa4f';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Airtable API 호출을 위한 헬퍼 함수
async function fetchAirtableData(tableName, options = {}) {
    const url = new URL(`${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}`);

    // 옵션으로 전달된 쿼리 파라미터를 URL에 추가
    Object.entries(options).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(item => url.searchParams.append(`${key}[]`, item));
        } else {
            url.searchParams.set(key, value);
        }
    });

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Airtable API Error:', errorData);
            throw new Error(`Airtable API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.records.map(record => ({
            id: record.id,
            ...record.fields,
        }));
    } catch (error) {
        console.error('Fetch Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}

// Netlify 함수 핸들러
exports.handler = async (event, context) => {
    const { table, ...options } = event.queryStringParameters;

    if (!table) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Table name is required.' }),
        };
    }

    try {
        const data = await fetchAirtableData(table, options);
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
