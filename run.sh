# rabbitmq server port 5672
docker run -d -p 5671:5671 -p 5672:5672 -p 25672:25672 -p 4369:4369 --hostname my-rabbit --name rabbitmq rabbitmq:3