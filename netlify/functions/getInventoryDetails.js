const Airtable = require('airtable');

exports.handler = async function(event, context) {
  // --- 디버깅을 위한 코드 블록 ---
  // 함수가 Netlify로부터 어떤 '열쇠' 값을 받았는지 확인합니다.
  const apiKey = process.env.AIRTABLE_API_KEY || "API_KEY_NOT_FOUND"; // API 키가 없으면 "NOT_FOUND"
  const baseId = process.env.AIRTABLE_BASE_ID || "BASE_ID_NOT_FOUND"; // Base ID가 없으면 "NOT_FOUND"

  console.log("--- Verifying Environment Keys ---");
  console.log(`Base ID Received: ${baseId}`);
  // 보안을 위해 API 키는 앞 5자리만 로그에 남깁니다.
  console.log(`API Key Received Starts With: ${apiKey.substring(0, 5)}...`);
  console.log("---------------------------------");
  // --- 디버깅 코드 끝 ---

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

  try {
    console.log("Attempting to fetch from '품목정보' table...");
    const itemRecords = await base('품목정보').select().all();
    console.log(`Successfully fetched ${itemRecords.length} records from '품목정보'.`);

    // (이하 생략) ... 기존 코드와 동일 ...
    const stockRecords = await base('재고리스트').select().all();
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

    console.log("Processing complete. Sending success response.");
    return {
      statusCode: 200,
      body: JSON.stringify(Object.values(inventory)),
    };

  } catch (error) {
    console.error("An error occurred inside the function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
