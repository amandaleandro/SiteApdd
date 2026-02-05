# APDD Dev Consulting

![APDD Logo](Public/images/2025_APDD_LOGO_COLOR__ALTA_PNG.png)

Site institucional da **APDD Dev Consulting** - Consultoria estratégica em desenvolvimento de sistemas.

## 🚀 Sobre o Projeto

Transforme ideias em sistemas escaláveis, seguros e prontos para crescer. A APDD oferece consultoria especializada em:

- 🏗️ **Arquitetura de Software**
- ☁️ **Cloud Computing**
- 👥 **Squads Dedicadas**
- 🔄 **Modernização de Sistemas**

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Containerização**: Docker + Docker Compose

## 📋 Pré-requisitos

- Node.js 14+
- PostgreSQL 12+
- Docker e Docker Compose (opcional)

## 🔧 Instalação

### Usando Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/amandaleandro/SiteApdd.git
cd SiteApdd

# Inicie os containers
docker-compose up -d
```

O site estará disponível em `http://localhost:3000`

### Instalação Manual

```bash
# Clone o repositório
git clone https://github.com/amandaleandro/SiteApdd.git
cd SiteApdd

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o servidor
npm start
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
DATABASE_URL=postgres://apdd:apdd@localhost:5432/apdd
ADMIN_USER=admin
ADMIN_PASS=sua_senha_segura
```

## 🗄️ Banco de Dados

O script de inicialização do banco está em `db/init.sql`. Ele será executado automaticamente ao usar Docker Compose.

Para instalação manual, execute:

```bash
psql -U postgres -f db/init.sql
```

## 📁 Estrutura do Projeto

```
APDD/
├── server.js              # Servidor Express
├── package.json           # Dependências
├── docker-compose.yml     # Configuração Docker
├── db/
│   └── init.sql          # Script de inicialização do BD
└── Public/
    ├── images/           # Imagens do site
    └── Page/
        ├── index.html    # Página principal
        ├── admin.html    # Painel administrativo
        ├── post.html     # Página de posts
        └── ...           # CSS e JS
```

## 🔐 Painel Administrativo

Acesse o painel em `/admin.html` para gerenciar o conteúdo do site.

Credenciais padrão (altere em produção):
- Usuário: `admin`
- Senha: Definida em `.env`

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor
- `docker-compose up` - Inicia todos os serviços
- `docker-compose down` - Para todos os serviços

## 🌐 Deploy

O projeto está configurado para deploy em:
- Heroku
- AWS
- Google Cloud
- DigitalOcean
- Qualquer plataforma que suporte Node.js e PostgreSQL

## 📄 Licença

Este projeto é propriedade da APDD Dev Consulting.

## 📞 Contato

- **Website**: [apdd.com.br](https://apdd.com.br)
- **GitHub**: [@amandaleandro](https://github.com/amandaleandro)

---

Desenvolvido com ❤️ pela APDD Dev Consulting
