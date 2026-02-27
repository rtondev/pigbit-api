# Pigbit

Pigbit e uma aplicacao backend desenvolvida com Java 21 e Spring Boot, preparada para ambientes de desenvolvimento e producao usando profiles, variaveis de ambiente, Docker e Docker Compose.

---

## Tecnologias

- Java 21
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- Hibernate 6
- PostgreSQL
- HikariCP
- Flyway
- Redis
- Maven
- Docker e Docker Compose
- Lombok

---

## Estrutura do projeto

```text
pigbit/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── pom.xml
├── README.md
├── docs/
│   └── ANALISE_SISTEMA.md
├── src/
│   ├── main/
│   │   ├── java/com/pigbit/
│   │   │   ├── PigbitApplication.java
│   │   │   ├── application/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── exception/
│   │   │   │   └── webhook/
│   │   │   ├── core/
│   │   │   │   ├── model/
│   │   │   │   ├── service/
│   │   │   │   └── gateway/
│   │   │   └── infrastructure/
│   │   │       ├── config/
│   │   │       ├── email/
│   │   │       ├── integration/
│   │   │       ├── persistence/
│   │   │       ├── redis/
│   │   │       ├── security/
│   │   │       └── gateway/
│   │   └── resources/
│   │       ├── application.yaml
│   │       ├── application-dev.yaml
│   │       ├── application-prod.yaml
│   │       └── db/migration/
│   │           └── V1__initial_schema.sql
│   └── test/
```

---

## Pre-requisitos

### Desenvolvimento local
- Java 21
- Maven (ou ./mvnw)
- PostgreSQL
- Redis (recomendado; obrigatorio para fluxos de auth/rate limit)
- Docker (opcional)

### Producao
- Docker
- Docker Compose v2
- Banco de dados externo (PostgreSQL)
- Redis externo (recomendado)

---

## Variaveis de ambiente

O projeto nao possui credenciais hardcoded. Todas as configuracoes sensiveis sao feitas via variaveis de ambiente.

### .env.example (resumo)

```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
TZ=America/Sao_Paulo
JAVA_OPTS=-Xms256m -Xmx512m

DB_HOST=localhost
DB_PORT=5432
DB_PORT_EXPOSE=5434
DB_NAME=pigbit
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL_MODE=disable

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PORT_EXPOSE=6379
REDIS_PASSWORD=
REDIS_TIMEOUT=2000

MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=no-reply@pigbit.local
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true

JWT_SECRET=
JWT_EXP_MINUTES=1440
CNPJ_API_URL=https://receitaws.com.br/v1/cnpj
NOWPAYMENTS_BASE_URL=https://api.nowpayments.io
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
WITHDRAWAL_ALERT_THRESHOLD_PERCENT=200
```

Copie para `.env` e ajuste conforme necessario:

```bash
cp .env.example .env
```

---

## Configuracao dos profiles

### application.yaml (base)

- Mail, Redis, JWT, NowPayments, CNPJ e actuator
- Import opcional de `.env.properties`

### application-dev.yaml (desenvolvimento)

- Postgres local
- ddl-auto=update
- logs SQL habilitados
- Flyway habilitado

### application-prod.yaml (producao)

- Postgres externo
- ddl-auto=validate
- Flyway habilitado
- SSL opcional via DB_SSL_MODE

---

## Como rodar

### 1) Local sem Docker

Crie o banco:

```sql
CREATE DATABASE pigbit;
```

Suba a aplicacao:

```bash
export SPRING_PROFILES_ACTIVE=dev
./mvnw spring-boot:run
```

Acesse:

```
http://localhost:8080
```

---

### 2) Local com Docker (dev)

Suba app + Postgres + Redis:

```bash
docker compose -f docker-compose.dev.yml --env-file .env up -d
```

---

### 3) Subir apenas a infra (db + redis)

```bash
docker compose -f docker-compose.dev.yml --env-file .env up -d db redis
```

Depois rode a app no host:

```bash
./mvnw spring-boot:run
```

---

## Producao com Docker

### Build da imagem

```bash
docker build -t pigbit/api:1.0.0 .
```

### Subir em producao

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

Se quiser subir Redis junto:

```bash
docker compose -f docker-compose.prod.yml --env-file .env --profile infra up -d
```

---

## Swagger

- UI: `/swagger`
- OpenAPI: `/v3/api-docs`

---

## Testes

```bash
./mvnw test
```

---

## Boas praticas adotadas

- Profiles separados (dev / prod)
- Variaveis de ambiente
- Docker multi-stage
- Flyway
- Soft delete via `deleted_at`
- Sem credenciais hardcoded
