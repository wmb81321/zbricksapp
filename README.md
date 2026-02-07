# ZKBricks - Progressive Real Estate Auctions

A decentralized application for real estate auctions built with Circle's Programmable Wallets, Base Sepolia, and Next.js.

## 🌟 Features

- 🔐 **Google OAuth Login** - Sign in with Google, no crypto wallet needed
- 💰 **Circle Wallets** - Automatic USDC wallet creation
- 📈 **Progressive Auctions** - Property details revealed in phases
- 🏠 **NFT Properties** - House ownership as ERC-721 tokens
- ⛓️ **On-Chain** - All transactions on Base Sepolia testnet

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Blockchain**: Base Sepolia (Chain ID: 84532)
- **Wallets**: Circle Programmable Wallets Web SDK
- **Smart Contracts**: Solidity (AuctionManager, HouseNFT)
- **Storage**: Pinata IPFS for NFT metadata
- **Auth**: Google OAuth + Circle Social Login

## 📋 Prerequisites

1. **Node.js**: v18+ required
2. **Circle Account**: [console.circle.com](https://console.circle.com)
3. **Google OAuth**: [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
4. **Pinata Account**: [pinata.cloud](https://www.pinata.cloud/)
5. **Base Sepolia ETH**: For contract deployment

## 🚀 Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 📁 Project Structure

\`\`\`
app/
├── page.tsx                 # Landing page
├── auth/                    # Google + Circle login
├── auctions/               # Auction browsing/bidding
├── my-account/             # User wallet & balance
├── house/                  # NFT registry (admin)
├── admin/                  # Admin panel
└── api/endpoints/          # Backend Circle API

lib/
├── circle/                 # Circle SDK helpers
├── contracts/              # Smart contract hooks
└── ipfs/                   # Pinata upload utilities

deployments/
├── addresses.json          # Contract addresses
└── abi/                    # Contract ABIs
\`\`\`

## 🔑 Key Routes

- `/` - Home/Landing with intro
- `/auth` - Sign in with Google
- `/auctions` - Browse and bid on properties
- `/my-account` - View balance, send/receive USDC
- `/house` - Property NFT registry
- `/admin` - Create auctions (admin only)

## ⚙️ Environment Variables

See `.env.example` for all required variables. Key ones:

\`\`\`env
CIRCLE_API_KEY=              # Circle API key
NEXT_PUBLIC_CIRCLE_APP_ID=   # Circle app ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID= # Google OAuth
NEXT_PUBLIC_ADMIN_ADDRESS=   # Admin wallet (lowercase)
PINATA_JWT=                  # Pinata IPFS
\`\`\`

## 🎯 User Flow

1. **Sign In** → Google OAuth → Circle creates wallet automatically
2. **Get USDC** → Visit [Circle Faucet](https://faucet.circle.com/)
3. **Browse** → View available property auctions
4. **Bid** → Place bids with USDC
5. **Win** → Receive House NFT

## 👨‍💼 Admin Features

Admin address (set in `.env`) can:

- Create House NFTs with metadata
- Setup new auctions
- Manage progressive reveal phases

## 📚 Documentation

- **[INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md)** - Smart contract integration
- **[CONTRACT-REFERENCE.md](CONTRACT-REFERENCE.md)** - Contract documentation

## 🐛 Troubleshooting

**Device token error**: Verify `CIRCLE_API_KEY` is correct
**Wallet not loading**: Clear browser localStorage and re-login
**Transactions failing**: Ensure you have test USDC from faucet

## 📄 License

MIT

---

Built with ❤️ for ETH Denver 2026

- **[CONTRACT-REFERENCE.md](CONTRACT-REFERENCE.md)** - Detailed smart contract API documentation

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Smart Contract Integration

The frontend is integrated with deployed smart contracts on Base Sepolia:

- **AuctionManager**: `0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca`
- **HouseNFT**: `0x7ea51d8855ba98c6167f71d272813faba1244a0c`

### Quick Example

```typescript
import { getAuctionInfo, placeBid, formatUSDC } from "@/lib/contracts";

// Get current auction data
const auction = await getAuctionInfo();
console.log("Current bid:", formatUSDC(auction.currentHighBid));

// Place a bid (requires Circle wallet)
const userToken = localStorage.getItem("w3s_user_token");
const walletId = localStorage.getItem("w3s_wallet_id");
await placeBid(parseUSDC("100.00"), userToken!, walletId!);
```

See **[INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md)** for complete examples and usage instructions.

## Circle Setup

1. Copia `.env.example` a `.env.local`.
2. Completa las variables:
   - `NEXT_PUBLIC_APP_ID` (Circle Programmable Wallets App ID).
   - `API_KEY` (Circle API Key, server-only).
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Google OAuth Client ID).

### Google OAuth Setup

Para habilitar el login con Google, sigue estos pasos:

#### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Navega a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth 2.0 Client ID**
5. Configura la pantalla de consentimiento OAuth si no lo has hecho
6. Selecciona **Web application** como tipo de aplicación
7. Agrega los siguientes **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://tu-dominio-produccion.com
   ```
8. Agrega los siguientes **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth
   https://tu-dominio-produccion.com/auth
   ```
9. Copia el **Client ID** generado

#### 2. Configurar Circle Developer Console

1. Ve a [Circle Developer Console](https://console.circle.com/)
2. Navega a tu app de Programmable Wallets
3. En **Web3 Services** > **User Controlled Wallets**
4. Habilita **Social Login**
5. Selecciona **Google** como proveedor
6. Pega tu Google Client ID
7. Guarda los cambios

#### 3. Variables de Entorno

Agrega a tu `.env.local`:

```env
NEXT_PUBLIC_APP_ID=<Circle App ID>
API_KEY=<Circle API Key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
```

### Smart Contract Addresses (Base Sepolia)

```env
NEXT_PUBLIC_AUCTION_MANAGER=0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca
NEXT_PUBLIC_HOUSE_NFT=0x7ea51d8855ba98c6167f71d272813faba1244a0c
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_CHAIN_ID=84532
```

## Cómo correr local

1. Instala dependencias (`npm install`).
2. Configura las variables de entorno (ver **Circle Setup** arriba).
3. Levanta el servidor (`npm run dev`).
4. Abre `http://localhost:3000`.

## Probar la Subasta (Testnet)

### Paso 1: Autenticación
1. Ve a `/auth`
2. Haz clic en **Continue with Google**
3. Autoriza la aplicación
4. Se creará automáticamente una wallet programable
5. Se redirigirá a `/pujas`

### Paso 2: Obtener USDC de Prueba
1. Obtén ETH de prueba del [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Necesitarás USDC de prueba para pujar (minteable en testnet)

### Paso 3: Participar en la Subasta
1. En `/pujas`, verás la subasta activa
2. Revisa la fase actual (Teaser/Básico/Detallado/Final)
3. Haz clic en **Empezar a Pujar**
4. Ingresa el monto en USDC (mínimo: puja actual + 10%)
5. **Paso 1**: Aprobar USDC para el contrato
6. **Paso 2**: Colocar tu puja
7. Confirma ambas transacciones en el panel del SDK

### Paso 4: Ver Resultados
1. Si eres el líder, verás tu address en la sección de líder
2. Si alguien te supera, recibirás tu USDC de vuelta automáticamente
3. El historial de pujas se actualiza en tiempo real

## Troubleshooting

### Google Login
- **"Error: Invalid Google Client ID"**: Verifica que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` esté correctamente configurado en `.env.local`
- **"Redirect URI mismatch"**: Asegúrate de que el redirect URI esté agregado en Google Cloud Console
- **"Circle social login failed"**: Verifica que Google esté habilitado como proveedor en Circle Console

### Wallet & Transactions
- **"Wallet not found"**: Asegúrate de haber completado el login con Google
- **"Insufficient USDC balance"**: Necesitas USDC de prueba en tu wallet
- **"Bid too low"**: Tu puja debe ser al menos 10% mayor que la puja actual
- **"Transaction failed"**: Verifica que tengas ETH para gas en Base Sepolia

### Smart Contracts
- **"Contract not found"**: Verifica que los contratos estén desplegados en Base Sepolia (Chain ID: 84532)
- **"Function not found"**: Los ABIs están en `/deployments/abi/` - asegúrate de que coincidan con los contratos desplegados

## Documentación Adicional

- **[TEST-CHECKLIST.md](TEST-CHECKLIST.md)** - Lista completa de tests y validaciones
- **[CLEANUP-PLAN.md](CLEANUP-PLAN.md)** - Plan de limpieza del código ejecutado
- **[INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md)** - Guía de integración de contratos
- **[CONTRACT-REFERENCE.md](CONTRACT-REFERENCE.md)** - Referencia completa de contratos

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# zbricksapp
