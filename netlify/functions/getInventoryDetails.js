const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  // 1. 함수가 시작되었음을 로그에 기록
  console.log("Function 'getInventoryDetails' has started.");

  try {
    // 2. '품목정보' 테이블에서 데이터 조회를 시도함을 로그에 기록
    console.log("Attempting to fetch from '품목정보' table...");
    const itemRecords = await base('품목정보').select().all();
    // 3. '품목정보' 테이블에서 가져온 데이터 개수를 로그에 기록
    console.log(`Successfully fetched ${itemRecords.length} records from '품목정보'.`);

    // 4. '재고리스트' 테이블에서 데이터 조회를 시도함을 로그에 기록
    console.log("Attempting to fetch from '재고리스트' table...");
    const stockRecords = await base('재고리스트').select().all();
    // 5. '재고리스트' 테이블에서 가져온 데이터 개수를 로그에 기록
    console.log(`Successfully fetched ${stockRecords.length} records from '재고리스트'.`);

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

    // 6. 모든 처리가 끝나고 정상적으로 데이터를 반환함을 로그에 기록
    console.log("Processing complete. Sending success response.");
    return {
      statusCode: 200,
      body: JSON.stringify(Object.values(inventory)),
    };

  } catch (error) {
    // 7. 만약 위 과정 중 어디선가 오류가 발생하면, 그 오류를 로그에 상세히 기록
    console.error("An error occurred inside the function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
