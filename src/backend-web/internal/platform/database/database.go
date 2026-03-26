package database

import (
	"fmt"
	"os"
	"strings"
	"time"

	"backend-web/internal/platform/logger"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	var err error
	dsn := buildDSN()

	for i := 1; i <= 3; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		logger.Warn("Tentativa de conexão com banco falhou. Tentando novamente...", zap.Int("tentativa", i))
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		logger.Fatal("Não foi possível conectar ao banco após 3 tentativas", err)
	}

	logger.Info("Banco de dados conectado com sucesso!")
}

func buildDSN() string {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	///cloudsql/venus-m09:us-central1:venus-backend-db
	if strings.HasPrefix(host, "/") {
		return fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s sslmode=disable",
			host, user, password, dbname,
		)
	}

	// Conexão local normal (docker-compose, desenvolvimento)
	if port == "" {
		port = "5432"
	}
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port,
	)
}
