
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from './components/Footer.jsx';
import CartSidebar from './components/CartSidebar.jsx';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <CartSidebar />
        </div>
    );
}
