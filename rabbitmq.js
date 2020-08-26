const amqp = require("amqp-connection-manager");

module.exports = class RabbitMQ {
    constructor(config) {
        this._config = config;
    }

    async init() {
        this._queuesSetting = this.getQueuesSetting();

        this._conn = await amqp.connect(this._config.connectionStrings)
        this._channelsWrapper = {}

        this._conn.on("connect", () => {
            console.log("info", "Rabbit mq connected! Listening to messages");
            this.connect();
        });
        await this.connect();
        this._conn.on("disconnect", err => {
            console.log(
                "error",
                `Rabbit mq disconnected ${err.err.message || err} `
            );
        });
    }

    async connect() {
        for(const queueName in this._queuesSetting) {
            this._channelsWrapper[queueName] = await this.createChannelAndConnect(this._queuesSetting[queueName]);
        }
    }

    async responseQueue(queueName) {

        let settings = this._queuesSetting[queueName]
        let queueSettings = {
            durable: true,
            deadLetterExchange: settings.dlxQExchangeName,
            deadLetterRoutingKey: ""
        };
        const responseQueus = await this._channelsWrapper[queueName].assertQueue(queueName, queueSettings)
        return responseQueus;
    }

    async push(queueName, message) {
        await this._channelsWrapper[queueName].sendToQueue(queueName, Buffer.from(message))

    }

    async get(queueName, options) {
        const message =  await this._channelsWrapper[queueName]._channel.get(queueName, options);
        return message
    }
    getMessageContent(message) {
        const data = Buffer.from(JSON.parse(message.content).data).toString('utf8')
        return JSON.parse(data);
    }

    async ack(queueName, message) {
        await this._channelsWrapper[queueName].ack(message)
    }

    async nack(queueName, message) {
        await this._channelsWrapper[queueName].nack(message, false, false)
    }

    async createChannelAndConnect(settings) {
        let channelWrapper = this._conn.createChannel({
            json: true,
            setup: channel => {
                return Promise.all([
                    channel.assertExchange(settings.qExchangeName, "direct", {
                        durable: true
                    }),
                    channel.assertQueue(settings.qName, {
                        durable: true,
                        deadLetterExchange: settings.dlxQExchangeName,
                        deadLetterRoutingKey: ""
                    }),
                    channel.bindQueue(settings.qName, settings.qExchangeName),

                    channel.assertExchange(settings.dlxQExchangeName, "direct", {
                        durable: true
                    }),
                    channel.assertQueue(settings.dlxQName, {
                        durable: true,
                        deadLetterExchange: settings.qExchangeName,
                        deadLetterRoutingKey: "",
                        messageTtl: settings.qTTL * 1000
                    }),
                    channel.bindQueue(settings.dlxQName, settings.dlxQExchangeName),
                ]);
            }
        });
        await channelWrapper.waitForConnect();
        console.log("info", `Done config queue : ${settings.qName}`);
        return channelWrapper;
    }

    getQueuesSetting() {
        const queueSettings = this._config
            .queues
            .map(queue => this.createQSetting(queue))
            .reduce((map, config)=> {map[[config.qName]] = config;return map}, {});
        return queueSettings;
    }

    createQSetting(qSettings) {
        let ttl = parseInt(qSettings.qTTL);
        let dlxQName = `${qSettings.qName}_${ttl}-dlx`;
        return {
            qTTL: ttl,
            qName: qSettings.qName,
            qExchangeName: `${qSettings.qName}_${ttl}-exchange`,
            dlxQName: dlxQName,
            dlxQExchangeName: `${dlxQName}_${ttl}-exchange`,
            parallelTasks: parseInt(qSettings.parallelTasks)
        };
    }

    getMessageFailureCount(message) {
        const failureAmount = (message.properties.headers && message.properties.headers["x-death"]) ?
            message.properties.headers["x-death"][0].count :
            0;
        return failureAmount;
    }
}