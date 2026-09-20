import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Toast from './components/Toast.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Category from './pages/Category.jsx'
import Product from './pages/Product.jsx'
import Search from './pages/Search.jsx'
import About from './pages/About.jsx'
import Login from './pages/Login.jsx'
import Checkout from './pages/Checkout.jsx'
import PaymentSimulator from './pages/PaymentSimulator.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Account from './pages/Account.jsx'
import AccountAddresses from './pages/AccountAddresses.jsx'
import AccountPayments from './pages/AccountPayments.jsx'
import AccountReminders from './pages/AccountReminders.jsx'
import AccountOrders from './pages/AccountOrders.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />

            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/payment" element={<PaymentSimulator />} />
            {/* /order is the prerendered shell that Vercel rewrites every
                /order/<id> request to; the id is read from the live URL. */}
            <Route path="/order" element={<OrderConfirmation />} />
            <Route path="/order/:orderId" element={<OrderConfirmation />} />

            <Route path="/account" element={<Account />} />
            <Route path="/account/addresses" element={<AccountAddresses />} />
            <Route path="/account/payments" element={<AccountPayments />} />
            <Route path="/account/reminders" element={<AccountReminders />} />
            <Route path="/account/orders" element={<AccountOrders />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <Toast />
      </CartProvider>
    </AuthProvider>
  )
}
