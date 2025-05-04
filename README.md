<h1 align="center">API Shopper - Medição Inteligente</h1>
<p align="center"><i>Sistema de análise de medidores de água/gás com IA</i></p>

<p align="center">
  <a href="https://github.com/thiago92/shopper">
    <img src="https://img.shields.io/badge/Repositório-GitHub-blue?style=for-the-badge&logo=github" alt="GitHub Repo"/>
  </a>
</p>

<p align="center" display="inline-block">
  <img src="https://img.shields.io/badge/Node.js-18.x+-green?logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/Docker-20.x+-blue?logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Google_AI-Gemini-red?logo=google&logoColor=white" alt="Google Gemini"/>
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-success?logo=swagger&logoColor=white" alt="Swagger"/>
  <img src="https://img.shields.io/badge/License-ISC-lightgrey" alt="License"/>
</p>

## 🔍 Sobre o Projeto

API para análise automatizada de medidores utilizando inteligência artificial (Google Gemini) para extração de valores numéricos a partir de imagens.

[![GitHub Repo](https://img.shields.io/badge/ACESSAR-REPOSITÓRIO-blue?style=for-the-badge&logo=github)](https://github.com/thiago92/shopper)

### 🛠️ Tecnologias Utilizadas
- **Node.js** + **TypeScript**
- **Express** + **Swagger UI**
- **Google Gemini AI**
- **MySQL** + **Docker**
- **Jest** para testes

## 🚀 Começando

### 📋 Pré-requisitos
- Node.js 18+
- Docker 20+
- MySQL 8.0
- [Chave da API Gemini](https://ai.google.dev/)

### 🔌 Portas
- **API**: 80
- **MySQL**: 3306 (container)
- **Swagger UI**: 80/api-docs

### ⚙️ Instalação
```bash
# Clone o repositório
git clone https://github.com/thiago92/shopper.git
cd shopper

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite o .env com suas credenciais

### Execução 

#### Modo desenvolvimento
npm run dev

#### Produção
npm run build
npm start

#### Docker
npm run docker:up

#### Testes
npm test

## 🐳 Docker

```yaml
services:
  api:
    build: .
    ports: ["80:80"]  # Mapeia a porta 80 do host para a 80 do container
    env_file: .env
    depends_on:
      db:
        condition: service_healthy