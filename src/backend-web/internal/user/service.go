package user

import (
	"os"
    "github.com/golang-jwt/jwt/v5"

	"backend-web/internal/platform/database"
	"golang.org/x/crypto/bcrypt"
	"errors"
	"time"
)

type UserService struct{}

func (s *UserService) CreateUser(name, email, password, role string) (*User, error) {
	// Criptografa a senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	//Criar a instância com as info
	user := User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
		Role:     role,
	}

	// Salvar no banco
	result := database.DB.Create(&user)
	if result.Error != nil {
		return nil, result.Error
	}

	return &user, nil
}


func (s *UserService) Login(email, password string) (string, error) {
	var user User
	//Busca o usuário pelo e-mail
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return "", errors.New("usuário não encontrado")
	}

	// Compara o hash da senha
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("senha inválida")
	}

	// Gera o Token JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 *365).Unix(), // Expira em 24h
	})

	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}