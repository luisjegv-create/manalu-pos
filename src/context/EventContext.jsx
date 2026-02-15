import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useEvents = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
    const [agenda, setAgenda] = useState(() => {
        const saved = localStorage.getItem('manalu_agenda');
        return saved ? JSON.parse(saved) : [];
    });

    const [reservations, setReservations] = useState(() => {
        const saved = localStorage.getItem('manalu_reservations');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('manalu_agenda', JSON.stringify(agenda));
    }, [agenda]);

    useEffect(() => {
        localStorage.setItem('manalu_reservations', JSON.stringify(reservations));
    }, [reservations]);

    const addEvent = (event) => {
        setAgenda(prev => [...prev, { ...event, id: Date.now().toString() }]);
    };

    const addReservation = (res) => {
        setReservations(prev => [...prev, { ...res, id: Date.now().toString(), status: 'confirmed' }]);
    };

    const deleteReservation = (resId) => {
        setReservations(prev => prev.filter(r => r.id !== resId));
    };

    const updateEventStatus = (eventId, newStatus) => {
        setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
    };

    const toggleTask = (eventId, taskId) => {
        setAgenda(prev => prev.map(ev => {
            if (ev.id === eventId) {
                return {
                    ...ev,
                    tasks: ev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
                };
            }
            return ev;
        }));
    };

    const deleteEvent = (eventId) => {
        setAgenda(prev => prev.filter(ev => ev.id !== eventId));
    };

    return (
        <EventContext.Provider value={{
            agenda,
            reservations,
            addEvent,
            updateEventStatus,
            toggleTask,
            deleteEvent,
            addReservation,
            deleteReservation
        }}>
            {children}
        </EventContext.Provider>
    );
};
