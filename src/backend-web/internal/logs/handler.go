package logs

import (
	"net/http"
	"strconv"

	"backend-web/internal/platform/logger"

	"github.com/gin-gonic/gin"
)

type LogHandler struct {
	repo *LogRepository
}

func NewLogHandler(repo *LogRepository) *LogHandler {
	return &LogHandler{repo: repo}
}

// ListLogs godoc
// @Summary      Listar logs do sistema
// @Description  Retorna as entradas mais recentes do arquivo de log da aplicação. Requer privilégios de administrador.
// @Tags         Admin
// @Produce      json
// @Security     BearerAuth
// @Param        level  query     string  false  "Filtrar por nível (error, warn, info)"
// @Param        limit  query     int     false  "Número máximo de entradas (padrão: 100)"
// @Success      200    {object}  map[string][]LogEntry
// @Failure      401    {object}  map[string]string
// @Failure      403    {object}  map[string]string
// @Failure      500    {object}  map[string]string
// @Router       /admin/logs [get]
func (h *LogHandler) ListLogs(c *gin.Context) {
	level := c.Query("level")

	limit := defaultLimit
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	entries, err := h.repo.ReadLogs(limit, level)
	if err != nil {
		logger.Error("Erro ao ler logs do sistema", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler logs do sistema"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": entries})
}
