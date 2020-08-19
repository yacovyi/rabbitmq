const amqp = require('amqplib/callback_api');
amqp.connect('amqp://localhost', function(error0, connection) {

        if (error0) {
            throw error0;
        }
    connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            const queue = "myqueue"

            channel.assertQueue(queue, {
                durable: true
            });
            console.log("[*] wating for message in %s. To exit press CTRL+C", queue);


            channel.consume(queue, function(msg) {
                console.log("[x] Message ", msg.content.toString())
            }, {
                noAck: true
            })


        });
});