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
                            selectedMenus: parsedMenus,
                            isVenueOnly: a.is_venue_only || false,
                            venuePrice: a.venue_price || 0,
                            taxRate: a.tax_rate || 0.10,
                            hasVat: a.has_vat || false,
                            depositAmount: a.deposit_amount || 0,
                            depositStatus: a.deposit_status || 'pending',
                            clientNif: a.client_nif || '',
                            clientAddress: a.client_address || '',
                            invoiceNumber: a.invoice_number || null
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

                // Note: reservations table cloud sync
                const { data: resData, error: resError } = await supabase.from('reservations').select('*').order('date', { ascending: true });
                if (resError) console.error("Reservations Fetch Error:", resError);
                if (resData) {
                    setReservations(resData.map(r => ({
                        ...r,
                        customerName: r.customer_name,
                        tableId: r.table_id,
                        createdAt: r.created_at,
                        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || [])
                    })));
                }

            } catch (err) {
                console.error("Event Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };
        syncEvents();

        // Real-time subscription for reservations
        const resSubscription = supabase
            .channel('reservations-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                syncEvents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(resSubscription);
        };
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
                selected_menus: event.selectedMenus || [],
                is_venue_only: event.isVenueOnly || false,
                venue_price: event.venuePrice || 0,
                tax_rate: event.taxRate || 0.10,
                has_vat: event.hasVat || false,
                deposit_amount: event.depositAmount || 0,
                deposit_status: event.depositStatus || 'pending',
                client_nif: event.clientNif || '',
                client_address: event.clientAddress || '',
                invoice_number: event.invoiceNumber || null
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

    const addReservation = async (res) => {
        try {
            const { data, error } = await supabase.from('reservations').insert([{
                customer_name: res.customerName,
                phone: res.phone,
                people: res.people,
                date: res.date,
                time: res.time,
                table_id: res.tableId,
                notes: res.notes,
                status: res.status || 'confirmado',
                tags: res.tags || []
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                const newRes = {
                    ...data[0],
                    customerName: data[0].customer_name,
                    tableId: data[0].table_id,
                    createdAt: data[0].created_at,
                    tags: data[0].tags || []
                };
                setReservations(prev => [...prev, newRes]);
            }
        } catch (err) {
            console.error("Error adding reservation:", err);
            alert("Error al añadir reserva: " + (err.message || "Error desconocido"));
        }
    };

    const updateReservation = async (resId, updates) => {
        try {
            // Map camelCase to snake_case for Supabase
            const dbUpdates = {};
            if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.people !== undefined) dbUpdates.people = updates.people;
            if (updates.date !== undefined) dbUpdates.date = updates.date;
            if (updates.time !== undefined) dbUpdates.time = updates.time;
            if (updates.tableId !== undefined) dbUpdates.table_id = updates.tableId;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

            const { error } = await supabase.from('reservations').update(dbUpdates).eq('id', resId);
            if (error) throw error;

            setReservations(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));
        } catch (err) {
            console.error("Error updating reservation:", err);
            alert("Error al actualizar reserva: " + (err.message || "Error desconocido"));
        }
    };

    const deleteReservation = async (resId) => {
        try {
            const { error } = await supabase.from('reservations').delete().eq('id', resId);
            if (error) throw error;
            setReservations(prev => prev.filter(r => r.id !== resId));
        } catch (err) {
            console.error("Error deleting reservation:", err);
            alert("Error al borrar reserva: " + (err.message || "Error desconocido"));
        }
    };

    const updateEventStatus = async (eventId, newStatus) => {
        try {
            const { error } = await supabase
                .from('agenda')
                .update({ status: newStatus })
                .eq('id', eventId);

            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
        } catch (error) {
            console.error('Error updating event status:', error);
            alert('Error al actualizar el estado del evento');
        }
    };

    const updateEventDepositStatus = async (eventId, newStatus) => {
        try {
            const { error } = await supabase
                .from('agenda')
                .update({ deposit_status: newStatus })
                .eq('id', eventId);

            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, depositStatus: newStatus } : ev));
        } catch (error) {
            console.error('Error updating deposit status:', error);
            alert('Error al actualizar el estado de la fianza');
        }
    };

    const assignInvoiceNumber = async (eventId, number) => {
        try {
            const { error } = await supabase
                .from('agenda')
                .update({
                    invoice_number: number,
                    is_invoiced: true
                })
                .eq('id', eventId);

            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, invoiceNumber: number, isInvoiced: true } : ev));
        } catch (error) {
            console.error('Error assigning invoice number:', error);
            alert('Error al asignar el número de factura');
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
            updateEventDepositStatus,
            assignInvoiceNumber,
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
