package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var log *zap.Logger

func Init() {
    config := zap.NewProductionEncoderConfig()
    config.EncodeTime = zapcore.ISO8601TimeEncoder
    jsonEncoder := zapcore.NewJSONEncoder(config)

    // Criar a pasta de logs se não existir
    if _, err := os.Stat("logs"); os.IsNotExist(err) {
        _ = os.Mkdir("logs", 0755)
    }

    // Abrir o arquivo
    file, err := os.OpenFile("logs/app.jsonl", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    if err != nil {
        log = zap.New(zapcore.NewCore(jsonEncoder, zapcore.AddSync(os.Stdout), zap.InfoLevel))
        log.Error("Falha ao abrir arquivo de log, usando apenas stdout", zap.Error(err))
        return
    }

    core := zapcore.NewTee(
        zapcore.NewCore(jsonEncoder, zapcore.AddSync(os.Stdout), zap.InfoLevel),
        zapcore.NewCore(jsonEncoder, zapcore.AddSync(file), zap.InfoLevel),
    )

    log = zap.New(core, zap.AddCaller())
}

// Info: usar em mensagens informativas 
func Info(message string, fields ...zap.Field) {
	log.Info(message, fields...)
}

// Warn: usar em coisas que merecem atenção, mas não são um erro fatal
func Warn(message string, fields ...zap.Field) {
	log.Warn(message, fields...)
}

// Error: usar quando a operação falhar, mas a aplicação continua a correr
func Error(message string, err error, fields ...zap.Field) {
	if err != nil {
		fields = append(fields, zap.Error(err))
	}
	log.Error(message, fields...)
}

// Fatal: aplicação parou de funcionar.
func Fatal(message string, err error, fields ...zap.Field) {
	if err != nil {
		fields = append(fields, zap.Error(err))
	}
	log.Fatal(message, fields...)
}

// limpar o buffer de logs
func Sync() {
	_ = log.Sync()
}