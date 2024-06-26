const mysql = require('mysql2/promise')
const uuid = require('uuid')
const twApi = require('@opecgame/twapi')
const assert = require('assert')

module.exports.topUp = async (request, response) => {
    const connection = await mysql.createConnection({
        host        : process.env.DATABASE_HOST,
        user        : process.env.DATABASE_USER,
        password    : process.env.DATABASE_PASSWORD,
        database    : process.env.DATABASE_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
        idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    })
    try{
        const requestEmail = request.body.email
        const requestGiftTrueMoney = request.body.giftTrueMoney
        const tw = await twApi(requestGiftTrueMoney, process.env.PHONENUMBER_RECIVE_MONEY)
        assert(tw.status.code === 'SUCCESS')
        const baht = tw.data.my_ticket.amount_baht
        await connection.query('UPDATE finance SET cash_amount = cash_amount + ?, aysel_amount = aysel_amount + ?, update_at = ? WHERE email = ?',
        [baht, (process.env.AYSEL_CURRENCY/process.env.BAHT_CURRENCY)*baht, new Date(), requestEmail])
        await connection.query('INSERT INTO history_payment (uuid, email, aysel_amount, cash_amount, payment_status, create_at, update_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuid.v4(), requestEmail, (process.env.AYSEL_CURRENCY/process.env.BAHT_CURRENCY)*baht, baht, true, new Date(), new Date()])
        connection.end()
        response.status(200).json({status: true, payload: 'การเติมไอเซลสำเร็จ'})
    }catch(error){
        if(error.code === 'ECONNREFUSED'){
            response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
        }else{
            response.status(200).json({status: false, payload: 'การเติมไอเซลล้มเหลว'})
        }
    }
}