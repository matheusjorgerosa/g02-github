package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend/internal/models"
)

// HandleSpatialData godoc
// @Summary      Obter dados espaciais
// @Description  Retorna pontos de latitude/longitude com volume para o mapa de calor
// @Tags         Fluxo
// @Accept       json
// @Produce      json
// @Param        request body models.DataRequest true "Filtros de busca"
// @Success      200 {object} map[string][]models.SpatialResponse
// @Failure      400 {object} map[string]string
// @Router       /flow/spatial [post]
func (h *FlowHandler) HandleSpatialData(c *gin.Context) {
	var req models.DataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Filtros inválidos"})
		return
	}
	data, err := h.repo.GetSpatialData(c.Request.Context(), req.Filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}
