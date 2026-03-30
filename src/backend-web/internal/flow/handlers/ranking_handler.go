package handlers

import (
	"backend-web/internal/flow/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HandleNeighborhoodRanking godoc
// @Summary      Ranking de ruas mais movimentadas
// @Description  Retorna o ranking das ruas utilizando geocodificação reversa para obter nomes reais
// @Tags         Ranking
// @Accept       json
// @Produce      json
// @Param        request body models.DataRequest true "Filtros de busca e limite"
// @Success      200 {object} map[string][]models.RankingResponse
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Security     BearerAuth
// @Router       /api/v1/flow/ranking/neighborhoods [post]
func (h *FlowHandler) HandleNeighborhoodRanking(c *gin.Context) {
	var req models.DataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Filtros inválidos"})
		return
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 10
	}

	ranking, err := h.repo.GetNeighborhoodRanking(c.Request.Context(), *req.Filters, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ranking": ranking})
}
