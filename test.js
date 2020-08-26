const RabbitMQ = require('./rabbitmq')

const qName = "rx_stratego_frame_dev";
const qOptions = {
    durable: true
};
const noAck = {
    noAck: true
};

const config = {
    "connectionStrings": [
        "amqp://localhost"
    ],
    "isConnectionEnabled": true,
    "queues": [
        {
            "qName": "rx_stratego_frame_dev",
            "qTTL": 10
        },
        {
            "qName": "rx_stratego_solution_dev",
            "qTTL": 10
        },
        {
            "qName": "rx_stratego_frame_files_dev",
            "qTTL": 10
        },
        {
            "qName": "rx_stratego_additional_image_dev",
            "qTTL": 10
        },
        {
            "qName": "rx_stratego_global_file_dev",
            "qTTL": 10
        }
    ]
};
const rabbitMQ = new RabbitMQ(config);

(async () => {
    await rabbitMQ.init();

    // push messages
    //send(JSON.stringify({time: Date.now().toString()}));
    //send(JSON.stringify({name: "yacov"}));

    // print queue size
    await queueSize();

    let messages = await getAllMessages();

    await queueSize();

    messages.forEach(message => {
        //rabbitMQ.ack(qName, message);
        rabbitMQ.nack(qName, message);

        const content = rabbitMQ.getMessageContent(message);
        const getMessageFailureCount = rabbitMQ.getMessageFailureCount(message);

        console.log(getMessageFailureCount, content.name)
    })

})();

async function queueSize() {
    const responseQueue = await rabbitMQ.responseQueue(qName);
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

async function getAllMessages() {
    let messages = [];
    let message = {};
    // fetch all messages
    while (message) {
        message =  await get();
        if (!message)
            break;
        messages.push(message)
    }

    return messages;
}