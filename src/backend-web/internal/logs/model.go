package logs

// LogEntry representa um evento de log retornado pela API
type LogEntry struct {
	ID     int    `json:"id"`
	Ts     string `json:"ts"`
	Level  string `json:"level"`
	Source string `json:"source"`
	Msg    string `json:"msg"`
}

// zapLine é usada internamente para deserializar linhas do arquivo app.jsonl
type zapLine struct {
	Level  string `json:"level"`
	Ts     string `json:"ts"`
	Caller string `json:"caller"`
	Msg    string `json:"msg"`
}
