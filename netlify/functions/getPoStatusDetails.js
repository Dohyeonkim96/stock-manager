const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event) {
  try {
    const [poRecords, deliveryRecords, itemRecords] = await Promise.all([
      base('발주현황').select().all(),
      base('납품이력').select().all(), // [수정] 통합된 '납품이력' 테이블 사용
      base('기본정보').select().all()
    ]);

    const itemsByCode = {};
    itemRecords.forEach(r => {
      const code = r.fields['유한 품번'];
      if(code) itemsByCode[code] = { gskemPN: r.fields['지에스켐 품번'], itemName: r.fields['품명'], businessUnit: r.fields['사업부'] };
    });

    const poStatus = {};
    poRecords.forEach(r => {
      const code = r.fields['유한품번'];
      if (!code || !itemsByCode[code]) return;
      if (!poStatus[code]) poStatus[code] = { totalOrdered: 0, transactions: [] };
      poStatus[code].totalOrdered += parseNumber(r.fields['수량']);
    });

    const deliveryStatus = {};
    deliveryRecords.forEach(r => {
      const code = r.fields['품목코드'];
      if (!code) return;
      if (!deliveryStatus[code]) deliveryStatus[code] = { cumulativeDelivered: 0 };
      deliveryStatus[code].cumulativeDelivered += parseNumber(r.fields['수량']);
    });

    const results = Object.keys(itemsByCode).map(code => {
      const totalOrdered = poStatus[code]?.totalOrdered || 0;
      const cumulativeDelivered = deliveryStatus[code]?.cumulativeDelivered || 0;
      return {
        itemCode: code,
        gskemPN: itemsByCode[code].gskemPN,
        itemName: itemsByCode[code].itemName,
        totalOrdered, cumulativeDelivered,
        balance: totalOrdered - cumulativeDelivered
      };
    }).filter(item => item.balance > 0); // 잔량이 0보다 큰 것만 표시
    
    return { statusCode: 200, body: JSON.stringify({ results }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: `PO 현황 조회 오류: ${error.message}` }) };
  }
};
