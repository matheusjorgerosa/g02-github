package database

import (
	"os"

	"backend-web/internal/platform/logger"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

func SeedAdmin() {
	email := os.Getenv("ADMIN_EMAIL")
	if email == "" {
		email = "admin@venus.com"
	}
	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		password = "admin123"
	}
	name := os.Getenv("ADMIN_NAME")
	if name == "" {
		name = "Admin"
	}

	var count int64
	DB.Table("users").Where("role = ? AND email = ?", "admin", email).Count(&count)
	if count > 0 {
		logger.Info("Admin seed já existe, pulando...")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Erro ao gerar hash da senha do admin", err)
		return
	}

	result := DB.Exec(
		`INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
		 VALUES (?, ?, ?, 'admin', true, NOW(), NOW())`,
		name, email, string(hashedPassword),
	)
	if result.Error != nil {
		logger.Error("Erro ao criar admin seed", result.Error)
		return
	}

	logger.Info("Admin seed criado com sucesso", zap.String("email", email))
}
