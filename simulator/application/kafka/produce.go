package kafka

import (
	"encoding/json"
	ckafka "github.com/confluentinc/confluent-kafka-go/kafka"
	routes "github.com/andersonhqds/simulator/application/routes"
	"github.com/andersonhqds/simulator/infra/kafka"
	"time"
	"log"
	"os"
)

func Produce(msg *ckafka.Message) {
	producer := kafka.NewKafkaProducer()
	route := routes.NewRoute()
	json.Unmarshal(msg.Value, &route)
	route.LoadPositions()
	positions, err := route.ExportJsonPositions()
	if err != nil {
		log.Println(err.Error())
	}
	for _, p := range positions {
		kafka.Publish(p, os.Getenv("KafkaProduceTopic"), producer)
		time.Sleep(time.Millisecond * 500)
	}
}