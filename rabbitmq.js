const amqp = require('amqplib');

module.exports = class RabbitMQ {
    constructor(config) {
        this._config = config;
    }
    async init() {
        this._conn = await amqp.connect(this._config.configConnection)
        this._channel = await this._conn.createChannel()
    }

    async responseQueue(queueName, options) {
        const responseQueus = await this._channel.assertQueue(queueName, options)
        return responseQueus;
    }

    async push(queueName, message) {
        await this._channel.sendToQueue(queueName, Buffer.from(message))
    }

    async get(queueName) {
        return await this._channel.get(queueName)
    }

    async ack(message) {
        await this._channel.ack(message)
    }

    async ackAll() {
        await this._channel.ackAll()
    }

    async nackAll() {
        await this._channel.nackAll()
    }

}