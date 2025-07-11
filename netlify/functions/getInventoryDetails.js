const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const parseNumber = (str) => Number(String(str || '0').replace(/,/g, ''));

exports.handler = async (event) => {
  try {
    // [수정] 기본정보와 재고조회 테이블 데이터를 모두 가져옵니다.
    const [itemRecords, stockRecords] = await Promise.all([
      base('기본정보').select().all(),
      base('재고조회').select().all()
    ]);

    // [수정] 품목코드를 기준으로 기본정보(품명, 분류)를 맵으로 만듭니다.
    const itemsByCode = {};
    itemRecords.forEach(r => {
      const code = r.fields['유한 품번']; // '기본정보' 테이블의 키는 '유한 품번'
      if(code) {
        itemsByCode[code] = { 
          itemName: r.fields['품명'], 
          classification: r.fields['분류'] || '미분류' 
        };
      }
    });

    // [수정] 재고 데이터를 순회하며 기본정보 맵을 이용해 데이터를 조합합니다.
    const inventory = {};
    stockRecords.forEach(r => {
      const code = r.fields['품목코드']; // '재고조회' 테이블의 키는 '품목코드'
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
      inventory[code].lots.push({ 
        originalSheetRowIndex: r.id, // 수정/삭제를 위해 Airtable 레코드 ID 저장
        lot: r.fields.LOT, 
        quantity: qty, 
        mfgDate: r.fields['제조일자'], 
        expDate: r.fields['유통기한'],
        palletQty: r.fields['파레트수량'],
        remarks: r.fields['비고']
      });
    });
    
    return { statusCode: 200, body: JSON.stringify(Object.values(inventory)) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: `재고 조회 오류: ${error.message}` }) };
  }
};
