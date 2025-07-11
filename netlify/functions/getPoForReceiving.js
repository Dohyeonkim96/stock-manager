const Airtable = require('airtable');

exports.handler = async (event) => {
    const { productCode } = event.queryStringParameters;

    if (!productCode) {
        return { statusCode: 400, body: JSON.stringify({ message: '품번을 입력해주세요.' }) };
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    try {
        const records = await base('발주현황').select({
            filterByFormula: `AND({품번} = '${productCode}', NOT({입고여부}))`,
            sort: [{ field: '발주일자', direction: 'desc' }],
            maxRecords: 1
        }).firstPage();

        if (records.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: '입고 대기 중인 발주 내역이 없습니다.' }) };
        }

        return { statusCode: 200, body: JSON.stringify({ record: records[0] }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: '서버 오류', error: error.message }) };
    }
};
