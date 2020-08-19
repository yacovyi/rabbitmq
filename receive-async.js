/**
 * Here my test code
 *
 * requirng amqp.node lib
 */
let amqp = require('amqplib')
    , EventEmitter = require('events')
    , eventEmitter = new EventEmitter()
    , timeout = 10000
    , configConnection = { /* ..config options */ }
    , queue = 'myqueue'
    , exchange = 'myqueue.exchange';

    /**
     * declare annonymous function as async and immediately called it
     */
    (async () => {
        /**
         * declare connection and channel with using async/await construction
         * who support version node.js >= 8.5.0
         */
        let conn = await amqp.connect(configConnection)
        let channel = await conn.createChannel()
        let response = await channel.assertQueue(queue)
        /**
         * response: { queue: 'users', messageCount: 10, consumerCount: 0 }
         */
        let messageCount = response.messageCount
        console.log(messageCount)
        response = await channel.consume(response.queue, logMessage(messageCount), {noAck: false})
        /**
         * {noAck: false} false for not expect an acknowledgement
         */

        /**
         * declare timeout if we have problems with emit event in consume
         * we waiting when event will be emit once 'consumeDone' and promise gain resolve
         * so we can go to the next step
         */
        setTimeout(() => eventEmitter.emit('consumeDone'), timeout)
        await new Promise(resolve => eventEmitter.once('consumeDone', resolve))
        console.log('reading for query finish')

        function logMessage(messageCount) {
            return msg => {
                console.log("[*] recieved: '%s'", msg.content.toString())
                if (messageCount == msg.fields.deliveryTag) {
                    eventEmitter.emit('consumeDone')
                }
            }

        }
    })()
