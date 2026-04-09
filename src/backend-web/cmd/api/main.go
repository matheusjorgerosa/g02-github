package main

import (
	"context"
	"log"
	"os"
	"strings"

	"backend-web/internal/logs"
	"backend-web/internal/platform/database"
	"backend-web/internal/platform/logger"
	"backend-web/internal/platform/middleware"
	"backend-web/internal/user"

	flowconfig "backend-web/internal/flow/config"
	flowhandlers "backend-web/internal/flow/handlers"
	flowrepo "backend-web/internal/flow/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	_ "backend-web/docs"
	"github.com/swaggo/files"
	"github.com/swaggo/gin-swagger"
)

// @title           VENUS API
// @version         1.0
// @description     API unificada: autenticação JWT + dados de fluxo de audiência
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
	// Carrega variáveis de ambiente
	err := godotenv.Load()
	if err != nil {
		log.Println("Aviso: Erro ao carregar arquivo .env")
	}

	// Inicializa serviços base
	logger.Init()
	defer logger.Sync()

	database.Init()

	// Inicializa BigQuery e repositórios de flow
	ctx := context.Background()
	gcpProject := os.Getenv("GCP_PROJECT")
	if gcpProject == "" {
		gcpProject = "venus-m09"
	}
	bqClient := flowconfig.ConnectBigQuery(ctx, gcpProject)
	dbEngine := flowrepo.NewBigQueryAdapter(bqClient)
	geoCoder, err := flowrepo.NewGoogleMapsAdapter()
	if err != nil {
		logger.Fatal("Erro ao inicializar Google Maps", err)
	}
	repo := flowrepo.NewFlowRepository(dbEngine, geoCoder)
	flowHandler := flowhandlers.NewFlowHandler(repo)

	// Migrações e Instâncias
	database.DB.AutoMigrate(&user.User{})
	database.SeedAdmin()
	userService := &user.UserService{}
	userHandler := user.NewUserHandler(userService)

	logRepo := logs.NewLogRepository("logs/app.jsonl")
	logHandler := logs.NewLogHandler(logRepo)

	logger.Info("a aplicação está iniciando...", zap.String("env", "development"))

	// Configuração do Gin
	r := gin.New()
	r.Use(gin.Recovery()) // Adicionado para sua API não morrer se der um panic no código

	// CORS - origins configuráveis via env var ALLOWED_ORIGINS (lista separada por vírgula).
	// Fallback inclui localhost (dev) e o front em produção no Render.
	allowedOrigins := []string{
		"http://localhost:5173",
		"https://g02-github-front.onrender.com",
	}
	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		parts := strings.Split(envOrigins, ",")
		allowedOrigins = allowedOrigins[:0]
		for _, o := range parts {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	//Rotas públicas
	r.POST("/login", userHandler.Login)
	r.POST("/signup", userHandler.Signup)
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "up"}) })


	// Rotas protegidas do admin
	protected := r.Group("/admin")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/users", middleware.AdminOnly(), userHandler.ListUsers)
		protected.POST("/users", middleware.AdminOnly(), userHandler.CreateUser)
		protected.PUT("/users/:id", middleware.AdminOnly(), userHandler.AdminUpdateUser)
		protected.DELETE("/users/:id", middleware.AdminOnly(), userHandler.DeleteUser)
		protected.GET("/logs", middleware.AdminOnly(), logHandler.ListLogs)
	}

	// Rotas de dados protegidas (qualquer usuário autenticado)
	flow := r.Group("/api/v1/flow")
	flow.Use(middleware.AuthMiddleware())
	{
		flow.POST("/spatial", flowHandler.HandleSpatialData)
		flow.POST("/metrics", flowHandler.HandleMetrics)
		flow.POST("/ranking/neighborhoods", flowHandler.HandleNeighborhoodRanking)
		flow.POST("/distribution/demographics", flowHandler.HandleDemographics)
	}

	if err := r.Run(":8080"); err != nil {
		logger.Fatal("Falha ao iniciar o servidor", err)
	}
}
