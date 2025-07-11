const Airtable = require('airtable');

exports.handler = async () => {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    try {
        const records = await base('기본정보').select({
            fields: ['사업부', '카테고리']
        }).all();

        const businessUnits = [...new Set(records.map(r => r.get('사업부')).filter(Boolean))];
        const categories = [...new Set(records.map(r => r.get('카테고리')).filter(Boolean))].sort();

        return {
            statusCode: 200,
            body: JSON.stringify({ businessUnits, categories }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '제품 정보 조회 실패', error: error.message }) };
    }
};
