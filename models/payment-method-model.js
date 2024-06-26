const mysql = require('mysql2/promise')
const assert = require('assert')
const multer = require('multer')
const uuid = require('uuid')
const path = require('path')
const fs = require('fs')

const storagePaymentMethod = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, './public/images/payment-method')
    },
    filename: (request, file, callback) => {
        const fileExtension = file.originalname.split('.')[1]
        const fileName = `${uuid.v4()}${Date.now()}${Math.round(Math.random() * 1E9)}.${fileExtension}`
        callback(null, fileName)
        request.on('aborted', () => {
            const fullPath = path.join('./public/images/payment-method', fileName)
            fs.unlinkSync(fullPath)
        })
    }
})

const upload = multer({
    storage: storagePaymentMethod,
    fileFilter: (request, file, callback) => {
        if (file.mimetype === 'image/png') {
            callback(null, true)
        } else {
            callback(new Error('ใช้ได้แค่ไฟล์ .png เท่านั้น'), false)
        }
    }
})

module.exports.paymentMethodSelect = async (request, response) => {
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
        const [results] = await connection.query('SELECT uuid, method, information, create_at, update_at FROM payment_method')
        connection.end()
        response.status(200).json({status: true, payload: results})
    }catch(error){
        if(error.code === 'ECONNREFUSED'){
            response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
        }else{
            response.status(200).json({status: false, payload: 'การแสดงข้อมูลล้มเหลว'})
        }
    }
}

module.exports.paymentMethodUpdateImage = async (request, response) => {
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
        upload.single('file')(request, response, async (error) => {
            if(error){
                response.status(200).json({status: false, payload: error.message})
            }else{
                try{
                    const requestUUID = request.body.uuid
                    const requestInformation = request.file.filename
                    const [results] = await connection.query('SELECT information FROM payment_method WHERE uuid = ?', [requestUUID])
                    assert(results.length > 0)
                    let information = results[0].information
                    if(information.length !== 0){
                        fs.unlinkSync(path.join('./public/images/payment-method', information))
                    }
                    await connection.query('UPDATE payment_method SET information = ?, update_at = ? WHERE uuid = ?',
                    [requestInformation, new Date(), requestUUID])
                    connection.end()
                    response.status(200).json({status: true, payload: 'การแก้ไขรูปภาพสอนการชำระเงินสำเร็จ'})
                }catch(error){
                    try{
                        fs.unlinkSync(path.join('./public/images/payment-method', request.file.filename))
                    }catch(error){}finally{
                        if(error.code === 'ECONNREFUSED'){
                            response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
                        }else{
                            console.log(error)
                            response.status(200).json({status: false, payload: 'การแก้ไขรูปภาพสอนการชำระเงินล้มเหลว'})
                        }
                    }
                }
            }
        })
    }catch(error){
        try{
            fs.unlinkSync(path.join('./public/images/payment-method', request.file.filename))
        }catch(error){}finally{
            if(error.code === 'ECONNREFUSED'){
                response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
            }else{
                console.log(error.code)
                response.status(200).json({status: false, payload: 'การแก้ไขรูปภาพสอนการชำระเงินล้มเหลว'})
            }
        }
    }
}

module.exports.paymentMethodUpdateVideo = async (request, response) => {
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
        const requestUUID = request.body.uuid
        const requestInformation = request.body.information
        await connection.query('UPDATE payment_method SET information = ?, update_at = ? WHERE uuid = ?',
        [requestInformation, new Date(), requestUUID])
        connection.end()
        response.status(200).json({status: true, payload: 'การแก้ไขวิดีโอสอนการชำระเงินสำเร็จ'})
    }catch(error){
        if(error.code === 'ECONNREFUSED'){
            response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
        }else{
            response.status(200).json({status: false, payload: 'การแก้ไขวิดีโอสอนการชำระเงินล้มเหลว'})
        }
    }
}

module.exports.deletePaymentMethodImage = async (request, response) => {
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
        const requestUUID = request.params.uuid
        const [results] = await connection.query('SELECT information FROM payment_method WHERE uuid = ?',
        [requestUUID])
        assert(results.length > 0)
        const information = results[0].information
        await connection.query("UPDATE payment_method SET information = '' WHERE uuid = ?",
        [requestUUID])
        connection.end()
        fs.unlinkSync(path.join('./public/images/payment-method', information))
        response.status(200).json({status: true, payload: 'การลบรูปภาพสอนการชำระเงินสำเร็จ'})
    }catch(error){
        if(error.code === 'ECONNREFUSED'){
            response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
        }else{
            response.status(200).json({status: false, payload: 'การลบรูปภาพสอนการชำระเงินล้มเหลว'})
        }
    }
}

module.exports.deletePaymentMethodVideo = async (request, response) => {
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
        const requestUUID = request.params.uuid
        const [results] = await connection.query('SELECT information FROM payment_method WHERE uuid = ?',
        [requestUUID])
        assert(results.length > 0)
        await connection.query("UPDATE payment_method SET information = '' WHERE uuid = ?",
        [requestUUID])
        connection.end()
        response.status(200).json({status: true, payload: 'การลบวิดีโอสอนการชำระเงินสำเร็จ'})
    }catch(error){
        if(error.code === 'ECONNREFUSED'){
            response.status(200).json({status: false, payload: 'เกิดข้อผิดพลาดขึ้นในการเชื่อมต่อกับฐานข้อมูล'})
        }else{
            response.status(200).json({status: false, payload: 'การลบวิดีโอสอนการชำระเงินล้มเหลว'})
        }
    }
}