package main

import (
	"backend-web/internal/platform/database"
	"backend-web/internal/platform/logger"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"backend-web/internal/user"

	
)

func main() {
	logger.Init()
	database.Init()

	database.DB.AutoMigrate(&user.User{})
	userService := &user.UserService{}
	userHandler := user.NewUserHandler(userService)


	defer logger.Sync()
    logger.Info("a aplicação está iniciando...", zap.String("env", "development"))
	r := gin.New()

	r.GET("/health", func(c *gin.Context) {
		logger.Info("Health check acedido", zap.String("ip", c.ClientIP()))
		c.JSON(http.StatusOK, gin.H{"status": "up"})
	})
	r.POST("/admin/users", userHandler.CreateUser)


	if err := r.Run(":8080"); err != nil {
		logger.Fatal("Falha ao iniciar o servidor", err)
	}

	
}