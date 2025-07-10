const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async function(event, context) {
  try {
    const itemRecords = await base('기본정보').select().all();
    const stockRecords = await base('재고조회').select().all();

    const itemsByCode = {};
    itemRecords.forEach(r => {
      const code = r.fields['품목코드'];
      if (code) {
        itemsByCode[code] = {
          itemName: r.fields['제품명'],
          classification: r.fields['분류'] || '미분류'
        };
      }
    });

    const inventory = {};
    stockRecords.forEach(r => {
      const code = r.fields['품목코드'];
      if (!code) return;
      if (!inventory[code]) {
        inventory[code] = {
          itemCode: code,
          itemName: itemsByCode[code]?.itemName || r.fields['제품명'],
          classification: itemsByCode[code]?.classification || '미분류',
          totalQuantity: 0,
          lots: []
        };
      }
      const qty = parseNumber(r.fields['수량']);
      inventory[code].totalQuantity += qty;
      inventory[code].lots.push({ airtableRecordId: r.id, lot: r.fields.LOT, quantity: qty });
    });
    
    return { statusCode: 200, body: JSON.stringify(Object.values(inventory)) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
