import React from "react";

const stats = [
  {
    title: "Today's Appointments",
    value: 12,
    color: "bg-blue-500",
  },
  {
    title: "Total Patients",
    value: 145,
    color: "bg-green-500",
  },
  {
    title: "Pending Prescriptions",
    value: 8,
    color: "bg-yellow-500",
  },
  {
    title: "Completed Consultations",
    value: 97,
    color: "bg-purple-500",
  },
];

const appointments = [
  {
    id: 1,
    patient: "Rahul Sharma",
    time: "10:00 AM",
    status: "Confirmed",
  },
  {
    id: 2,
    patient: "Priya Patel",
    time: "11:30 AM",
    status: "Pending",
  },
  {
    id: 3,
    patient: "Amit Singh",
    time: "02:00 PM",
    status: "Completed",
  },
];

export default function DoctorDashboard() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">
        Doctor Dashboard
      </h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((item, index) => (
          <div
            key={index}
            className={`${item.color} text-white rounded-xl p-6 shadow-lg`}
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-4xl font-bold mt-3">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">
          Today's Appointments
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Patient</th>
              <th className="text-left py-3">Time</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-4">{item.patient}</td>
                <td>{item.time}</td>
                <td>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 flex-wrap">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg">
            View Patients
          </button>

          <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">
            Add Prescription
          </button>

          <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg">
            Medical Records
          </button>
        </div>
      </div>
    </div>
  );
}