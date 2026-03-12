package user

import (
	"os"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"

	"backend-web/internal/platform/database"
	"backend-web/internal/platform/logger"
	"errors"
	"time"
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
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
func (s *UserService) DeleteUser(id string) error {
    return database.DB.Transaction(func(tx *gorm.DB) error {
        var user User
        if err := tx.First(&user, id).Error; err != nil {
            if errors.Is(err, gorm.ErrRecordNotFound) {
                errNotFound := fmt.Errorf("usuário não encontrado")
                logger.Error(errNotFound.Error(), errNotFound, zap.String("user_id", id))
                return errNotFound
            }
            return err
        }
        if err := tx.Model(&user).Update("is_active", false).Error; err != nil {
            return err
        }

        if err := tx.Delete(&user).Error; err != nil {
            return err
        }
        return nil
    })
}