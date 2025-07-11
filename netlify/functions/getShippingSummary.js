const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
    const { month } = event.queryStringParameters;

    try {
        let filterByFormula = "";
        if (month && month !== 'all') {
            filterByFormula = `MONTH({출하일자}) = ${month}`;
        }

        const records = await base('납품이력').select({ filterByFormula }).all();
        
        const summary = {};
        const DISPLAY_YEARS = ['23', '24', '25']; // 요약할 연도

        records.forEach(r => {
            const type = r.fields['분류'] || '기타';
            const code = r.fields['품목코드'];
            const year = new Date(r.fields['출하일자']).getFullYear().toString().slice(-2);
            
            if (!code || !DISPLAY_YEARS.includes(year)) return;

            if (!summary[type]) {
                summary[type] = { items: {}, subtotals: {} };
                DISPLAY_YEARS.forEach(y => summary[type].subtotals[y] = 0);
            }
            if (!summary[type].items[code]) {
                summary[type].items[code] = { itemName: r.fields['품명'], quantitiesByYear: {} };
                DISPLAY_YEARS.forEach(y => summary[type].items[code].quantitiesByYear[y] = 0);
            }

            const quantity = parseNumber(r.fields['수량']);
            summary[type].items[code].quantitiesByYear[year] += quantity;
            summary[type].subtotals[year] += quantity;
        });

        return { statusCode: 200, body: JSON.stringify(summary) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: '데이터 집계 오류: ' + error.message }) };
    }
};
