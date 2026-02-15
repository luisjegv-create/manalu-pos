import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Helper for safe parsing
    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // 1. Employee List
    const [employees, setEmployees] = useState(() => {
        return safeParse('manalu_employees', [
            { id: 'admin', name: 'Admin', pin: '1234', role: 'admin' },
            { id: 'emp1', name: 'Camarero 1', pin: '0000', role: 'staff' }
        ]);
    });

    // 2. Shift Logs (Fichajes)
    const [shifts, setShifts] = useState(() => {
        return safeParse('manalu_shifts', []);
    });

    // 3. Current "Active" User (for the session)
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        localStorage.setItem('manalu_employees', JSON.stringify(employees));
    }, [employees]);

    useEffect(() => {
        localStorage.setItem('manalu_shifts', JSON.stringify(shifts));
    }, [shifts]);

    // --- Actions ---

    // Login for POS access (distinct from Clock In, but usually linked)
    const login = (pin) => {
        const employee = employees.find(e => e.pin === pin);
        if (employee) {
            setCurrentUser(employee);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    // Clock In (Entrada) - Starts a shift
    const clockIn = (pin) => {
        const employee = employees.find(e => e.pin === pin);
        if (!employee) return { success: false, message: 'PIN incorrecto' };

        // Check if already clocked in (open shift)
        const openShift = shifts.find(s => s.employeeId === employee.id && !s.endTime);
        if (openShift) return { success: false, message: `Ya tienes un turno abierto desde ${new Date(openShift.startTime).toLocaleTimeString()}` };

        const newShift = {
            id: `shift-${Date.now()}`,
            employeeId: employee.id,
            employeeName: employee.name,
            startTime: new Date().toISOString(),
            endTime: null
        };

        setShifts(prev => [newShift, ...prev]);
        // Auto-login on clock in? Yes, typically.
        setCurrentUser(employee);
        return { success: true, message: `Hola ${employee.name}, turno iniciado.` };
    };

    // Clock Out (Salida) - Ends a shift
    const clockOut = (pin) => {
        const employee = employees.find(e => e.pin === pin);
        if (!employee) return { success: false, message: 'PIN incorrecto' };

        const shiftIndex = shifts.findIndex(s => s.employeeId === employee.id && !s.endTime);
        if (shiftIndex === -1) return { success: false, message: 'No tienes turno abierto. ¡Ficha entrada primero!' };

        const updatedShifts = [...shifts];
        updatedShifts[shiftIndex].endTime = new Date().toISOString();
        setShifts(updatedShifts);

        if (currentUser?.id === employee.id) {
            setCurrentUser(null);
        }

        return { success: true, message: `Adiós ${employee.name}, turno cerrado.` };
    };

    // CRUD Employees
    const addEmployee = (data) => {
        const newEmp = { ...data, id: `emp-${Date.now()}` };
        setEmployees(prev => [...prev, newEmp]);
    };

    const updateEmployee = (id, data) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    };

    const deleteEmployee = (id) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
    };

    return (
        <AuthContext.Provider value={{
            employees,
            shifts,
            currentUser,
            login,
            logout,
            clockIn,
            clockOut,
            addEmployee,
            updateEmployee,
            deleteEmployee
        }}>
            {children}
        </AuthContext.Provider>
    );
};
