const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
  try {
    const poRecords = await base('발주현황').select().all();
    const deliveryRecords = await base('납품이력(25년)').select().all();
    const itemRecords = await base('기본정보').select().all();

    const itemsByCode = {};
    itemRecords.forEach(r => {
      const code = r.fields['유한 품번'];
      if(code) {
        itemsByCode[code] = {
          gskemPN: r.fields['지에스켐 품번'],
          itemName: r.fields['품명'],
          category: r.fields['카테고리'],
          businessUnit: r.fields['사업부']
        };
      }
    });

    const poStatus = {};
    poRecords.forEach(r => {
      const code = r.fields['유한품번'];
      if (!code) return;
      if (!poStatus[code]) poStatus[code] = { totalOrdered: 0, transactions: [] };
      const qty = parseNumber(r.fields['수량']);
      poStatus[code].totalOrdered += qty;
      poStatus[code].transactions.push({ date: r.fields['발주일'], qty: qty });
    });

    const deliveryStatus = {};
    deliveryRecords.forEach(r => {
      const code = r.fields['품목코드'];
      if (!code) return;
      if (!deliveryStatus[code]) deliveryStatus[code] = { cumulativeDelivered: 0 };
      deliveryStatus[code].cumulativeDelivered += parseNumber(r.fields['수량']);
    });

    let results = Object.keys(itemsByCode).map(code => {
      const totalOrdered = poStatus[code]?.totalOrdered || 0;
      const cumulativeDelivered = deliveryStatus[code]?.cumulativeDelivered || 0;
      return {
        itemCode: code,
        gskemPN: itemsByCode[code].gskemPN,
        itemName: itemsByCode[code].itemName,
        totalOrdered,
        cumulativeDelivered,
        balance: totalOrdered - cumulativeDelivered,
        transactions: poStatus[code]?.transactions || []
      };
    }).filter(item => item.totalOrdered > 0 || item.cumulativeDelivered > 0);
    
    const allCategories = [...new Set(Object.values(itemsByCode).map(i => i.category).filter(Boolean))];
    const allBusinessUnits = [...new Set(Object.values(itemsByCode).map(i => i.businessUnit).filter(Boolean))];

    return {
      statusCode: 200,
      body: JSON.stringify({ results, categories: allCategories, businessUnits: allBusinessUnits }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
