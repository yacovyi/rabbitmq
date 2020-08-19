const RabbitMQ = require('./rabbitmq')

const qName = "q1";
const qOptions = {
    durable: true
};
const noAck = {
    noAck: true
};

const config = {
    configConnection : {}
};
const rabbitMQ = new RabbitMQ(config);

(async () => {
    await rabbitMQ.init();

    // push messages
    send(JSON.stringify({time: Date.now()}));

    // print queue size
    await queueSize();

    var message = {};
    var messages = [];

    while (message) {
        message =  await get(noAck);
        if (message) {
            console.log(message.content.toString());
            rabbitMQ.ack(message);
        } else {
            await rabbitMQ.ackAll();
            process.exit(0)
        }
        messages.push(message)
    }



})();

async function queueSize() {
    const responseQueue = await rabbitMQ.responseQueue(qName, qOptions);
    const queueSize = responseQueue.messageCount;
    console.log(`${qName} size ${queueSize}`)
    return queueSize;
};

function send(message) {
    rabbitMQ.push(qName, message);
}
async function get(options) {
    return rabbitMQ.get(qName, options);
}