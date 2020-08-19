const amqp = require('amqplib/callback_api');
amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            console.log(error1)
            throw error1;
        }
        const queue = 'myqueue'
        const msg = "hello world"

        channel.assertQueue(queue, {
            durable: true
        })

        channel.sendToQueue(queue, Buffer.from(msg));

        console.log("[x]  Sent %s", msg)

        setTimeout(function () {
            connection.close();
            process.exit(0)
        }, 500)
    });
});

( () => {
    console.log("1")
})()
