package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend-web/internal/flow/models"
)

// HandleDemographics godoc
// @Summary      Distribuição demográfica
// @Description  Retorna a porcentagem e volume de público por Gênero e Classe Social
// @Tags         Demografia
// @Accept       json
// @Produce      json
// @Param        request body models.DataRequest true "Filtros de busca"
// @Success      200 {object} models.DemographicsResponse
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router /flow/distribution/demographics [post]
func (h *FlowHandler) HandleDemographics(c *gin.Context) {
	var req models.DataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Filtros inválidos"})
		return
	}
	dist, err := h.repo.GetDemographics(c.Request.Context(), req.Filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dist)
}