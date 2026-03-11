package database

import (
	"fmt"
	"os"
	"time"

	"backend-web/internal/platform/logger"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	var err error
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	// Tenta conectar até 5 vezes antes de desistir
	for i := 1; i <= 5; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		logger.Warn("Tentativa de conexão com banco falhou. Tentando novamente...", zap.Int("tentativa", i))
		time.Sleep(2 * time.Second) // Aguarda 2 segundos para o banco respirar
	}

	if err != nil {
		logger.Fatal("Não foi possível conectar ao banco após 5 tentativas", err)
	}

	logger.Info("Banco de dados conectado com sucesso!")
}