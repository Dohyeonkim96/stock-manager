const Airtable = require('airtable');

exports.handler = async function (event, context) {
    try {
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

        // Helper function to get records from a table with a formula
        const getRecords = (tableName, options = {}) => {
            return new Promise((resolve, reject) => {
                const records = [];
                base(tableName).select(options).eachPage(
                    (pageRecords, fetchNextPage) => {
                        records.push(...pageRecords);
                        fetchNextPage();
                    },
                    (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(records);
                        }
                    }
                );
            });
        };

        // 1. 금일 출고 현황
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const allShippingRequests = await getRecords('출고요청', {
             filterByFormula: `IS_SAME({출고 요청일}, '${todayStr}', 'day')`,
        });

        const shippedToday = allShippingRequests.filter(rec => rec.get('상태') === '출고완료').length;
        const pendingShipment = allShippingRequests.filter(rec => rec.get('상태') === '출고요청').length;

        // 2. 발주 현황
        const allPurchaseOrders = await getRecords('발주현황');
        const receivedPO = allPurchaseOrders.filter(rec => rec.get('상태') === '입고완료').length;
        const pendingPO = allPurchaseOrders.filter(rec => rec.get('상태') === '입고예정').length;

        // 3. 주간 생산 계획
        const weeklyProductionPlans = await getRecords('생산계획', {
            filterByFormula: "AND(IS_AFTER({계획일}, DATEADD(TODAY(), -WEEKDAY(TODAY()), 'days')), IS_BEFORE({계획일}, DATEADD(TODAY(), 7-WEEKDAY(TODAY()), 'days')))",
            fields: ['제품명', '계획수량', '생산수량']
        });
        
        // 4. 주간 출고 계획
        const weeklyShippingPlans = await getRecords('출고요청', {
            filterByFormula: "AND(IS_AFTER({출고 요청일}, DATEADD(TODAY(), -WEEKDAY(TODAY()), 'days')), IS_BEFORE({출고 요청일}, DATEADD(TODAY(), 7-WEEKDAY(TODAY()), 'days')))",
            fields: ['제품명', '요청수량', '출고수량']
        });

        const dashboardData = {
            shippingStatus: {
                shipped: shippedToday,
                pending: pendingShipment,
            },
            poStatus: {
                received: receivedPO,
                pending: pendingPO,
            },
            weeklyProduction: weeklyProductionPlans.map(rec => rec.fields),
            weeklyShipping: weeklyShippingPlans.map(rec => rec.fields),
        };

        return {
            statusCode: 200,
            body: JSON.stringify(dashboardData),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch dashboard data' }),
        };
    }
};
