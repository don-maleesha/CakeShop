# 🍰 CakeShop - Client Application

A modern, full-featured e-commerce platform for a cake shop built with React and Vite. This is the frontend client application that provides a beautiful, responsive interface for customers to browse, order, and customize cakes.

## ✨ Features

### Customer Features
- 🏠 **Browse Cakes** - Explore cakes by categories with advanced filtering and search
- 🛒 **Shopping Cart** - Add items to cart with size selection and real-time updates
- ❤️ **Wishlist** - Save favorite cakes for later
- 🎨 **Custom Orders** - Request personalized cakes with specific requirements
- 📦 **Order Tracking** - Track order status and delivery progress
- 💳 **Multiple Payment Methods** - Cash on Delivery, Online Transfer, PayHere integration
- 🚚 **Smart Delivery** - Zone-based delivery fees with express options
- ⭐ **Reviews & Ratings** - View and submit product reviews
- 👤 **User Accounts** - Register, login, and manage profile with remember me feature
- 🔔 **Toast Notifications** - Real-time feedback with professional notifications

### Admin Features
- 📊 **Analytics Dashboard** - Comprehensive sales and order analytics
- 📦 **Product Management** - Create, edit, and manage cake inventory
- 🏷️ **Category Management** - Organize products by categories
- 📋 **Order Management** - Process and update customer orders
- 🎨 **Custom Order Management** - Handle custom cake requests
- 📧 **Contact Management** - Manage customer inquiries
- ⭐ **Review Management** - Moderate customer reviews

## 🚀 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Payment Gateway**: PayHere (Sri Lanka)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:4000`

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Ensure the backend API is running on `http://localhost:4000`
   - Update API endpoints in code if using a different URL

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## 🎨 Color Theme

The application uses a consistent color scheme:
- **Primary Color**: `#F56565` (Red)
- **Secondary Color**: `#FBBF24` (Yellow)
- **Accent Color**: `#EF4444` (Red)

## 📁 Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── admin/          # Admin panel components
│   ├── assets/         # Images and static files
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context providers
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── tailwind.config.js  # Tailwind configuration
└── vite.config.js      # Vite configuration
```

## 🔑 Key Features Implementation

### Authentication
- JWT-based authentication with cookie storage
- Remember me functionality (localStorage/sessionStorage)
- Protected routes for admin and user areas
- Role-based access control

### Shopping Experience
- Real-time stock availability checks
- Low stock warnings and badges
- Size selection for applicable products
- Cart persistence across sessions

### Notifications
- Professional toast notifications
- Success, error, warning, and info messages
- Auto-dismiss with configurable duration
- Non-blocking user experience

### Payment Integration
- PayHere payment gateway (Sri Lanka)
- Cash on delivery option
- Online transfer support
- Payment status tracking

## 🌐 API Endpoints

The client connects to the backend API for:
- `/products` - Product catalog
- `/categories` - Product categories
- `/orders` - Order management
- `/custom-orders` - Custom cake requests
- `/auth` - Authentication
- `/wishlist` - Wishlist management
- `/reviews` - Product reviews
- `/payment` - Payment processing

## 🚨 Environment Variables

While this project doesn't use `.env` for the client, you may need to configure:
- API base URL (currently hardcoded to `http://localhost:4000`)
- PayHere merchant ID and credentials (in PayHereForm component)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👨‍💻 Development Notes

- Uses React Fast Refresh for instant updates during development
- ESLint configured for code quality
- Tailwind CSS for rapid UI development
- Context API for state management (no external state library needed)

## 🐛 Known Issues

None currently reported.

## 📞 Support

For support, email support@cakeshop.com or create an issue in the repository.

---

Made with ❤️ using React + Vite
