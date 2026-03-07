import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinLock from './PinLock';

const ProtectedRoute = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <PinLock />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
