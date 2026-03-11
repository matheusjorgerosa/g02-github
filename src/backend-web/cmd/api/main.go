package main

import (
	"backend-web/internal/platform/logger"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	logger.Init()
	defer logger.Sync()
    logger.Info("a aplicação está iniciando...", zap.String("env", "development"))
	r := gin.New()

r.GET("/health", func(c *gin.Context) {
		logger.Info("Health check acedido", zap.String("ip", c.ClientIP()))
		c.JSON(http.StatusOK, gin.H{"status": "up"})
	})

	if err := r.Run(":8080"); err != nil {
		logger.Fatal("Falha ao iniciar o servidor", err)
	}
}