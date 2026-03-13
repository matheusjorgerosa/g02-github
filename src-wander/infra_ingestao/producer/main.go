package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/pubsub"
)

var (
	topic     *pubsub.Topic
	projectID string
)

func main() {
	projectID = os.Getenv("GCP_PROJECT")
	topicName := os.Getenv("PUBSUB_TOPIC")

	if projectID == "" || topicName == "" {
		log.Fatal("Variáveis GCP_PROJECT e PUBSUB_TOPIC são obrigatórias")
	}

	ctx := context.Background()
	client, err := pubsub.NewClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Erro ao criar cliente Pub/Sub: %v", err)
	}
	defer client.Close()

	topic = client.Topic(topicName)

	http.HandleFunc("/ingest", handleIngest)
	http.HandleFunc("/health", handleHealth)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Producer rodando na porta %s", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func handleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Erro ao ler body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if len(body) == 0 {
		http.Error(w, "Body vazio", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	result := topic.Publish(ctx, &pubsub.Message{
		Data: body,
	})

	msgID, err := result.Get(ctx)
	if err != nil {
		log.Printf("Erro ao publicar no Pub/Sub: %v", err)
		http.Error(w, "Erro ao publicar mensagem", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status":     "accepted",
		"message_id": msgID,
	})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
