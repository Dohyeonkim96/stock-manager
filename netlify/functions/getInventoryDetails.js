const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async (event) => {
  try {
    // Airtable의 Linked/Lookup 필드 덕분에 '재고조회' 테이블 하나만 조회하면 됩니다.
    const stockRecords = await base('재고조회').select().all();

    const inventory = {};
    stockRecords.forEach(r => {
      // 연결된 레코드의 품목코드 (조회(Lookup) 필드를 사용)
      const itemCode = r.fields['품목코드_Lookup'] ? r.fields['품목코드_Lookup'][0] : null; 
      if (!itemCode) return;

      if (!inventory[itemCode]) {
        inventory[itemCode] = {
          itemCode: itemCode,
          itemName: r.fields['제품명_Lookup'] ? r.fields['제품명_Lookup'][0] : '품명 없음',
          classification: r.fields['분류_Lookup'] ? r.fields['분류_Lookup'][0] : '미분류',
          totalQuantity: 0,
          lots: []
        };
      }
      const qty = parseNumber(r.fields['수량']);
      inventory[itemCode].totalQuantity += qty;
      inventory[itemCode].lots.push({ 
          airtableRecordId: r.id, 
          lot: r.fields.LOT, 
          quantity: qty, 
          mfgDate: r.fields['제조일자'], 
          expDate: r.fields['유통기한'] 
      });
    });
    
    return { statusCode: 200, body: JSON.stringify(Object.values(inventory)) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: `재고 조회 오류: ${error.message}` }) };
  }
};
