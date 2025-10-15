# EventForge Inventory MVP

Modern event inventory management system with AI-ready MCP (Model Context Protocol) integration. Built with Next.js 15, Fastify, Neon PostgreSQL, and Neon Auth.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (ideally 22+)
- npm 10+
- Neon database account (free tier available)
- Stack Auth account (for Neon Auth - free)

### Installation

1. **Clone and Install Dependencies**

```bash
cd event-inventory
npm install
cd backend && npm install
cd ../app && npm install
cd ..
```

2. **Set Up Neon Database**

The database is already created via Neon MCP:

- Project ID: `plain-glitter-25894813`
- Database: `neondb`
- Connection string is in `env.template`

3. **Set Up Neon Auth (Stack Auth)**

Get your Stack Auth credentials from https://app.stack-auth.com

Update `.env.local` in the `app/` directory with:

```
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_client_key
STACK_SECRET_SERVER_KEY=your_secret_key
```

4. **Run Database Migrations**

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

5. **Start Development Servers**

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend
cd app
npm run dev
```

Visit:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

## 📁 Project Structure

```
event-inventory/
├── prisma/
│   ├── schema.prisma          # Database schema with pgvector
│   └── seed.ts                 # Sample data seeder
├── backend/                    # Fastify API server
│   ├── src/
│   │   ├── server.ts          # Main server setup
│   │   ├── routes/v1/         # API route handlers
│   │   │   ├── items.routes.ts      # Items CRUD
│   │   │   ├── audit.routes.ts      # Audit logs
│   │   │   ├── apiKeys.routes.ts    # API key management
│   │   │   └── mcp.routes.ts        # MCP server (AI integration)
│   │   ├── middleware/        # Auth & security
│   │   └── config/            # Configuration files
│   └── package.json
├── app/                        # Next.js 15 frontend
│   ├── app/                   # App router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Main dashboard
│   │   ├── items/             # Items management
│   │   ├── audits/            # Audit logs
│   │   └── settings/          # Settings & API keys
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   └── StatsCard.tsx      # Dashboard stats
│   ├── hooks/                 # React Query hooks
│   │   ├── useItems.ts        # Items data fetching
│   │   └── useAudits.ts       # Audits data fetching
│   ├── lib/
│   │   └── api.ts             # API client
│   └── package.json
└── docs/
    └── MCP_GUIDE.md           # MCP integration guide
```

## 🔥 Key Features

### ✅ MVP Features (Implemented)

- **User Authentication**: Powered by Neon Auth (Stack Auth)
- **Inventory Management**: Full CRUD for items with categories
- **Audit Logging**: Track discrepancies and maintain audit trails
- **Dashboard**: Real-time stats and recent activity
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **MCP Server**: JSON-RPC 2.0 server for AI assistant integration

### 🎨 2025 UX Features (New!)

- **Dark Mode**: System preference detection + manual toggle (Light/Dark/System)
- **Loading Skeletons**: Smooth loading states for all data views
- **Accessibility**: WCAG 2.2 AA compliant with keyboard navigation
- **Mobile-First**: Responsive design with touch-friendly UI (44px+ targets)
- **Confirmation Dialogs**: Prevent accidental destructive actions
- **Empty States**: Helpful CTAs when no data exists
- **Performance**: Optimized rendering and perceived performance
- **Reduced Motion**: Respects user accessibility preferences

See [UX_IMPROVEMENTS_2025.md](./docs/UX_IMPROVEMENTS_2025.md) for detailed implementation guide.

### 🔮 AI-Ready Architecture (Future)

- **Model Context Protocol**: Connect Claude or ChatGPT to query inventory
- **Vector Search**: pgvector extension enabled for semantic search
- **OpenAI Integration**: Ready for agent swarm implementation
- **Context Tracking**: contextId fields for MCP session management

## 🤖 MCP Integration

EventForge Inventory includes a full **Model Context Protocol (MCP)** server that allows AI assistants like Claude Desktop to directly interact with your inventory.

### Quick MCP Setup

1. **Generate an API Key**:

   - Go to Settings → API Keys in the web interface
   - Click "Generate New Key"
   - Copy and save the key securely

2. **Connect Claude Desktop**:

   - Open Claude Desktop
   - Go to Settings → Add Custom Connector
   - Enter:
     - **Name**: EventForge Inventory
     - **Remote MCP server URL**: `http://localhost:3001/mcp`
     - **API Key Header**: `x-api-key`
     - **API Key**: [Your generated key]
   - Click "Add"

3. **Test in Claude**:
   ```
   "List all furniture items in my inventory"
   "Create an audit log for item XYZ with actual quantity 45"
   "Show me inventory statistics"
   ```

See [MCP_GUIDE.md](./docs/MCP_GUIDE.md) for detailed integration examples.

## 📡 API Reference

### Base URL

- Development: `http://localhost:3001/api/v1`
- Production: `https://your-domain.com/api/v1`

### Authentication

**For Web Users** (Neon Auth JWT):

```bash
Authorization: Bearer <jwt_token>
```

**For AI/MCP Access** (API Key):

```bash
x-api-key: <your_api_key>
```

### Main Endpoints

#### Items

- `GET /items` - List items (supports pagination, search, filters)
- `GET /items/:id` - Get single item
- `POST /items` - Create item (auth required)
- `PUT /items/:id` - Update item (auth required)
- `DELETE /items/:id` - Delete item (auth required)

#### Audits

- `GET /audits` - List audit logs
- `POST /audits` - Create audit (auth required)
- `GET /audits/stats` - Get audit statistics

#### API Keys

- `GET /api-keys` - List your API keys (auth required)
- `POST /api-keys` - Generate new key (auth required)
- `DELETE /api-keys/:id` - Revoke key (auth required)

#### MCP (AI Integration)

- `POST /mcp` - JSON-RPC 2.0 endpoint for AI assistants

Full API documentation: http://localhost:3001/docs

## 🏗️ Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **shadcn/ui**: Beautiful, accessible UI components
- **Tailwind CSS**: Utility-first styling
- **Tanstack Query**: Data fetching and caching
- **Neon Auth**: Authentication via Stack Auth

### Backend

- **Fastify**: Fast, low-overhead Node.js framework
- **TypeScript**: Full type safety
- **Prisma**: Modern ORM with migrations
- **OpenAPI/Swagger**: Auto-generated API docs
- **Zod**: Runtime validation

### Database

- **Neon PostgreSQL 17**: Serverless Postgres
- **pgvector**: Vector embeddings (ready for AI features)
- **Prisma Migrations**: Version-controlled schema

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd app
vercel
```

Set environment variables in Vercel dashboard:

- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`
- `NEXT_PUBLIC_API_URL`

### Backend (Railway/Render)

```bash
cd backend
# Deploy to your preferred platform
```

Set environment variables:

- `DATABASE_URL` (from Neon dashboard)
- `API_KEY_SECRET`
- `PORT`

## 🔐 Security

- **Authentication**: Neon Auth (Stack Auth) with JWT tokens
- **API Keys**: Bcrypt-hashed keys for AI/MCP access
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configurable origins
- **Helmet**: Security headers

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd app
npm test
```

## 📊 Database Schema

### Key Models

**Item**: Core inventory item

- id, name, category, quantity, location
- description, lastAudit timestamp
- vectorDesc (for future AI features)

**AuditLog**: Audit trail

- itemId, actualQuantity, expectedQuantity, discrepancy
- notes, timestamp, createdBy
- contextId (for MCP session tracking)

**ApiKey**: AI/MCP authentication

- name, keyHash, userId
- lastUsed, expiresAt, isActive

**DatabaseChangeLog**: Schema change tracking

- operation, description, metadata
- Track all migrations and seeds

## 🎯 Future Enhancements

### Post-MVP Features

1. **OpenAI Agent Swarm**:

   - DataFetcher, Auditor, Forecaster, Reporter agents
   - Automated inventory analysis
   - Predictive restocking

2. **Vector Search**:

   - Semantic item search
   - Similar item recommendations
   - Natural language queries

3. **Real-time Updates**:

   - WebSocket support
   - Live inventory sync across users
   - Push notifications

4. **Advanced Features**:
   - Barcode/QR scanning
   - CSV import/export
   - Custom reports
   - Multi-location support

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Additional shadcn/ui components
- More comprehensive tests
- Performance optimizations
- Additional MCP tools

## 📄 License

MIT License - feel free to use this for your projects!

## 🆘 Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` in env.template matches your Neon database
- Run `npx prisma generate` if you get Prisma client errors

### Authentication Issues

- Ensure Stack Auth credentials are correct in `.env.local`
- Check that you've created a project at https://app.stack-auth.com

### MCP Connection Issues

- Verify backend is running on port 3001
- Check API key is valid and active
- Ensure CORS allows your origin

For more help, see [MCP_GUIDE.md](./docs/MCP_GUIDE.md) or open an issue.

---

**Built with ❤️ for the event management community**
