import { useState } from "react";

const AppointmentBooking = () => {
  const [appointment, setAppointment] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  const handleChange = (e) => {
    setAppointment({
      ...appointment,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(appointment);
    alert("Appointment Booked Successfully");
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Book Appointment</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 space-y-5"
      >
        <div>
          <label className="block mb-2 font-semibold">Select Doctor</label>
          <select
            name="doctor"
            className="w-full border rounded-lg p-3"
            onChange={handleChange}
          >
            <option value="">Choose Doctor</option>
            <option>Dr. Sharma</option>
            <option>Dr. Patel</option>
            <option>Dr. Khan</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Appointment Date</label>
          <input
            type="date"
            name="date"
            className="w-full border rounded-lg p-3"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Appointment Time</label>
          <input
            type="time"
            name="time"
            className="w-full border rounded-lg p-3"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Reason</label>
          <textarea
            name="reason"
            rows="4"
            className="w-full border rounded-lg p-3"
            placeholder="Describe your problem..."
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Book Appointment
        </button>
      </form>
    </div>
  );
};

export default AppointmentBooking;