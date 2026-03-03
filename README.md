# Restaurant POS Dashboard

A modern, fully responsive Restaurant Point of Sale (POS) and Management System built with React and Tailwind CSS.

## 🚀 Features

- **Billing Dashboard**: Manage table orders, add items, and process payments
- **Menu Management**: Add, edit, and organize menu categories and items
- **Parcel Orders**: Track and manage takeaway/delivery orders
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Dynamic order status tracking
- **Clean UI/UX**: Modern interface with intuitive navigation

## 📦 Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS** - Utility-first CSS Framework
- **React Router** - Client-side Routing
- **Lucide React** - Beautiful Icons

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
restaurant-dashboard/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Card, Modal)
│   │   └── layout/          # Layout components (Sidebar, Header, MainLayout)
│   ├── pages/               # Page components
│   │   ├── BillingDashboard.jsx
│   │   ├── MenuCategories.jsx
│   │   ├── MenuItems.jsx
│   │   ├── ParcelOrders.jsx
│   │   └── CreateParcelOrder.jsx
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles with Tailwind
├── public/                  # Static assets
├── index.html               # HTML template
└── package.json             # Dependencies and scripts
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Mobile devices (< 768px)
- Tablets (768px - 1024px)
- Desktop (> 1024px)

## 👨‍💻 Author

Built with ❤️ for modern restaurants

## 📄 License

MIT License
