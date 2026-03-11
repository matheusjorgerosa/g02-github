package user

import (
	"backend-web/internal/platform/database"
	"golang.org/x/crypto/bcrypt"
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