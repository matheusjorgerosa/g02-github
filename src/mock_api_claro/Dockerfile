# Imagem base oficial do Python
FROM python:3.11-slim

# Evita gerar arquivos .pyc e força logs sem buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências do sistema (se precisar compilar libs)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia primeiro o requirements para aproveitar cache
COPY requirements.txt .

# Instala dependências
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copia o restante do código
COPY . .

# Expõe a porta padrão do uvicorn
EXPOSE 8000

# Comando para rodar a aplicação
# Supondo que seu arquivo principal seja main.py
# e tenha: app = FastAPI()
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]