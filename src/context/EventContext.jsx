import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const EventContext = createContext();

// Helper for safe parsing from localStorage
const safeParse = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed;
    } catch (error) {
        console.error("Error parsing localStorage key:", key, error);
        return fallback;
    }
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEvents = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
    const [agenda, setAgenda] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [eventMenus, setEventMenus] = useState([]);
    const [venueExpenses, setVenueExpenses] = useState(() => safeParse('manalu_venue_expenses', []));
    const [eventInventory, setEventInventory] = useState([]); // Cloud sync version
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        localStorage.setItem('manalu_venue_expenses', JSON.stringify(venueExpenses));
    }, [venueExpenses]);



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

                        let parsedExpenses = [];
                        try {
                            parsedExpenses = typeof a.event_expenses === 'string' ? JSON.parse(a.event_expenses) : (a.event_expenses || []);
                        } catch (e) {
                            console.warn("Failed to parse event_expenses for event:", a.id, e);
                            parsedExpenses = [];
                        }

                        let parsedStaff = [];
                        try {
                            parsedStaff = typeof a.assigned_staff === 'string' ? JSON.parse(a.assigned_staff) : (a.assigned_staff || []);
                        } catch (e) {
                            console.warn("Failed to parse assigned_staff for event:", a.id, e);
                            parsedStaff = [];
                        }


                        return {
                            ...a,
                            tasks: parsedTasks,
                            selectedMenus: parsedMenus,
                            eventExpenses: parsedExpenses,
                            assignedStaff: parsedStaff,
                            isVenueOnly: a.is_venue_only || false,
                            venuePrice: a.venue_price || 0,
                            taxRate: a.tax_rate || 0.10,
                            hasVat: a.has_vat || false,
                            depositAmount: a.deposit_amount || 0,
                            depositStatus: a.deposit_status || 'pending',
                            clientNif: a.client_nif || '',
                            clientAddress: a.client_address || '',
                            invoiceNumber: a.invoice_number || null,
                            notes: a.notes || '',
                            isHourly: a.is_hourly || false,
                            rentHours: a.rent_hours || 0,
                            rentStartTime: a.rent_start_time || ''
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

                // Inventory for events sync
                const { data: invData, error: invError } = await supabase.from('event_inventory').select('*').order('category', { ascending: true });
                if (invError) {
                    console.warn("Event Inventory Fetch Error (might not exist yet):", invError);
                } else if (invData) {
                    setEventInventory(invData);
                }

            } catch (err) {
                console.error("Event Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };
        syncEvents();

        // Real-time subscription for reservations and inventory
        const resSubscription = supabase
            .channel('event-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                syncEvents();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_inventory' }, () => {
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
                invoice_number: event.invoiceNumber || null,
                notes: event.notes || '',
                is_hourly: event.isHourly || false,
                rent_hours: event.rentHours || 0,
                rent_start_time: event.rentStartTime || ''
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                setAgenda(prev => [...prev, {
                    ...event,
                    id: data[0].id,
                    created_at: data[0].created_at,
                    tasks: event.tasks || [],
                    selectedMenus: event.selectedMenus || [],
                    eventExpenses: event.eventExpenses || [],
                    assignedStaff: event.assignedStaff || []
                }]);
            }
        } catch (err) {
            console.error("Error adding event:", err);
            alert("Error al añadir evento: " + (err.message || "Error desconocido"));
        }
    };

    const updateEvent = async (eventId, updates) => {
        try {
            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.date !== undefined) dbUpdates.date = updates.date;
            if (updates.guests !== undefined) dbUpdates.guests = updates.guests;
            if (updates.menuId !== undefined) dbUpdates.menu_id = updates.menuId;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.total !== undefined) dbUpdates.total = updates.total;
            if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks;
            if (updates.selectedMenus !== undefined) dbUpdates.selected_menus = updates.selectedMenus;
            if (updates.isVenueOnly !== undefined) dbUpdates.is_venue_only = updates.isVenueOnly;
            if (updates.venuePrice !== undefined) dbUpdates.venue_price = updates.venuePrice;
            if (updates.taxRate !== undefined) dbUpdates.tax_rate = updates.taxRate;
            if (updates.hasVat !== undefined) dbUpdates.has_vat = updates.hasVat;
            if (updates.depositAmount !== undefined) dbUpdates.deposit_amount = updates.depositAmount;
            if (updates.depositStatus !== undefined) dbUpdates.deposit_status = updates.depositStatus;
            if (updates.clientNif !== undefined) dbUpdates.client_nif = updates.clientNif;
            if (updates.clientAddress !== undefined) dbUpdates.client_address = updates.clientAddress;
            if (updates.invoiceNumber !== undefined) dbUpdates.invoice_number = updates.invoiceNumber;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.isHourly !== undefined) dbUpdates.is_hourly = updates.isHourly;
            if (updates.rentHours !== undefined) dbUpdates.rent_hours = updates.rentHours;
            if (updates.rentStartTime !== undefined) dbUpdates.rent_start_time = updates.rentStartTime;

            const { data, error } = await supabase.from('agenda').update(dbUpdates).eq('id', eventId).select();

            if (error) throw error;
            if (data && data[0]) {
                setAgenda(prev => prev.map(ev => ev.id === eventId ? {
                    ...ev,
                    ...updates,
                    tasks: updates.tasks !== undefined ? updates.tasks : ev.tasks,
                    selectedMenus: updates.selectedMenus !== undefined ? updates.selectedMenus : ev.selectedMenus,
                    eventExpenses: ev.eventExpenses,
                    assignedStaff: ev.assignedStaff
                } : ev));
            }
        } catch (err) {
            console.error("Error updating event:", err);
            alert("Error al actualizar evento: " + (err.message || "Error desconocido"));
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

    const updateEventExpenses = async (eventId, expensesArray) => {
        try {
            const { error } = await supabase.from('agenda').update({ event_expenses: expensesArray }).eq('id', eventId);
            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, eventExpenses: expensesArray } : ev));
        } catch (err) {
            console.error("Error updating event expenses:", err);
            alert("Error al guardar gasto del evento: " + (err.message || "Error desconocido"));
        }
    };

    const updateEventStaff = async (eventId, staffArray) => {
        try {
            const { error } = await supabase.from('agenda').update({ assigned_staff: staffArray }).eq('id', eventId);
            if (error) throw error;
            setAgenda(prev => prev.map(ev => ev.id === eventId ? { ...ev, assignedStaff: staffArray } : ev));
        } catch (err) {
            console.error("Error updating assigned staff:", err);
            alert("Error al actualizar personal asignado: " + (err.message || "Error desconocido"));
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

    const addVenueExpense = (expense) => {
        const newExpense = { ...expense, id: `venue-exp-${Date.now()}`, date: expense.date || new Date().toISOString() };
        setVenueExpenses(prev => [newExpense, ...prev]);
    };

    const updateVenueExpense = (id, updatedExpense) => {
        setVenueExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updatedExpense } : exp));
    };

    const deleteVenueExpense = (id) => {
        setVenueExpenses(prev => prev.filter(exp => exp.id !== id));
    };

    // --- Funciones para Inventario de Eventos (Supabase Sync) ---
    const addInventoryItem = async (item) => {
        try {
            const { data, error } = await supabase.from('event_inventory').insert([{
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                notes: item.notes || ''
            }]).select();

            if (error) throw error;
            if (data && data[0]) {
                setEventInventory(prev => [...prev, data[0]].sort((a, b) => a.category.localeCompare(b.category)));
            }
        } catch (err) {
            console.error("Error adding inventory item:", err);
        }
    };

    const updateInventoryItem = async (id, updatedItem) => {
        try {
            const { error } = await supabase.from('event_inventory').update({
                name: updatedItem.name,
                category: updatedItem.category,
                quantity: updatedItem.quantity,
                notes: updatedItem.notes
            }).eq('id', id);

            if (error) throw error;
            setEventInventory(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
        } catch (err) {
            console.error("Error updating inventory item:", err);
        }
    };

    const deleteInventoryItem = async (id) => {
        try {
            const { error } = await supabase.from('event_inventory').delete().eq('id', id);
            if (error) throw error;
            setEventInventory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Error deleting inventory item:", err);
        }
    };

    return (
        <EventContext.Provider value={{
            agenda,
            reservations,
            eventMenus,
            venueExpenses,
            eventInventory, // Exportar estado
            loading,
            addEvent,
            updateEvent,
            updateEventStatus,
            updateEventDepositStatus,
            assignInvoiceNumber,
            toggleTask,
            updateEventExpenses,
            updateEventStaff,
            deleteEvent,
            addReservation,
            updateReservation,
            deleteReservation,
            addMenu,
            updateMenu,
            deleteMenu,
            addVenueExpense,
            updateVenueExpense,
            deleteVenueExpense,
            addInventoryItem,     // Exportar funciones
            updateInventoryItem,
            deleteInventoryItem
        }}>
            {children}
        </EventContext.Provider>
    );
};
