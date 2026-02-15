import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import { OrderProvider } from './context/OrderContext';
import { CustomerProvider } from './context/CustomerContext';
import { EventProvider } from './context/EventContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import BarTapas from './pages/BarTapas';
import KitchenDisplay from './pages/KitchenDisplay';
import TableSelection from './pages/TableSelection';
import ManaluEventos from './pages/ManaluEventos';
import Analytics from './pages/Analytics';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import Bodega from './pages/Bodega';
import Manual from './pages/Manual';
import Staff from './pages/Staff';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import QRMenu from './pages/QRMenu';
import Bookings from './pages/Bookings';

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <CustomerProvider>
          <EventProvider>
            <OrderProvider>
              <Router>
                <div className="app-container">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tables" element={<TableSelection />} />
                    <Route path="/bar-tapas" element={<BarTapas />} />
                    <Route path="/manalu-eventos" element={<ManaluEventos />} />
                    <Route path="/kds" element={<KitchenDisplay />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/bodega" element={<Bodega />} />
                    <Route path="/manual" element={<Manual />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/menu" element={<QRMenu />} />
                    <Route path="/bookings" element={<Bookings />} />
                  </Routes>
                </div>
              </Router>
            </OrderProvider>
          </EventProvider>
        </CustomerProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;
