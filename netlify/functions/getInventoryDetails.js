const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async (event) => {
  try {
    const [itemRecords, stockRecords] = await Promise.all([
      base('기본정보').select().all(),
      base('재고조회').select().all()
    ]);

    const itemsByCode = {};
    itemRecords.forEach(r => {
      const code = r.fields['품목코드'];
      if(code) itemsByCode[code] = { itemName: r.fields['제품명'], classification: r.fields['분류'] || '미분류' };
    });

    const inventory = {};
    stockRecords.forEach(r => {
      const code = r.fields['품목코드'];
      if (!code) return;
      if (!inventory[code]) {
        inventory[code] = {
          itemCode: code,
          itemName: itemsByCode[code]?.itemName || r.fields['제품명'] || '품명 없음',
          classification: itemsByCode[code]?.classification || '미분류',
          totalQuantity: 0,
          lots: []
        };
      }
      const qty = parseNumber(r.fields['수량']);
      inventory[code].totalQuantity += qty;
      inventory[code].lots.push({ airtableRecordId: r.id, lot: r.fields.LOT, quantity: qty, mfgDate: r.fields['제조일자'], expDate: r.fields['유통기한'] });
    });
    
    return { statusCode: 200, body: JSON.stringify(Object.values(inventory)) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: `재고 조회 오류: ${error.message}` }) };
  }
};
