# Simulator

This project is a simulator to generate routes, produce and consume that in kafka, the routes will be sent using json to the kafka

## Installation

You need to run the docker-compose in `.docker/kafka` to start the kafka

```bash
   docker-compose up -d
```

You also need to run the docker-compose file in the root to start the go language container and after that exec the container on interative mode

```bash
  docker-compose up -d
  docker exec -it simulator bash
```

For execute the application you can run

```bash
    go run main.go
```

if you want to consume using the kafka you can run

```bash
   kafka-console-consumer --bootstrap-server=localhost:9092 --topic=new-position --group=terminal
```

if you want to produce using the kafka you can run

```bash
   kafka-console-producer --bootstrap-server=localhost:9092 --topic=route.new-direction
```
