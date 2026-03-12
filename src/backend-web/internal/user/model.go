package user

import (
	"time"

	"gorm.io/gorm"
)

// Model tabela user
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` 
	
	Name     string `gorm:"type:varchar(100);not null" json:"name"`
	Email    string `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Password string `gorm:"type:varchar(255);not null" json:"-"` // O json:"-" esconde a senha nas respostas da API
	Role     string `gorm:"type:varchar(20);default:'user'" json:"role"`
}