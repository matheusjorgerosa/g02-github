package main

import (
    "context"
    "github.com/gin-gonic/gin"
    "backend/internal/config"
    "backend/internal/handlers"
    "backend/internal/repository"
    "log"
    "github.com/joho/godotenv"
    "github.com/swaggo/gin-swagger"
    "github.com/swaggo/files"
    _"backend/internal/docs"
)

// @title           Eletromidia Flow API
// @version         1.0
// @description     API para dashboard de fluxo de audiência com BigQuery e Google Maps.
// @host            localhost:8080
// @BasePath        /api/v1
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Aviso: Erro ao carregar arquivo .env (assumindo variáveis de ambiente padrão)")
	}

	ctx := context.Background()

	bqClient := config.ConnectBigQuery(ctx, "venus-m09")

	dbEngine := repository.NewBigQueryAdapter(bqClient)
	geoCoder, err := repository.NewGoogleMapsAdapter()
	if err != nil {
		log.Fatalf("Erro crítico ao inicializar o Google Maps: %v", err)
	}

	repo := repository.NewFlowRepository(dbEngine, geoCoder)
	h := handlers.NewFlowHandler(repo)

	r := gin.Default()

	api := r.Group("/api/v1/flow")
	{
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		api.POST("/spatial", h.HandleSpatialData)
		api.POST("/metrics", h.HandleMetrics)
		api.POST("/ranking/neighborhoods", h.HandleNeighborhoodRanking)
		api.POST("/distribution/demographics", h.HandleDemographics)
	}

	r.Run(":8080")
}