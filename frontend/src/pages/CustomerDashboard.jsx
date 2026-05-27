import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cancelBooking, createBooking, createPaymentOrder, getAvailability, getCalendarBookings } from "../services/bookingsApi";

export default function CustomerDashboard() {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [roomType, setRoomType] = useState("Single Suite");
  const [message, setMessage] = useState("");
  const [paymentOrder, setPaymentOrder] = useState(null);

  const canQuery = Boolean(checkin && checkout);
  const availabilityQ = useQuery({
    queryKey: ["availability", checkin, checkout],
    queryFn: () => getAvailability(checkin, checkout),
    enabled: canQuery
  });

  const calendarQ = useQuery({
    queryKey: ["calendar-events"],
    queryFn: getCalendarBookings
  });

  const bookingM = useMutation({
    mutationFn: createBooking,
    onSuccess: data => setMessage(`Booked ${data.roomType} successfully. Booking ID: ${data.id}`),
    onError: err => setMessage(err.response?.data?.error || "Booking failed")
  });

  const paymentM = useMutation({
    mutationFn: createPaymentOrder,
    onSuccess: data => {
      setPaymentOrder(data);
      setMessage(`Payment order created (${data.provider}, ${data.mode}). Order: ${data.orderId}`);
    },
    onError: err => setMessage(err.response?.data?.error || "Payment order failed")
  });

  const cancelM = useMutation({
    mutationFn: cancelBooking,
    onSuccess: data => setMessage(`Cancelled booking ${data.id}. Refund amount: INR ${data.refundAmount || 0}`),
    onError: err => setMessage(err.response?.data?.error || "Cancellation failed")
  });

  const selectedPricing = useMemo(() => {
    const list = availabilityQ.data || [];
    return list.find(x => x.roomType === roomType);
  }, [availabilityQ.data, roomType]);

  return (
    <div className="container">
      <h2>Customer Smart Dashboard</h2>
      <div className="grid">
        <div className="card">
          <h3>Create Booking</h3>
          <input type="datetime-local" value={checkin} onChange={e => setCheckin(e.target.value)} />
          <input type="datetime-local" value={checkout} onChange={e => setCheckout(e.target.value)} />
          <select value={roomType} onChange={e => setRoomType(e.target.value)}>
            <option>Single Suite</option>
            <option>Executive Room</option>
            <option>Presidential Suite</option>
          </select>
          <p>Dynamic Price/Night: INR {selectedPricing?.pricePerNight ?? "N/A"}</p>
          <button
            onClick={() =>
              paymentM.mutate({
                roomType,
                checkin,
                checkout
              })
            }
            disabled={paymentM.isPending || !canQuery}
          >
            {paymentM.isPending ? "Creating Payment..." : "Create Payment Order"}
          </button>
          <button
            onClick={() =>
              bookingM.mutate({
                roomType,
                checkin,
                checkout,
                guests: 1,
                paymentOrderId: paymentOrder?.orderId,
                paymentProvider: paymentOrder?.provider || "MANUAL"
              })
            }
            disabled={bookingM.isPending || !paymentOrder}
          >
            Confirm Booking
          </button>
          {!paymentOrder ? <p className="tip">Create payment order before confirming booking.</p> : null}
        </div>

        <div className="card">
          <h3>Availability Snapshot</h3>
          {!canQuery ? <p>Add check-in/check-out to fetch availability.</p> : null}
          {(availabilityQ.data || []).map(item => (
            <div key={item.roomType} className="row">
              <strong>{item.roomType}</strong>
              <span>Available: {item.available}</span>
              <span>INR {item.pricePerNight}/night</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Calendar Booking View</h3>
        {(calendarQ.data || []).map(event => (
          <div key={event.id} className="row">
            <span>{event.title}</span>
            <span>
              {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
            </span>
            <button onClick={() => cancelM.mutate(event.id)} disabled={cancelM.isPending}>
              Cancel
            </button>
          </div>
        ))}
      </div>
      {message ? <p className="tip">{message}</p> : null}
    </div>
  );
}
