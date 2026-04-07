package logs

import (
	"bufio"
	"encoding/json"
	"os"
)

const defaultLimit = 100

type LogRepository struct {
	filePath string
}

func NewLogRepository(filePath string) *LogRepository {
	return &LogRepository{filePath: filePath}
}

// ReadLogs lê as últimas `limit` entradas do arquivo JSONL de logs.
// Retorna as entradas mais recentes primeiro (ordem decrescente de timestamp).
// Se level não for vazio, filtra apenas entradas com aquele nível.
func (r *LogRepository) ReadLogs(limit int, level string) ([]LogEntry, error) {
	if limit <= 0 {
		limit = defaultLimit
	}

	file, err := os.Open(r.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []LogEntry{}, nil
		}
		return nil, err
	}
	defer file.Close()

	var lines []zapLine
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		var z zapLine
		if err := json.Unmarshal(scanner.Bytes(), &z); err != nil {
			continue // ignora linhas malformadas
		}
		if level != "" && z.Level != level {
			continue
		}
		lines = append(lines, z)
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	// Pega apenas as últimas `limit` linhas e inverte para mais recentes primeiro
	if len(lines) > limit {
		lines = lines[len(lines)-limit:]
	}

	entries := make([]LogEntry, len(lines))
	for i, z := range lines {
		entries[len(lines)-1-i] = LogEntry{
			ID:     len(lines) - i,
			Ts:     z.Ts,
			Level:  z.Level,
			Source: z.Caller,
			Msg:    z.Msg,
		}
	}

	return entries, nil
}
