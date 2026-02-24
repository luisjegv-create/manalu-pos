import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const EventContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useEvents = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
    const [agenda, setAgenda] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [eventMenus, setEventMenus] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncEvents = async () => {
            setLoading(true);
            try {
                const { data: agendaData, error: agendaError } = await supabase.from('agenda').select('*').order('date', { ascending: true });
                if (agendaError) console.error("Agenda Fetch Error:", agendaError);

                if (agendaData) {
                    setAgenda(agendaData.map(a => {
                        let parsedTasks = [];
                        try {
                            parsedTasks = typeof a.tasks === 'string' ? JSON.parse(a.tasks) : (a.tasks || []);
                        } catch (e) {
                            console.warn("Failed to parse tasks for event:", a.id, e);
                            parsedTasks = [];
                        }

                        let parsedMenus = [];
                        try {
                            parsedMenus = typeof a.selected_menus === 'string'
                                ? JSON.parse(a.selected_menus)
                                : (a.selected_menus || (a.menu_id ? [{ menuId: a.menu_id, quantity: a.guests || 0 }] : []));
                        } catch (e) {
                            console.warn("Failed to parse menus for event:", a.id, e);
                            parsedMenus = a.menu_id ? [{ menuId: a.menu_id, quantity: a.guests || 0 }] : [];
                        }

                        return {
                            ...a,
                            tasks: parsedTasks,
                            selectedMenus: parsedMenus
                        };
                    }));
                }

                const { data: menuData, error: menuError } = await supabase.from('event_menus').select('*');
                if (menuError) console.error("Menu Fetch Error:", menuError);

                if (menuData) {
                    setEventMenus(menuData.map(m => {
                        let items = [];
                        try {
                            items = typeof m.items === 'string' ? JSON.parse(m.items) : (m.items || []);
                        } catch (e) {
                            console.warn("Failed to parse items for menu:", m.id, e);
                        }
                        return { ...m, items };
                    }));
                }

                // Note: reservations table not yet created in sql script, using local for now or assume it exists
                const savedRes = localStorage.getItem('manalu_reservations');
                let parsedRes = [];
                try {
                    parsedRes = savedRes ? JSON.parse(savedRes) : [];
                } catch (e) {
                    console.error("Error parsing reservations:", e);
                }
                setReservations(parsedRes);

            } catch (err) {
                console.error("Event Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };
        syncEvents();
    }, []);

    const addEvent = async (event) => {
        try {
            const { data, error } = await supabase.from('agenda').insert([{
                name: event.name,
                date: event.date,
                guests: event.guests,
                menu_id: event.menuId,
                status: event.status || 'draft',
                total: event.total,
                tasks: event.tasks || [],
                selected_menus: event.selectedMenus || []
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                setAgenda(prev => [...prev, {
                    ...data[0],
                    tasks: event.tasks || [],
                    selectedMenus: event.selectedMenus || []
                }]);
            }
        } catch (err) {
            console.error("Error adding event:", err);
            alert("Error al añadir evento: " + (err.message || "Error desconocido"));
        }
    };

    const addReservation = (res) => {
        setReservations(prev => {
            const next = [...prev, {
                ...res,
                id: Date.now().toString(),
                status: res.status || 'confirmado',
                tags: res.tags || [],
                createdAt: new Date().toISOString()
            }];
            localStorage.setItem('manalu_reservations', JSON.stringify(next));
            return next;
        });
    };

    const updateReservation = (resId, updates) => {
        setReservations(prev => {
            const next = prev.map(r => r.id === resId ? { ...r, ...updates } : r);
            localStorage.setItem('manalu_reservations', JSON.stringify(next));
            return next;
        });
    };

    const deleteReservation = (resId) => {
        setReservations(prev => {
            const next = prev.filter(r => r.id !== resId);
            localStorage.setItem('manalu_reservations', JSON.stringify(next));
            return next;
        });
    };

    const updateEventStatus = async (eventId, newStatus) => {
        try {
            const { error } = await supabase.from('agenda').update({ status: newStatus }).eq('id', eventId);
            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
        } catch (err) {
            console.error("Error updating event status:", err);
        }
    };

    const toggleTask = async (eventId, taskId) => {
        const event = agenda.find(e => e.id === eventId);
        if (!event) return;

        const updatedTasks = event.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);

        try {
            const { error } = await supabase.from('agenda').update({ tasks: updatedTasks }).eq('id', eventId);
            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, tasks: updatedTasks } : ev));
        } catch (err) {
            console.error("Error toggling task:", err);
            alert("Error al actualizar tarea: " + (err.message || "Error desconocido"));
        }
    };

    const deleteEvent = async (eventId) => {
        try {
            const { error } = await supabase.from('agenda').delete().eq('id', eventId);
            if (error) throw error;
            setAgenda(prev => prev.filter(ev => ev.id !== eventId));
        } catch (err) {
            console.error("Error deleting event:", err);
            alert("Error al borrar evento: " + (err.message || "Error desconocido"));
        }
    };

    const addMenu = async (menu) => {
        try {
            const { data, error } = await supabase.from('event_menus').insert([{
                name: menu.name,
                price: menu.price,
                items: menu.items || []
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                setEventMenus(prev => [...prev, {
                    ...data[0],
                    items: menu.items || []
                }]);
            }
        } catch (err) {
            console.error("Error adding menu:", err);
            alert("Error al añadir menú: " + (err.message || "Error desconocido"));
        }
    };

    const updateMenu = async (menuId, menu) => {
        try {
            const { error } = await supabase.from('event_menus').update({
                name: menu.name,
                price: menu.price,
                items: menu.items || []
            }).eq('id', menuId);

            if (error) throw error;
            setEventMenus(prev => prev.map(m => m.id === menuId ? { ...m, ...menu } : m));
        } catch (err) {
            console.error("Error updating menu:", err);
            alert("Error al actualizar menú: " + (err.message || "Error desconocido"));
        }
    };

    const deleteMenu = async (menuId) => {
        try {
            const { error } = await supabase.from('event_menus').delete().eq('id', menuId);
            if (error) throw error;
            setEventMenus(prev => prev.filter(m => m.id !== menuId));
        } catch (err) {
            console.error("Error deleting menu:", err);
            alert("Error al borrar menú: " + (err.message || "Error desconocido"));
        }
    };

    return (
        <EventContext.Provider value={{
            agenda,
            reservations,
            eventMenus,
            loading,
            addEvent,
            updateEventStatus,
            toggleTask,
            deleteEvent,
            addReservation,
            updateReservation,
            deleteReservation,
            addMenu,
            updateMenu,
            deleteMenu
        }}>
            {children}
        </EventContext.Provider>
    );
};
