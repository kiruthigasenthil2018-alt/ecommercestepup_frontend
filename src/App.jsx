import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header, Footer } from "./components.jsx";
import { useApp } from "./context.jsx";
import Home from "./pages/Home.jsx";
import Listing from "./pages/Listing.jsx";
import Product from "./pages/Product.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Profile from "./pages/Profile.jsx";
import Courier from "./pages/Courier.jsx";
import Auth from "./pages/Auth.jsx";
import { Cart, Orders, TrackOrder } from "./pages/Orders.jsx";
import { Checkout, Payment, Success } from "./pages/Checkout.jsx";
import { About, Contact } from "./pages/Info.jsx";
import { Brands, Offers, Policy } from "./pages/More.jsx";

// Guests are sent to the Sign-up page, then returned to where they were going
const Private = ({ children }) => { const { user } = useApp(); const loc = useLocation(); return user ? children : <Navigate to="/signup" replace state={{ from: loc.pathname }} />; };

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [pathname]);
  return (<>
    <Header />
    <main><div className="page" key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop/:gender" element={<Listing />} />
        <Route path="/shop" element={<Listing />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/wishlist" element={<Private><Wishlist /></Private>} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Private><Checkout /></Private>} />
        <Route path="/payment" element={<Private><Payment /></Private>} />
        <Route path="/success/:number" element={<Private><Success /></Private>} />
        <Route path="/courier/:number" element={<Courier />} />
        <Route path="/profile" element={<Private><Profile /></Private>} />
        <Route path="/orders" element={<Private><Orders /></Private>} />
        <Route path="/orders/:number" element={<Private><TrackOrder /></Private>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policy/:slug" element={<Policy />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div></main>
    <Footer />
  </>);
}
