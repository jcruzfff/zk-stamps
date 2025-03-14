# zkStamps - Travel Verification & POAP Collection

zkStamp is a privacy-preserving, gamified POAP issuance system built using Self Protocol (for Zero-Knowledge Proofs) and Celo (for blockchain transactions). Users verify their identity and location via NFC passport scans + GPS to earn POAPs (Proof of Attendance Protocol tokens).

## 🚀 Features

- **Privacy-First Identity Verification**: Users scan their passports with the Self Protocol app to generate zero-knowledge proofs, sharing only what they choose to disclose.
- **Real Geolocation Verification**: Uses the browser's Geolocation API to determine the user's current country.
- **POAP Minting**: Generates unique digital collectibles (POAPs) for each verified country visit.
- **Interactive World Map**: Displays all collected POAPs on a world map, creating a digital passport of travels.
- **Celo Blockchain Integration**: POAPs are recorded on the Celo blockchain, providing verifiable proof of travel.

## 🧠 Technical Stack

### Frontend

- **React + Next.js**: For UI and server-side rendering
- **TailwindCSS**: For styling
- **RainbowKit**: For wallet connectivity
- **Wagmi**: For blockchain interaction
- **Self Protocol QR Code**: For passport verification

### Backend

- **Next.js API Routes**: For backend API endpoints
- **Self Protocol Backend Verifier**: For validating passport proofs
- **Geolocation API**: For determining user location

### Blockchain

- **Celo**: For storing POAP tokens and transactions
- **ERC-721**: For POAP NFT implementation (simulated in this demo)

## 📋 How It Works

1. **Connect Wallet**: User connects their cryptocurrency wallet via RainbowKit.
2. **Verify Identity**: User scans their passport using the Self app (by scanning the QR code).
3. **Share Selected Information**: User selects what passport information to disclose.
4. **Location Detection**: The app detects the user's current country via GPS.
5. **Travel Verification**: The backend verifies both the passport and location.
6. **POAP Minting**: A unique POAP is minted on the Celo blockchain for the visited country.
7. **Collection View**: User can view their collected POAPs on an interactive world map.

## 🔧 Setup & Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/stamper.git
cd stamper
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env.local` file with the following variables:

```
CELO_RPC_URL=https://forno.celo.org
SCOPE=stamper-travel-app
NEXT_PUBLIC_VERIFICATION_ENDPOINT=http://localhost:3000/api/verify
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Self Protocol App

To fully test the application, you need to download the Self Protocol app:

- [iOS App Store](https://apps.apple.com/app/self-protocol/id6449918648)
- [Google Play Store](https://play.google.com/store/apps/details?id=xyz.self.app)

## ⚠️ Demo Limitations

In this demo version:

- The passport scanning works with the actual Self Protocol app
- Real GPS coordinates are used, but blockchain transactions are simulated
- POAP minting is simulated rather than performed on-chain

## 📝 License

[MIT License](LICENSE)

## 🙏 Acknowledgements

- [Self Protocol](https://docs.self.xyz) for the identity verification infrastructure
- [Celo](https://celo.org) for the blockchain platform
- [RainbowKit](https://www.rainbowkit.com) for wallet connection
