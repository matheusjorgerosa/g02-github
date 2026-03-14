package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend-web/internal/flow/models"
)

// HandleMetrics godoc
// @Summary      Obter métricas gerais
// @Description  Retorna o total de audiência e o fluxo de pessoas por hora (24h)
// @Tags         Métricas
// @Accept       json
// @Produce      json
// @Param        request body models.DataRequest true "Filtros de busca"
// @Success      200 {object} models.MetricsResponse
// @Failure      400 {object} map[string]string "Filtros inválidos"
// @Failure      500 {object} map[string]string "Erro interno no servidor"
// @Router       /flow/metrics [post]
func (h *FlowHandler) HandleMetrics(c *gin.Context) {
	var req models.DataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Filtros inválidos"})
		return
	}
	metrics, err := h.repo.GetGeneralMetrics(c.Request.Context(), req.Filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, metrics)
}
