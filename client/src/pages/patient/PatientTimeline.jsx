const timeline = [
  {
    date: "20 Jul 2026",
    title: "General Checkup",
    doctor: "Dr. Sharma",
  },
  {
    date: "15 Jul 2026",
    title: "Blood Test",
    doctor: "Lab Department",
  },
  {
    date: "08 Jul 2026",
    title: "Prescription Updated",
    doctor: "Dr. Patel",
  },
];

export default function PatientTimeline() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">
        Patient Timeline
      </h1>

      <div className="space-y-5">
        {timeline.map((item, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-lg p-5 border-l-4 border-blue-600"
          >
            <h2 className="font-bold">{item.title}</h2>
            <p>{item.doctor}</p>
            <span className="text-gray-500 text-sm">
              {item.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}