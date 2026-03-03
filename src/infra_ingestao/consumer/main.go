package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	"cloud.google.com/go/pubsub"
	"cloud.google.com/go/storage"
)

func main() {
	projectID := os.Getenv("GCP_PROJECT")
	subscriptionName := os.Getenv("PUBSUB_SUBSCRIPTION")
	bucketName := os.Getenv("GCS_BUCKET")
	batchSizeStr := os.Getenv("BATCH_SIZE")

	if projectID == "" || subscriptionName == "" || bucketName == "" {
		log.Fatal("Variáveis GCP_PROJECT, PUBSUB_SUBSCRIPTION e GCS_BUCKET são obrigatórias")
	}

	batchSize := 100
	if batchSizeStr != "" {
		if n, err := strconv.Atoi(batchSizeStr); err == nil && n > 0 {
			batchSize = n
		}
	}

	ctx := context.Background()

	// Cliente Pub/Sub
	pubsubClient, err := pubsub.NewClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Erro ao criar cliente Pub/Sub: %v", err)
	}
	defer pubsubClient.Close()

	// Cliente GCS
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatalf("Erro ao criar cliente Storage: %v", err)
	}
	defer storageClient.Close()

	sub := pubsubClient.Subscription(subscriptionName)
	sub.ReceiveSettings.MaxOutstandingMessages = batchSize
	sub.ReceiveSettings.Synchronous = true

	// Coleta mensagens com timeout
	var messages []json.RawMessage
	var mu sync.Mutex

	pullCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	err = sub.Receive(pullCtx, func(_ context.Context, msg *pubsub.Message) {
		mu.Lock()
		defer mu.Unlock()

		messages = append(messages, json.RawMessage(msg.Data))
		msg.Ack()

		if len(messages) >= batchSize {
			cancel()
		}
	})

	if err != nil && err != context.Canceled {
		log.Printf("Receive encerrado: %v", err)
	}

	if len(messages) == 0 {
		log.Println("Nenhuma mensagem na fila. Encerrando.")
		return
	}

	log.Printf("Coletadas %d mensagens. Comprimindo e enviando para GCS...", len(messages))

	// Serializar como JSON array
	jsonData, err := json.Marshal(messages)
	if err != nil {
		log.Fatalf("Erro ao serializar JSON: %v", err)
	}

	// Comprimir com gzip
	var buf bytes.Buffer
	gzWriter := gzip.NewWriter(&buf)
	if _, err := gzWriter.Write(jsonData); err != nil {
		log.Fatalf("Erro ao comprimir: %v", err)
	}
	if err := gzWriter.Close(); err != nil {
		log.Fatalf("Erro ao fechar gzip: %v", err)
	}

	// Caminho particionado: raw/YYYY/MM/DD/batch-{unix_timestamp}.json.gz
	now := time.Now()
	objectPath := fmt.Sprintf("raw/%s/batch-%d.json.gz",
		now.Format("2006/01/02"),
		now.Unix(),
	)

	// Upload para GCS
	bucket := storageClient.Bucket(bucketName)
	obj := bucket.Object(objectPath)
	writer := obj.NewWriter(ctx)
	writer.ContentType = "application/gzip"
	writer.ContentEncoding = "gzip"

	if _, err := writer.Write(buf.Bytes()); err != nil {
		log.Fatalf("Erro ao escrever no GCS: %v", err)
	}
	if err := writer.Close(); err != nil {
		log.Fatalf("Erro ao finalizar upload: %v", err)
	}

	log.Printf("Batch salvo em gs://%s/%s (%d mensagens, %d bytes comprimidos)",
		bucketName, objectPath, len(messages), buf.Len())
}
