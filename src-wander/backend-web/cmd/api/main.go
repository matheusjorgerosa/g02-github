package main

import (
	"backend-web/internal/platform/database"
	"backend-web/internal/platform/logger"
	"backend-web/internal/platform/middleware"
	"backend-web/internal/user"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	_ "backend-web/docs"
    "github.com/swaggo/gin-swagger"
    "github.com/swaggo/files"
)

// @title           Backend Web API
// @version         1.0
// @description     API de gerenciamento de usuários com autenticação JWT.
// @termsOfService  http://swagger.io/terms/

// @contact.name   Wander Suporte
// @contact.email  admin@backendweb.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 Digite 'Bearer ' seguido do seu token JWT

func main() {
	// Inicializa serviços base
	logger.Init()
	defer logger.Sync()

	database.Init()

	// Migrações e Instâncias
	database.DB.AutoMigrate(&user.User{})
	userService := &user.UserService{}
	userHandler := user.NewUserHandler(userService)

	logger.Info("a aplicação está iniciando...", zap.String("env", "development"))

	// Configuração do Gin
	r := gin.New()
	r.Use(gin.Recovery()) // Adicionado para sua API não morrer se der um panic no código

	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	//Rotas públicas
	r.POST("/login", userHandler.Login)
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "up"}) })


	// Rotas protegidas do admin
	protected := r.Group("/admin")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/users",middleware.AdminOnly(), userHandler.ListUsers)
		protected.POST("/users", middleware.AdminOnly(), userHandler.CreateUser)
		protected.PUT("/users/:id",middleware.AdminOnly() ,userHandler.AdminUpdateUser)
		protected.DELETE("/users/:id", middleware.AdminOnly(), userHandler.DeleteUser)
	}

	if err := r.Run(":8080"); err != nil {
		logger.Fatal("Falha ao iniciar o servidor", err)
	}
	
}
