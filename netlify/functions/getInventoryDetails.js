const Airtable = require('airtable');

// 이 코드는 Netlify에 등록된 '열쇠'들을 사용해 Airtable에 접속합니다.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  try {
    // Airtable의 '재고리스트' 테이블에서 모든 데이터를 가져옵니다.
    const itemRecords = await base('품목정보').select().all();
    const stockRecords = await base('재고리스트').select().all();

    // 데이터를 웹사이트에서 쓰기 편한 형태로 가공합니다.
    const itemsById = {};
    itemRecords.forEach(record => {
      itemsById[record.fields['유한 품번']] = {
        itemName: record.fields['품명'],
        classification: record.fields['분류'],
        remarks: record.fields['비고']
      };
    });

    const inventory = {};
    stockRecords.forEach(record => {
      const itemCode = record.fields['유한 품번'];
      if (!itemCode) return;

      if (!inventory[itemCode]) {
        inventory[itemCode] = {
          itemCode: itemCode,
          itemName: itemsById[itemCode]?.itemName || '품명 정보 없음',
          classification: itemsById[itemCode]?.classification || '미분류',
          remarks: itemsById[itemCode]?.remarks || '',
          totalQuantity: 0,
          lots: []
        };
      }
      
      const quantity = record.fields['수량'] || 0;
      inventory[itemCode].totalQuantity += quantity;
      inventory[itemCode].lots.push({
        airtableRecordId: record.id,
        lot: record.fields['LOT'],
        quantity: quantity,
        mfgDate: record.fields['제조일자'],
        expDate: record.fields['유통기한'],
        palletQty: record.fields['파렛트수량'],
        remarks: record.fields['비고']
      });
    });
    
    // 성공적으로 데이터를 가져왔다고 알리고, 가공된 데이터를 전달합니다.
    return {
      statusCode: 200,
      body: JSON.stringify(Object.values(inventory)),
    };
  } catch (error) {
    // 만약 에러가 발생하면 에러 메시지를 전달합니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};